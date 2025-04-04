// components/RainbowKitProvider.tsx
"use client";

import { ReactNode } from "react";
import {
  RainbowKitProvider as RKProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi-config";

// Create a client
const queryClient = new QueryClient();

interface RainbowKitProviderProps {
  children: ReactNode;
}

export function RainbowKitProvider({ children }: RainbowKitProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RKProvider
          theme={darkTheme({
            accentColor: "black",
            accentColorForeground: "white",
            borderRadius: "small",
          })}
        >
          {children}
        </RKProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
