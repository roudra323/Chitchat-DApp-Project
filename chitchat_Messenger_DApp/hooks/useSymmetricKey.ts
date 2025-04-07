// hooks/useSymmetricKey.ts
import { useState } from 'react';
import { Address } from 'viem';
import { loadSymmetricKey, saveSymmetricKey, hasSymmetricKey } from '@/utils/keyStorage';
import { loadPrivateKey } from '@/utils/rsaKeyUtils';
import { uint8ArrayToBase64, base64ToUint8Array, hexToUint8Array, uint8ArrayToHex, anyToUint8Array } from '@/utils/keyFormat';

export function useSymmetricKey() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * Generates or retrieves an existing symmetric key for a friend
     * Returns a Base64 encoded string of the key
     */
    const getOrCreateSymmetricKey = async (friendAddress?: string): Promise<string> => {
        setIsLoading(true);
        try {
            // If we have a friend address and an existing key, return it
            if (friendAddress && hasSymmetricKey(friendAddress)) {
                const existingKey = loadSymmetricKey(friendAddress);
                if (existingKey) {
                    return uint8ArrayToBase64(existingKey);
                }
            }

            // Generate a new symmetric key using AES-GCM 256-bit
            const key = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true, // extractable
                ["encrypt", "decrypt"]
            );

            // Export the key as raw bytes
            const rawKey = await window.crypto.subtle.exportKey("raw", key);
            const keyBytes = new Uint8Array(rawKey);

            // Save if we have a friend address
            if (friendAddress) {
                saveSymmetricKey(friendAddress, keyBytes);
            }

            return uint8ArrayToBase64(keyBytes);
        } catch (err) {
            console.error("Error generating symmetric key:", err);
            setError(err instanceof Error ? err.message : "Unknown error generating key");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Encrypt data with a symmetric key
     * @param data The string data to encrypt
     * @param keyString Base64 encoded symmetric key
     * @returns Base64 encoded encrypted data (with IV prefixed)
     */
    const encryptWithSymmetricKey = async (data: string, keyString: string): Promise<string> => {
        setIsLoading(true);
        try {
            // Convert the key from Base64 string to Uint8Array
            const keyBytes = base64ToUint8Array(keyString);

            // Import the symmetric key
            const key = await window.crypto.subtle.importKey(
                "raw",
                keyBytes,
                {
                    name: "AES-GCM",
                    length: 256,
                },
                false, // not extractable
                ["encrypt"]
            );

            // Generate a random IV (Initialization Vector)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Encrypt the data
            const encodedData = new TextEncoder().encode(data);
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv,
                },
                key,
                encodedData
            );

            // Concatenate IV and encrypted data
            const result = new Uint8Array(iv.length + encryptedData.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encryptedData), iv.length);

            // Convert to Base64 for storage or transmission
            return uint8ArrayToBase64(result);
        } catch (err) {
            console.error("Encryption error:", err);
            setError(err instanceof Error ? err.message : "Unknown encryption error");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Decrypt data with a symmetric key
     * @param encryptedData Base64 encoded encrypted data (with IV prefixed)
     * @param keyString Base64 encoded symmetric key
     * @returns Decrypted string data
     */
    const decryptWithSymmetricKey = async (encryptedData: string, keyString: string): Promise<string> => {
        setIsLoading(true);
        try {
            // Convert from Base64 to Uint8Array
            const encryptedBytes = base64ToUint8Array(encryptedData);

            // Extract the IV (first 12 bytes)
            const iv = encryptedBytes.slice(0, 12);
            const data = encryptedBytes.slice(12);

            // Convert the key from Base64 string to Uint8Array
            const keyBytes = base64ToUint8Array(keyString);

            // Import the symmetric key
            const key = await window.crypto.subtle.importKey(
                "raw",
                keyBytes,
                {
                    name: "AES-GCM",
                    length: 256,
                },
                false, // not extractable
                ["decrypt"]
            );

            // Decrypt the data
            const decryptedData = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv,
                },
                key,
                data
            );

            // Convert decrypted data to string
            return new TextDecoder().decode(decryptedData);
        } catch (err) {
            console.error("Decryption error:", err);
            setError(err instanceof Error ? err.message : "Unknown decryption error");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Decrypt a symmetric key that was encrypted with the user's public key
     * @param encryptedKeyData The encrypted key data (hex or base64)
     * @param userAddress The user's blockchain address
     * @returns Base64 encoded symmetric key
     */
    const decryptSymmetricKeyWithPrivateKey = async (
        encryptedKeyData: string,
        userAddress: Address
    ): Promise<string> => {
        setIsLoading(true);
        try {
            // Convert input to Uint8Array regardless of format
            const encryptedKeyBytes = anyToUint8Array(encryptedKeyData);

            // Load the private key
            const privateKey = await loadPrivateKey(userAddress);

            // Decrypt the symmetric key
            const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP",
                },
                privateKey,
                encryptedKeyBytes
            );

            // Convert to Base64 string for consistent handling
            const symmetricKey = uint8ArrayToBase64(new Uint8Array(decryptedKeyBuffer));

            return symmetricKey;
        } catch (err) {
            console.error("Error decrypting symmetric key:", err);
            setError(err instanceof Error ? err.message : "Unknown error decrypting key");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Get stored symmetric key for a conversation
     * @returns Base64 encoded symmetric key or null if not found
     */
    const getStoredSymmetricKey = (friendAddress: string): string | null => {
        try {
            const keyBytes = loadSymmetricKey(friendAddress);
            if (!keyBytes) return null;
            return uint8ArrayToBase64(keyBytes);
        } catch (err) {
            console.error("Error retrieving symmetric key:", err);
            setError(err instanceof Error ? err.message : "Unknown error retrieving key");
            return null;
        }
    };

    /**
     * Encrypt a symmetric key with a public key
     * @param symmetricKey Base64 encoded symmetric key
     * @param publicKeyBytes Public key as Uint8Array
     * @returns Hex string of the encrypted key (with 0x prefix)
     */
    const encryptSymmetricKeyForContract = async (
        symmetricKey: string,
        publicKeyBytes: Uint8Array
    ): Promise<string> => {
        setIsLoading(true);
        try {
            // Convert symmetric key from Base64 to Uint8Array
            const symmetricKeyBytes = base64ToUint8Array(symmetricKey);

            // Import the public key
            const publicKey = await window.crypto.subtle.importKey(
                "spki",
                publicKeyBytes,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                false,
                ["encrypt"]
            );

            // Encrypt the symmetric key
            const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                publicKey,
                symmetricKeyBytes
            );

            // Convert to hex for blockchain storage
            return uint8ArrayToHex(new Uint8Array(encryptedKeyBuffer));
        } catch (err) {
            console.error("Error encrypting symmetric key:", err);
            setError(err instanceof Error ? err.message : "Unknown error encrypting key");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        encryptWithSymmetricKey,
        decryptWithSymmetricKey,
        decryptSymmetricKeyWithPrivateKey,
        getOrCreateSymmetricKey,
        getStoredSymmetricKey,
        encryptSymmetricKeyForContract,
        isLoading,
        error,
    };
}