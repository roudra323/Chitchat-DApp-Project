// import { Address } from "viem";

// export async function loadPrivateKey(account: Address): Promise<CryptoKey> {
//     const base64 = localStorage.getItem(`rsa-private-key-${account}`);
//     if (!base64) throw new Error("Private key not found");

//     const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
//     return await window.crypto.subtle.importKey(
//         "pkcs8",
//         binary.buffer,
//         {
//             name: "RSA-OAEP",
//             hash: "SHA-256",
//         },
//         true,
//         ["decrypt"]
//     );
// }
