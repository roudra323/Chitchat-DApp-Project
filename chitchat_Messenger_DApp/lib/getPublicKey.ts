import { ethers } from "ethers";
import { Address } from "viem";

/**
 * Get the uncompressed public key from a connected wallet via message signing.
 * @param signer ethers.js Signer from your useEthersWithRainbow hook.
 * @param address The user's wallet address (for signing params).
 * @returns The uncompressed public key (hex string).
 */
export async function getPublicKeyFromSignature(
    provider: ethers.providers.JsonRpcBatchProvider,
    address: Address
): Promise<{ publicKey: string; recoveredAddress: string }> {
    const message = "The Public Key is used to enable end to end encryption. Please sign it to get your public key.";

    // Step 1: Hash the message like personal_sign does
    const messageBytes = ethers.utils.toUtf8Bytes(message);
    const messageHash = ethers.utils.hashMessage(message);

    // Step 2: Ask MetaMask to sign the message
    if (!provider) throw new Error("No provider available");

    const signature = await provider.send("personal_sign", [
        ethers.utils.hexlify(messageBytes),
        address.toLowerCase(),
    ]);

    // Step 3: Recover the public key and address
    const publicKey = ethers.utils.recoverPublicKey(messageHash, signature);
    const recoveredAddress = ethers.utils.recoverAddress(messageHash, signature);

    return {
        publicKey,
        recoveredAddress,
    };
}