// // lib/symmetricKeyStorage.ts
// export function saveSymmetricKey(friendAddress: string, key: Uint8Array) {
//     const encoded = btoa(String.fromCharCode(...key));
//     localStorage.setItem(`chitchat:symkey:${friendAddress}`, encoded);
// }

// export function loadSymmetricKey(friendAddress: string): Uint8Array | null {
//     const stored = localStorage.getItem(`chitchat:symkey:${friendAddress}`);
//     if (!stored) return null;
//     return new Uint8Array(atob(stored).split("").map((c) => c.charCodeAt(0)));
// }
