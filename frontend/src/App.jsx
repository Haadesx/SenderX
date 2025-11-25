import React, { useEffect, useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RoomScreen } from './components/RoomScreen';
import { useStore } from './store';
import { socket } from './lib/socket';

function App() {
  const { nickname, room, setPeers, addPeer, removePeer } = useStore();
  const [inRoom, setInRoom] = useState(false);

  useEffect(() => {
    // Socket event listeners
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('user-joined', (user) => {
      addPeer(user);
    });

    socket.on('user-left', ({ id }) => {
      removePeer(id);
    });

    socket.on('existing-peers', (peers) => {
      setPeers(peers);
    });

    return () => {
      socket.off('connect');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('existing-peers');
    };
  }, []);

  const handleJoin = (nick, roomCode) => {
    socket.connect();
    socket.emit('join-room', { nickname: nick, room: roomCode });
    setInRoom(true);
  };

  const handleLeave = () => {
    socket.disconnect();
    setInRoom(false);
    setPeers([]);
  };

  // Auto-join if params exist (optional feature)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !inRoom) {
      // Pre-fill room code in store?
      // For now, just let the user see it in the welcome screen if we updated the store
    }
  }, []);

  return (
    <>
      <div className="cosmic-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
      {inRoom ? <RoomScreen onLeave={handleLeave} /> : <WelcomeScreen onJoin={handleJoin} />}
    </>
  );
}

export default App;
