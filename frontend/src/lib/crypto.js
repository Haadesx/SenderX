// Web Crypto API helpers for E2E encryption

export async function generateKeyPair() {
    return await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
}

export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return exported;
}

export async function importPublicKey(jwk) {
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        []
    );
}

export async function deriveSharedKey(privateKey, publicKey) {
    return await window.crypto.subtle.deriveKey(
        {
            name: "ECDH",
            public: publicKey,
        },
        privateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptChunk(key, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.byteLength + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.byteLength);
    return result;
}

export async function decryptChunk(key, data) {
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    return await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encrypted
    );
}
