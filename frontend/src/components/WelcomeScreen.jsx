import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export function WelcomeScreen({ onJoin }) {
    const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
    const [room, setRoom] = useState(generateRoomCode());

    function generateRoomCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (nickname && room) {
            localStorage.setItem('nickname', nickname);
            onJoin(nickname, room);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-panel p-8 rounded-3xl w-full max-w-md relative overflow-hidden"
            >
                {/* Decorative Glow */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block p-4 rounded-full bg-white/5 mb-4 border border-white/10"
                    >
                        <Zap className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                        SenderX
                    </h1>
                    <p className="text-gray-400">Universal File Transfer</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Display Name</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50"
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">Room Code</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value.toUpperCase())}
                                    className="w-full px-4 py-3 rounded-xl glass-input placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 uppercase tracking-widest font-mono"
                                    placeholder="e.g. ROOM123"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setRoom(generateRoomCode())}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                                    title="Generate Random Code"
                                >
                                    <Zap className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all flex items-center justify-center gap-2"
                    >
                        Join Room <ArrowRight className="w-5 h-5" />
                    </motion.button>
                </form>

                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    <Feature icon={<Shield className="w-5 h-5" />} text="Secure" />
                    <Feature icon={<Zap className="w-5 h-5" />} text="Fast" />
                    <Feature icon={<Globe className="w-5 h-5" />} text="P2P" />
                </div>
            </motion.div>
        </div>
    );
}

function Feature({ icon, text }) {
    return (
        <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                {icon}
            </div>
            <span className="text-xs font-medium">{text}</span>
        </div>
    );
}
