import { socket } from './socket';

const CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export class WebRTCManager {
    constructor(myId, onDataChannelOpen, onDataChannelMessage) {
        this.myId = myId;
        this.peers = new Map(); // peerId -> RTCPeerConnection
        this.dataChannels = new Map(); // peerId -> RTCDataChannel
        this.onDataChannelOpen = onDataChannelOpen;
        this.onDataChannelMessage = onDataChannelMessage;

        // Listen for signals
        socket.on('signal', this.handleSignal.bind(this));
    }

    async connectToPeer(peerId) {
        if (this.peers.has(peerId)) return;

        const pc = this.createPeerConnection(peerId);
        const dc = pc.createDataChannel('file-transfer');
        this.setupDataChannel(peerId, dc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('signal', {
            target: peerId,
            type: 'offer',
            payload: offer
        });
    }

    createPeerConnection(peerId) {
        const pc = new RTCPeerConnection(CONFIG);
        this.peers.set(peerId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', {
                    target: peerId,
                    type: 'ice-candidate',
                    payload: event.candidate
                });
            }
        };

        pc.ondatachannel = (event) => {
            this.setupDataChannel(peerId, event.channel);
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.cleanupPeer(peerId);
            }
        };

        return pc;
    }

    setupDataChannel(peerId, dc) {
        this.dataChannels.set(peerId, dc);
        dc.onopen = () => {
            console.log(`Data channel open with ${peerId}`);
            if (this.onDataChannelOpen) this.onDataChannelOpen(peerId);
        };
        dc.onmessage = (event) => {
            if (this.onDataChannelMessage) this.onDataChannelMessage(peerId, event.data);
        };
    }

    async handleSignal({ source, type, payload }) {
        let pc = this.peers.get(source);

        if (!pc) {
            if (type === 'offer') {
                pc = this.createPeerConnection(source);
            } else {
                console.warn('Received signal for unknown peer', source);
                return;
            }
        }

        try {
            if (type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('signal', {
                    target: source,
                    type: 'answer',
                    payload: answer
                });
            } else if (type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload));
            } else if (type === 'ice-candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(payload));
            }
        } catch (err) {
            console.error('Error handling signal:', err);
        }
    }

    sendData(peerId, data) {
        const dc = this.dataChannels.get(peerId);
        if (dc && dc.readyState === 'open') {
            try {
                dc.send(data);
                return true;
            } catch (e) {
                console.error("Error sending data via WebRTC:", e);
                return false;
            }
        }
        return false;
    }

    cleanupPeer(peerId) {
        const pc = this.peers.get(peerId);
        if (pc) {
            pc.close();
            this.peers.delete(peerId);
        }
        this.dataChannels.delete(peerId);
    }

    cleanupAll() {
        this.peers.forEach(pc => pc.close());
        this.peers.clear();
        this.dataChannels.clear();
        socket.off('signal');
    }
}
