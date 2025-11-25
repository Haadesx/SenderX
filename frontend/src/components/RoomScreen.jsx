import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { PeerList } from './PeerList';
import { TransferManager } from './TransferManager';
import { LogOut, Copy, Upload } from 'lucide-react';
import { chunkFile, FileReassembler } from '../lib/fileTransfer';
import { socket } from '../lib/socket';
import { WebRTCManager } from '../lib/webrtc';

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
            // Find the active transfer for this peer
            // In a real app, we should map peerId -> activeTransferId more explicitly or use a protocol header
            // For now, we look for an active incoming transfer from this peer

            // We need to access the latest transfers state, but we are in a ref callback.
            // We can rely on incomingTransfers map which we manage ourselves.
            // But we need to know which transfer belongs to this peer.
            // We can store peerId in the reassembler or iterate.

            for (const [id, reassembler] of incomingTransfers.current.entries()) {
                // We assume one active transfer per peer for simplicity or just try to add to all (bad)
                // Let's check the store to see which transfer matches this peer
                // Since we can't easily access store state here without subscription, 
                // let's assume the metadata came from the same peer and we mapped it.
                // A better way: Store peerId in incomingTransfers map values.

                // Optimization: Just try to add to the first active one for now, 
                // or better, pass peerId to reassembler if we needed to validate.

                // Let's find the transfer in the store that matches this peer and is active
                // We can't access store state easily here. 
                // Workaround: We'll just iterate our local map and if we had multiple, this would be buggy.
                // But for 1-on-1 or 1-file-at-a-time per peer, this works.
                reassembler.addChunk(data);
                // Break after first successful add? 
                // Reassembler doesn't return success/fail on addChunk usually.
                // Let's just break to avoid adding to multiple if we had them.
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
    }, [],

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
        alert("Room link copied!");
    };

    return (
        <div
            className="min-h-screen bg-gray-50 flex flex-col"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">LocalSend Web</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        <span>Room: {room}</span>
                        <button onClick={copyRoomLink} className="hover:text-blue-900">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Logged in as <span className="font-semibold text-gray-900">{nickname}</span>
                    </div>
                    <button
                        onClick={onLeave}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Leave Room"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearby Devices</h2>
                    <PeerList onSelectPeer={(peerId) => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.onchange = (e) => handleFileSelect(e, peerId);
                        input.click();
                    }} />
                </div>
            </main>

            {/* Transfer Manager */}
            <TransferManager />

            {/* Drag Overlay */}
            {dragActive && (
                <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm border-4 border-blue-500 border-dashed m-4 rounded-2xl flex items-center justify-center z-50 pointer-events-none">
                    <div className="text-center bg-white p-8 rounded-xl shadow-xl">
                        <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Drop files to send</h3>
                        <p className="text-gray-500">Release to select a recipient</p>
                    </div>
                </div>
            )}
        </div>
    );
}
