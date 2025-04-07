// utils/rsaKeyUtils.ts
import { Address } from "viem";
import { saveRSAPrivateKey } from "./keyStorage";
import { uint8ArrayToBase64, base64ToUint8Array } from "./keyFormat";

/**
 * Generate a new RSA key pair and store the private key securely
 * Returns the public key bytes for sharing
 */
export async function generateRSAKeyPair(account: Address): Promise<{
    publicKeyBytes: Uint8Array;
}> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    // Export private key in PKCS#8 format
    const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Save private key with consistent encoding
    saveRSAPrivateKey(account, exportedPrivate);

    // Export public key in SPKI format
    const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyBytes = new Uint8Array(exportedPublic);

    return {
        publicKeyBytes,
    };
}

/**
 * Load the private key for an account from storage and import it as a CryptoKey
 */
export async function loadPrivateKey(account: Address): Promise<CryptoKey> {
    const privateKeyBytes = loadPrivateKeyBytes(account);
    if (!privateKeyBytes) throw new Error("Private key not found for account");

    return await window.crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["decrypt"]
    );
}

/**
 * Load private key bytes from storage
 */
export function loadPrivateKeyBytes(account: Address): Uint8Array | null {
    const base64 = localStorage.getItem(`chitchat:rsa:private:${account}`);
    if (!base64) return null;

    return base64ToUint8Array(base64);
}

/**
 * Import a public key from bytes into a CryptoKey object
 */
export async function importPublicKey(publicKeyBytes: Uint8Array): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        "spki",
        publicKeyBytes,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        ["encrypt"]
    );
}

/**
 * Check if an account has a private key stored
 */
export function hasPrivateKey(account: Address): boolean {
    return localStorage.getItem(`chitchat:rsa:private:${account}`) !== null;
}