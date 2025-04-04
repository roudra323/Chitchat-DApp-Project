// hooks/useEthersWithRainbow.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
// Import your contract ABI and address
import ChitChatABI from "../contracts/ChatChatABI.json"; // Adjust the path as necessary

// Contract address constants
const CHITCHAT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CHITCHAT_CONTRACT_ADDRESS || "0x..."; // Replace with your contract address

export function useEthersWithRainbow() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  // Change the type to accept all providers, not just Web3Provider
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(
    null
  );
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // console.log("isConnected", isConnected);
  // console.log("isConnecting", isConnecting);
  // console.log("isDisconnected", isDisconnected);
  // console.log("address", address);
  // console.log("provider", provider);
  // console.log("signer", signer);

  useEffect(() => {
    if (isConnected && window.ethereum) {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethersProvider);
      setSigner(ethersProvider.getSigner());
    } else {
      // Fallback to a read-only provider when not connected
      const fallbackProvider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
      );
      setProvider(fallbackProvider);
      setSigner(null);
    }
  }, [isConnected, address]);

  // Function to get contract instance for both read and write operations
  const getContract = (contractAddress: string, contractABI: any) => {
    if (signer) {
      // Use signer for write operations when wallet is connected
      return new ethers.Contract(contractAddress, contractABI, signer);
    } else if (provider) {
      // Use provider for read-only operations
      return new ethers.Contract(contractAddress, contractABI, provider);
    }
    return null;
  };

  // Create memoized contract instances
  const chitChatContract = useMemo(() => {
    return getContract(CHITCHAT_CONTRACT_ADDRESS, ChitChatABI);
  }, [provider, signer]);

  // Add more contracts as needed
  // const anotherContract = useMemo(() => {
  //   return getContract(ANOTHER_CONTRACT_ADDRESS, AnotherContractABI.abi);
  // }, [provider, signer]);

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    provider,
    signer,
    getContract, // Keep this for flexibility
    // Return specific contract instances
    contracts: {
      chitChat: chitChatContract,
      // anotherContract: anotherContract,
    },
  };
}
