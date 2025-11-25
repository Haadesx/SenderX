const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ORIGIN || '*';

// Middleware
app.use(helmet());
app.use(cors({
    origin: ORIGIN
}));
app.use(express.json());

// Serve Static Frontend
const path = require('path');
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: ORIGIN,
        methods: ["GET", "POST"]
    }
});

// State
const rooms = new Map(); // RoomID -> Set<SocketID>

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join Room
    socket.on('join-room', ({ room, nickname }) => {
        socket.join(room);

        if (!rooms.has(room)) {
            rooms.set(room, new Set());
        }
        rooms.get(room).add(socket.id);

        // Store metadata on socket for easy access
        socket.data.room = room;
        socket.data.nickname = nickname;

        // Notify others in room
        socket.to(room).emit('user-joined', {
            id: socket.id,
            nickname: nickname
        });

        // Send list of existing peers to the new user
        const peers = [];
        const roomSockets = io.sockets.adapter.rooms.get(room);
        if (roomSockets) {
            roomSockets.forEach(id => {
                if (id !== socket.id) {
                    const peerSocket = io.sockets.sockets.get(id);
                    if (peerSocket) {
                        peers.push({
                            id: id,
                            nickname: peerSocket.data.nickname
                        });
                    }
                }
            });
        }
        socket.emit('existing-peers', peers);

        console.log(`User ${nickname} (${socket.id}) joined room ${room}`);
    });

    // WebRTC Signaling
    socket.on('signal', ({ target, type, payload }) => {
        io.to(target).emit('signal', {
            source: socket.id,
            type,
            payload
        });
    });

    // Relay Data (Fallback)
    socket.on('relay-data', ({ target, data, metadata }) => {
        // Forward encrypted chunk to target
        io.to(target).emit('relay-data', {
            source: socket.id,
            data,
            metadata
        });
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        const { room, nickname } = socket.data;
        if (room) {
            socket.to(room).emit('user-left', { id: socket.id });

            if (rooms.has(room)) {
                rooms.get(room).delete(socket.id);
                if (rooms.get(room).size === 0) {
                    rooms.delete(room);
                }
            }
            console.log(`User ${nickname} (${socket.id}) left room ${room}`);
        } else {
            console.log(`User disconnected: ${socket.id}`);
        }
    });
});

// Catch-all for React Routing
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
