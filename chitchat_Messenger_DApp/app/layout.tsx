import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
// import { SocketProvider } from "@/lib/socket-context";
import { MessageSquare } from "lucide-react";
import "@rainbow-me/rainbowkit/styles.css"; // Add this for RainbowKit styles
import { RainbowKitProvider } from "@/components/RainbowKitProvider";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import { Toaster } from "@/components/ui/toaster";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RainbowKitProvider>
          <ThemeProvider attribute="class" defaultTheme="light">
            <header className="container mx-auto py-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">ChitChat</h1>
              </div>
              <div className="container mx-auto flex justify-end items-center">
                <ConnectWalletButton />
              </div>
            </header>
            <main className="container mx-auto p-4">{children}</main>
            <Toaster />
          </ThemeProvider>
          <Toaster />
        </RainbowKitProvider>
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  generator: "v0.dev",
};
