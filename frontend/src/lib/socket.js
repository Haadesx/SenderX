import { io } from 'socket.io-client';

// Determine backend URL
// In development, it might be localhost:3000
// In production, it should be configurable or relative if served from same origin
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '/');

export const socket = io(BACKEND_URL, {
    autoConnect: false,
    reconnection: true,
});
