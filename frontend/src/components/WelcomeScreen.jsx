import React, { useState } from 'react';
import { useStore } from '../store';
import { ArrowRight, Zap } from 'lucide-react';

export function WelcomeScreen({ onJoin }) {
    const { nickname, room, setNickname, setRoom } = useStore();
    const [localNick, setLocalNick] = useState(nickname);
    const [localRoom, setLocalRoom] = useState(room || generateRoomCode());

    function generateRoomCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    const handleJoin = (e) => {
        e.preventDefault();
        if (localNick && localRoom) {
            setNickname(localNick);
            setRoom(localRoom);
            onJoin(localNick, localRoom);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Zap className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">LocalSend Web</h1>
                    <p className="text-gray-500 mt-2">Secure, browser-based file sharing</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Varesh-Laptop"
                            value={localNick}
                            onChange={(e) => setLocalNick(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                                placeholder="e.g. A7FQ"
                                value={localRoom}
                                onChange={(e) => setLocalRoom(e.target.value.toUpperCase())}
                            />
                            <button
                                type="button"
                                onClick={() => setLocalRoom(generateRoomCode())}
                                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                Random
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        Start Sharing
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
