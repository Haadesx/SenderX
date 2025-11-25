import React from 'react';
import { useStore } from '../store';
import { File, ArrowUp, ArrowDown, CheckCircle, XCircle, Loader } from 'lucide-react';

export function TransferManager() {
    const transfers = useStore((state) => state.transfers);

    if (transfers.length === 0) return null;

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-96 bg-white shadow-2xl border-t border-gray-200 max-h-[50vh] overflow-y-auto z-50">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0">
                <h3 className="font-semibold text-gray-900">Transfers</h3>
                <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {transfers.length}
                </span>
            </div>
            <div className="divide-y divide-gray-100">
                {transfers.map((transfer) => (
                    <div key={transfer.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center overflow-hidden">
                                <div className={`p-2 rounded-lg mr-3 ${transfer.type === 'incoming' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {transfer.type === 'incoming' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={transfer.fileName}>
                                        {transfer.fileName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatBytes(transfer.size)} • {transfer.status}
                                    </p>
                                </div>
                            </div>
                            <div className="ml-2 flex-shrink-0">
                                {transfer.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                {transfer.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                                {(transfer.status === 'active' || transfer.status === 'pending') && (
                                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                                )}
                            </div>
                        </div>

                        {transfer.status === 'active' && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(transfer.progress * 100).toFixed(1)}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
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
