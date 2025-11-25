import React from 'react';
import { useStore } from '../store';
import { File, ArrowUp, ArrowDown, CheckCircle, XCircle, Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TransferManager() {
    const transfers = useStore((state) => state.transfers);

    if (transfers.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl overflow-hidden"
        >
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-blue-400" />
                    Transfers
                </h3>
                <span className="text-xs font-medium bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                    {transfers.length} Active
                </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {transfers.map((transfer) => (
                        <motion.div
                            key={transfer.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group relative overflow-hidden"
                        >
                            {/* Progress Background */}
                            {transfer.status === 'active' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${transfer.progress * 100}%` }}
                                    transition={{ ease: "linear" }}
                                />
                            )}

                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg ${transfer.type === 'incoming'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {transfer.type === 'incoming' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate" title={transfer.fileName}>
                                            {transfer.fileName}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <span>{formatBytes(transfer.size)}</span>
                                            <span>•</span>
                                            <span className="capitalize">{transfer.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-2">
                                    {transfer.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400" />}
                                    {transfer.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                                    {(transfer.status === 'active' || transfer.status === 'pending') && (
                                        <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
