export class KeyManager {
    // Convert string to ArrayBuffer
    private static str2ab(str: string): ArrayBuffer {
        const encoder = new TextEncoder();
        return encoder.encode(str).buffer;
    }

    // Convert ArrayBuffer to string
    private static ab2str(buf: ArrayBuffer): string {
        const decoder = new TextDecoder();
        return decoder.decode(buf);
    }

    // Convert ArrayBuffer to Base64
    private static ab2base64(buf: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    // Convert Base64 to ArrayBuffer
    private static base642ab(base64: string): ArrayBuffer {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Generate a new Identity Key Pair (ECDH P-256)
    static async generateIdentityKeyPair(): Promise<CryptoKeyPair> {
        return window.crypto.subtle.generateKey(
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            true,
            ["deriveKey", "deriveBits"]
        );
    }

    // Export Public Key to Base64 string for sharing
    static async exportPublicKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("spki", key);
        return this.ab2base64(exported);
    }

    // Import Public Key from Base64 string
    static async importPublicKey(base64Key: string): Promise<CryptoKey> {
        const keyBuffer = this.base642ab(base64Key);
        return window.crypto.subtle.importKey(
            "spki",
            keyBuffer,
            {
                name: "ECDH",
                namedCurve: "P-256",
            },
            true,
            []
        );
    }

    // Derive a Shared Secret (AES-GCM Key) from my Private Key and Peer's Public Key
    static async deriveSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
        return window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: publicKey,
            },
            privateKey,
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Encrypt data with a Symmetric Key (AES-GCM)
    static async encrypt(key: CryptoKey, text: string): Promise<{ ciphertext: string; iv: string }> {
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = this.str2ab(text);

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            encodedText
        );

        return {
            ciphertext: this.ab2base64(encrypted),
            iv: this.ab2base64(iv.buffer),
        };
    }

    // Decrypt data with a Symmetric Key (AES-GCM)
    static async decrypt(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
        const encryptedData = this.base642ab(ciphertext);
        const ivBuffer = this.base642ab(iv);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivBuffer,
            },
            key,
            encryptedData
        );

        return this.ab2str(decrypted);
    }

    // Derive a Wrapping Key from a Signature (PBKDF2)
    // Used to encrypt/decrypt the local private key
    static async deriveWrappingKeyFromSignature(signature: string): Promise<CryptoKey> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(signature),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode("NODE_CHAT_SALT"), // Fixed salt for determinism
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );
    }
}
