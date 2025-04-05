import type React from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { RainbowKitProvider } from "@/components/RainbowKitProvider";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata = {
  title: "ChitChat - Secure Messaging",
  description: "Decentralized messaging application",
  generator: "v0.dev",
};

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
            {/* getting the error here */}
            {children}
            <Toaster />
          </ThemeProvider>
        </RainbowKitProvider>
      </body>
    </html>
  );
}
