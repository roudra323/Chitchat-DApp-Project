// import { Address } from "viem";

// // utils/generateEncryptionKey.ts
// export async function generateRSAKeyPair(account: Address): Promise<{
//     publicKeyBytes: Uint8Array;
// }> {
//     const keyPair = await window.crypto.subtle.generateKey(
//         {
//             name: "RSA-OAEP",
//             modulusLength: 2048,
//             publicExponent: new Uint8Array([1, 0, 1]),
//             hash: "SHA-256",
//         },
//         true,
//         ["encrypt", "decrypt"]
//     );

//     // Store the private key securely in localStorage (for now)
//     const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
//     const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedPrivate)));
//     localStorage.setItem(`rsa-private-key-${account}`, privateKeyBase64);

//     // Export the public key (SPKI format)
//     const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
//     const publicKeyBytes = new Uint8Array(exportedPublic);

//     console.log("Public Key Bytes:", publicKeyBytes);
//     console.log("Private Key Base64:", privateKeyBase64);

//     return {
//         publicKeyBytes,
//     };
// }
