// lib/wagmi-config.js
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { mainnet, goerli, sepolia } from "wagmi/chains";

// Define your local blockchain
const localChain = {
  id: 31337,
  name: "Localhost",
  network: "localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
};

// Configure chains and providers
export const config = getDefaultConfig({
  appName: "My DApp",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID, // Store in .env.local
  chains: [mainnet, goerli, sepolia, localChain],
  transports: {
    [mainnet.id]: http(),
    [goerli.id]: http(),
    [sepolia.id]: http(),
    [localChain.id]: http("http://127.0.0.1:8545"),
  },
});
