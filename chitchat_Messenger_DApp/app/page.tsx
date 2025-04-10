"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MessageSquare, Lock } from "lucide-react";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { ConnectWalletButton } from "@/components/ui/connect-button";

export default function LandingPage() {
  const { isConnected, address, contracts } = useEthersWithRainbow();
  const router = useRouter();
  const [loading, setLoading] = useState(true); // 🌀 loading state

  // Check and redirect
  useEffect(() => {
    const checkAccount = async () => {
      if (isConnected && address && contracts?.chitChat) {
        const registered = await contracts.chitChat.isUserRegistered(address);

        if (registered) {
          router.push("/dashboard");
        } else {
          router.push("/create-account");
        }
      }
      setLoading(false);
    };

    checkAccount();
  }, [isConnected, address, contracts, router]);

  if (loading) return null; // Or a spinner if you'd like

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">ChitChat</h1>
        </div>
      </header>

      <main className="container mx-auto flex flex-col items-center justify-center text-center flex-grow">
        <div className="max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Secure, Private Messaging for Web3
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            ChitChat is a decentralized messenger that puts your privacy first.
            Connect your wallet and start chatting securely.
          </p>
          <div className="flex justify-center">
            <ConnectWalletButton />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4 self-center" />
              <CardTitle>Decentralized</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                No central servers. Your messages are stored securely on the
                blockchain.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Lock className="h-12 w-12 text-primary mb-4 self-center" />
              <CardTitle>End-to-End Encrypted</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                All messages are encrypted. Only you and your recipient can read
                them.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <MessageSquare className="h-12 w-12 text-primary mb-4 self-center" />
              <CardTitle>Web3 Native</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Connect with your existing wallet. No new passwords to remember.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-muted py-8 mt-auto">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 ChitChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
