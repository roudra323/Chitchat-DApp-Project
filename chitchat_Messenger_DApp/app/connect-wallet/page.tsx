"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function ConnectWalletPage() {
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)

  const handleConnect = (wallet: string) => {
    setSelectedWallet(wallet)
    setConnecting(true)

    // Simulate wallet connection
    setTimeout(() => {
      setConnecting(false)
      router.push("/create-account")
    }, 2000)
  }

  const wallets = [
    { id: "metamask", name: "MetaMask" },
    { id: "walletconnect", name: "WalletConnect" },
    { id: "coinbase", name: "Coinbase Wallet" },
    { id: "rainbow", name: "Rainbow" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Choose a wallet to connect to ChitChat. This will be used for authentication and encryption.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {wallets.map((wallet) => (
              <Button
                key={wallet.id}
                variant={selectedWallet === wallet.id ? "default" : "outline"}
                className="h-24 flex flex-col gap-2 items-center justify-center"
                onClick={() => handleConnect(wallet.id)}
                disabled={connecting}
              >
                <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                  <Image src="/placeholder.svg?height=24&width=24" width={24} height={24} alt={wallet.name} />
                </div>
                <span>{wallet.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => router.push("/")}>
            Back to Home
          </Button>
          {connecting && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

