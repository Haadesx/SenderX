import React from 'react';
import { useStore } from '../store';
import { Monitor, Smartphone, User } from 'lucide-react';

export function PeerList({ onSelectPeer }) {
    const peers = useStore((state) => state.peers);

    if (peers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="mx-auto w-12 h-12 text-gray-300 mb-3">
                    <User className="w-full h-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No peers found</h3>
                <p className="text-gray-500 mt-1">Waiting for others to join room...</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {peers.map((peer) => (
                <button
                    key={peer.id}
                    onClick={() => onSelectPeer(peer.id)}
                    className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Monitor className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">{peer.nickname}</h3>
                        <p className="text-sm text-gray-500">Tap to send files</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
