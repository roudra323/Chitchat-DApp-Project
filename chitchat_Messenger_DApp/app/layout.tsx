import type React from "react";
import "./globals.css";
import { Providers } from "@/components/providers"; // <- New wrapper
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
