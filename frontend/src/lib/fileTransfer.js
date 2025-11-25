export const CHUNK_SIZE = 64 * 1024; // 64KB

export function chunkFile(file, onChunk) {
    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
        onChunk(e.target.result, offset);
        offset += e.target.result.byteLength;

        if (offset < file.size) {
            readNextChunk();
        } else {
            onChunk(null, offset); // EOF
        }
    };

    reader.onerror = (err) => {
        console.error("Error reading file:", err);
    };

    function readNextChunk() {
        const slice = file.slice(offset, offset + CHUNK_SIZE);
        reader.readAsArrayBuffer(slice);
    }

    readNextChunk();
}

export class FileReassembler {
    constructor(fileName, fileSize, onComplete, onProgress) {
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.receivedSize = 0;
        this.chunks = [];
        this.onComplete = onComplete;
        this.onProgress = onProgress;
        this.startTime = Date.now();
    }

    addChunk(data) {
        if (!data) {
            // EOF
            this.finish();
            return;
        }

        this.chunks.push(data);
        this.receivedSize += data.byteLength;

        if (this.onProgress) {
            this.onProgress(this.receivedSize / this.fileSize);
        }

        if (this.receivedSize >= this.fileSize) {
            this.finish();
        }
    }

    finish() {
        const blob = new Blob(this.chunks);
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - this.startTime) / 1000;
        if (this.onComplete) {
            this.onComplete(url, this.fileName);
        }
    }
}
