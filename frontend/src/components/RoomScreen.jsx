import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { PeerList } from './PeerList';
import { TransferManager } from './TransferManager';
import { LogOut, Copy, Upload, Share2, Users } from 'lucide-react';
import { chunkFile, FileReassembler } from '../lib/fileTransfer';
import { socket } from '../lib/socket';
import { WebRTCManager } from '../lib/webrtc';
import { motion, AnimatePresence } from 'framer-motion';

export function RoomScreen({ onLeave }) {
    const { nickname, room, addTransfer, updateTransfer, transfers } = useStore();
    const [dragActive, setDragActive] = useState(false);
    const [webrtc, setWebRTC] = useState(null);

    // Refs to keep track of active incoming transfers and handlers
    const incomingTransfers = useRef(new Map()); // transferId -> FileReassembler
    const handleIncomingDataRef = useRef(null);

    // Define the data handler
    handleIncomingDataRef.current = (peerId, data) => {
        // Check if data is metadata (JSON string) or chunk (ArrayBuffer)
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'metadata') {
                    const { transferId, fileName, size } = msg;

                    // Initialize Reassembler
                    const reassembler = new FileReassembler(fileName, size, (url, name) => {
                        // On Complete
                        updateTransfer(transferId, { status: 'completed', progress: 1 });

                        // Trigger Download
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = name;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);

                        incomingTransfers.current.delete(transferId);
                    }, (progress) => {
                        // On Progress
                        updateTransfer(transferId, { progress });
                    });

                    incomingTransfers.current.set(transferId, reassembler);

                    // Add to Store
                    addTransfer({
                        id: transferId,
                        fileName,
                        size,
                        progress: 0,
                        speed: 0,
                        type: 'incoming',
                        status: 'active',
                        peerId
                    });
                }
            } catch (e) {
                console.error("Failed to parse metadata", e);
            }
        } else {
            // It's a chunk (ArrayBuffer)
            for (const [id, reassembler] of incomingTransfers.current.entries()) {
                reassembler.addChunk(data);
                break;
            }
        }
    };

    // Initialize WebRTC
    useEffect(() => {
        const rtc = new WebRTCManager(
            socket.id,
            (peerId) => console.log('Data channel open with', peerId),
            (peerId, data) => {
                if (handleIncomingDataRef.current) {
                    handleIncomingDataRef.current(peerId, data);
                }
            }
        );
        setWebRTC(rtc);

        // Listen for Relay Data (Fallback)
        socket.on('relay-data', ({ source, data, metadata }) => {
            console.log(`Received relay data from ${source}`);
            if (handleIncomingDataRef.current) {
                handleIncomingDataRef.current(source, data);
            }
        });

        return () => {
            rtc.cleanupAll();
            socket.off('relay-data');
        };
    }, []);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            alert("Please select a peer to send files to.");
        }
    }, []);

    const handleFileSelect = async (e, targetPeerId) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        files.forEach(file => {
            const transferId = Math.random().toString(36).substr(2, 9);
            addTransfer({
                id: transferId,
                fileName: file.name,
                size: file.size,
                progress: 0,
                speed: 0,
                type: 'outgoing',
                status: 'active',
                peerId: targetPeerId
            });

            // Start sending
            webrtc.connectToPeer(targetPeerId).then(() => {
                const sendViaRelay = (data) => {
                    socket.emit('relay-data', {
                        target: targetPeerId,
                        data,
                        metadata: null // Optional, could be used for progress tracking
                    });
                    return true;
                };

                const sendData = (data) => {
                    if (webrtc.sendData(targetPeerId, data)) return true;
                    // Fallback to Relay
                    console.warn("WebRTC failed, using Relay");
                    return sendViaRelay(data);
                };

                // 1. Send Metadata
                const metadata = {
                    type: 'metadata',
                    transferId,
                    fileName: file.name,
                    fileType: file.type,
                    size: file.size
                };
                sendData(JSON.stringify(metadata));

                // 2. Send Chunks
                let sentBytes = 0;
                chunkFile(file, (chunk, offset) => {
                    if (chunk) {
                        if (sendData(chunk)) {
                            sentBytes += chunk.byteLength;
                            const progress = sentBytes / file.size;
                            updateTransfer(transferId, { progress });
                        }
                    } else {
                        updateTransfer(transferId, { status: 'completed', progress: 1 });
                    }
                });
            });
        });
    };

    const copyRoomLink = () => {
        const url = `${window.location.origin}?room=${room}`;
        navigator.clipboard.writeText(url);
        // Could add a toast here
    };

    return (
        <div
            className="min-h-screen flex flex-col relative"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-panel m-4 rounded-2xl px-6 py-4 flex justify-between items-center z-10"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                        <Share2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">SenderX</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Connected to Room {room}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={copyRoomLink}
                        className="glass-button p-2 rounded-xl text-gray-300 hover:text-white"
                        title="Copy Link"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex items-center gap-3 px-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{nickname}</div>
                            <div className="text-xs text-gray-400">Online</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {nickname[0].toUpperCase()}
                        </div>
                    </div>
                    <button
                        onClick={onLeave}
                        className="glass-button p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Leave Room"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="flex-1 p-4 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Peer List Section */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel rounded-3xl p-6 min-h-[400px]"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-purple-400" />
                                Nearby Devices
                            </h2>
                            <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-300">
                                Tap to send
                            </span>
                        </div>

                        <PeerList onSelectPeer={(peerId) => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.onchange = (e) => handleFileSelect(e, peerId);
                            input.click();
                        }} />
                    </motion.div>
                </div>

                {/* Transfer Manager Section */}
                <div className="lg:col-span-1">
                    <TransferManager />
                </div>
            </main>

            {/* Drag Overlay */}
            <AnimatePresence>
                {dragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-blue-600/20 backdrop-blur-md border-4 border-blue-500/50 border-dashed m-4 rounded-3xl flex items-center justify-center z-50 pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="text-center bg-black/50 p-8 rounded-3xl backdrop-blur-xl border border-white/10"
                        >
                            <Upload className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-bounce" />
                            <h3 className="text-2xl font-bold text-white">Drop files to send</h3>
                            <p className="text-gray-400">Release to select a recipient</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
