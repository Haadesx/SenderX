import { create } from 'zustand';

export const useStore = create((set) => ({
    // User State
    nickname: localStorage.getItem('nickname') || '',
    room: localStorage.getItem('room') || '',
    setNickname: (name) => {
        localStorage.setItem('nickname', name);
        set({ nickname: name });
    },
    setRoom: (room) => {
        localStorage.setItem('room', room);
        set({ room });
    },

    // Peers State
    peers: [], // Array of { id, nickname }
    setPeers: (peers) => set({ peers }),
    addPeer: (peer) => set((state) => ({ peers: [...state.peers, peer] })),
    removePeer: (peerId) => set((state) => ({ peers: state.peers.filter(p => p.id !== peerId) })),

    // Transfers State
    transfers: [], // Array of { id, fileName, size, progress, speed, type: 'incoming'|'outgoing', status: 'pending'|'active'|'completed'|'error', peerId }
    addTransfer: (transfer) => set((state) => ({ transfers: [...state.transfers, transfer] })),
    updateTransfer: (id, updates) => set((state) => ({
        transfers: state.transfers.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
}));
