"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Shield, MessageSquare, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";

export default function LandingPage() {
  const { isConnected } = useEthersWithRainbow();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/create-account"); // Redirect to the create-account page
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <main className="container mx-auto py-16 flex flex-col items-center">
        <div className="max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Secure, Private Messaging for Web3
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            ChitChat is a decentralized messenger that puts your privacy first.
            Connect your wallet and start chatting securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
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
              <Lock className="h-12 w-12 text-primary mb-4" />
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
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
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

      <footer className="bg-muted py-8">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 ChitChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
