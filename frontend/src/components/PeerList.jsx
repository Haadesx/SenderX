import React from 'react';
import { useStore } from '../store';
import { Smartphone, Laptop, Monitor, Tablet } from 'lucide-react';
import { motion } from 'framer-motion';

export function PeerList({ onSelectPeer }) {
    const peers = useStore((state) => state.peers);

    if (peers.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative bg-white/5 p-4 rounded-full border border-white/10">
                        <Monitor className="w-8 h-8 text-gray-400" />
                    </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-300">No devices found</h3>
                <p className="text-gray-500 text-sm mt-1">Waiting for others to join Room...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {peers.map((peer, index) => (
                <motion.button
                    key={peer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectPeer(peer.id)}
                    className="flex items-center p-4 rounded-2xl glass-button text-left group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                        {peer.nickname[0].toUpperCase()}
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#030014] rounded-full" />
                    </div>

                    <div className="ml-4 flex-1 min-w-0 relative">
                        <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                            {peer.nickname}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            Device
                        </p>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
