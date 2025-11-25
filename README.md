# LocalSend Web

A browser-based, privacy-focused file sharing application inspired by LocalSend.
Securely share files between devices in the same "room" without accounts, registration, or persistent servers.

## Features

-   **Room-based Isolation**: Join a room with a code to discover peers.
-   **P2P Transfer**: Direct WebRTC transfer for maximum speed (LAN/WAN).
-   **Encrypted Relay**: Fallback to end-to-end encrypted WebSocket relay if P2P fails.
-   **No Accounts**: Ephemeral sessions. No database.
-   **Privacy**: Server sees only encrypted chunks during relay; no file content logging.

## Architecture

### Frontend (`/frontend`)
-   **Framework**: React (Vite)
-   **Styling**: Tailwind CSS
-   **State**: Zustand
-   **Networking**: Socket.io-client, WebRTC (RTCPeerConnection, RTCDataChannel)
-   **Encryption**: Web Crypto API (ECDH + AES-GCM) for relay fallback.

### Backend (`/backend`)
-   **Runtime**: Node.js
-   **Framework**: Express + Socket.io
-   **Role**: Signaling server (discovery) and blind relay.
-   **State**: In-memory only (ephemeral).

## Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm

### Local Development

1.  **Start the Backend**
    ```bash
    cd backend
    npm install
    npm start
    # Server runs on http://localhost:3000
    ```

2.  **Start the Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    # App runs on http://localhost:5173
    ```

3.  **Test**: Open the frontend URL in two different browser windows/tabs. Join the same room.

## Deployment

### Frontend (GitHub Pages / Static)

1.  **Build**
    ```bash
    cd frontend
    npm run build
    ```
    Output is in `frontend/dist`.

2.  **Configure Backend URL**
    -   By default, it tries to connect to `localhost:3000` or the same origin.
    -   To point to a production backend, set the `VITE_BACKEND_URL` environment variable during build, or edit `src/lib/socket.js`.

3.  **Deploy**
    -   Upload the contents of `dist` to GitHub Pages, Netlify, Vercel, or any static host.

### Backend (Node.js / Docker)

**Option A: Docker (Recommended)**
```bash
cd backend
docker build -t localsend-server .
docker run -p 3000:3000 localsend-server
```

**Option B: Generic Node Host (Railway, Fly.io, etc.)**
-   Deploy the `/backend` folder.
-   Set environment variables:
    -   `PORT`: (default 3000)
    -   `ORIGIN`: The URL of your frontend (e.g., `https://username.github.io`) to allow CORS.

## Security Details

-   **P2P**: Uses WebRTC's built-in DTLS encryption.
-   **Relay**:
    1.  Peers exchange ephemeral ECDH public keys via the signaling server.
    2.  Shared AES-GCM key derived client-side.
    3.  File chunks are encrypted before sending to the server.
    4.  Server relays opaque blobs; cannot decrypt content.

## Limitations

-   **NAT Traversal**: Uses public STUN servers. Symmetric NATs might block P2P (fallback to relay will trigger).
-   **Browser Support**: Requires modern browsers with WebRTC and Web Crypto API support.
