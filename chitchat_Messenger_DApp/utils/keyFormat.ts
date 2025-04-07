// utils/keyFormat.ts
/**
 * Utility functions for consistent encoding/decoding of cryptographic keys
 */

import { hexlify } from "ethers/lib/utils";

/**
 * Converts a Uint8Array to a Base64 string
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, [...array]));
}

/**
 * Converts a Base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(
        atob(base64)
            .split('')
            .map(c => c.charCodeAt(0))
    );
}

/**
 * Converts a Uint8Array to a hex string with 0x prefix
 */
export function uint8ArrayToHex(array: Uint8Array): string {
    return '0x' + Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Converts a hex string (with or without 0x prefix) to a Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
    const hexString = hex.startsWith('0x') ? hex.slice(2) : hex;
    const matches = hexString.match(/.{1,2}/g);
    return new Uint8Array(matches ? matches.map(byte => parseInt(byte, 16)) : []);
}

/**
 * Attempts to detect and convert from any supported format to Uint8Array
 */
export function anyToUint8Array(data: string): Uint8Array {
    // If it's hex format
    if (data.match(/^(0x)?[0-9a-fA-F]+$/)) {
        return hexToUint8Array(data);
    }

    // Try as Base64
    try {
        return base64ToUint8Array(data);
    } catch (e) {
        // If it fails, just treat as raw string
        return new TextEncoder().encode(data);
    }
}