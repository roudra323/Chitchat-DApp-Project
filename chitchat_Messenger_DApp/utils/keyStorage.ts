// lib/keyStorage.ts
import { Address } from "viem";
import { uint8ArrayToBase64, base64ToUint8Array } from "../utils/keyFormat";

/**
 * Namespace prefix constants for localStorage keys
 */
const NAMESPACE = {
    RSA_PRIVATE: "chitchat:rsa:private:",
    SYMMETRIC_KEY: "chitchat:symkey:"
};

/**
 * Save RSA private key with consistent encoding
 */
export function saveRSAPrivateKey(account: Address, keyData: ArrayBuffer): void {
    const keyBytes = new Uint8Array(keyData);
    const base64Key = uint8ArrayToBase64(keyBytes);
    localStorage.setItem(`${NAMESPACE.RSA_PRIVATE}${account}`, base64Key);
    console.log("Saved RSA private key for account:", account);
}

/**
 * Load RSA private key with correct format
 */
export function loadRSAPrivateKeyBytes(account: Address): Uint8Array | null {
    const base64 = localStorage.getItem(`${NAMESPACE.RSA_PRIVATE}${account}`);
    if (!base64) return null;
    return base64ToUint8Array(base64);
}

/**
 * Save symmetric key with consistent encoding
 */
export function saveSymmetricKey(friendAddress: string, key: Uint8Array): void {
    const base64Key = uint8ArrayToBase64(key);
    localStorage.setItem(`${NAMESPACE.SYMMETRIC_KEY}${friendAddress}`, base64Key);
}

/**
 * Load symmetric key with correct format
 */
export function loadSymmetricKey(friendAddress: string): Uint8Array | null {
    const stored = localStorage.getItem(`${NAMESPACE.SYMMETRIC_KEY}${friendAddress}`);
    if (!stored) return null;
    return base64ToUint8Array(stored);
}

/**
 * Check if symmetric key exists for a friend
 */
export function hasSymmetricKey(friendAddress: string): boolean {
    return localStorage.getItem(`${NAMESPACE.SYMMETRIC_KEY}${friendAddress}`) !== null;
}

/**
 * Clear all keys for an account (for logout)
 */
export function clearAccountKeys(account: Address): void {
    // Clear RSA keys
    localStorage.removeItem(`${NAMESPACE.RSA_PRIVATE}${account}`);

    // Find and clear all symmetric keys (optional, depends on your application logic)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(NAMESPACE.SYMMETRIC_KEY)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
}