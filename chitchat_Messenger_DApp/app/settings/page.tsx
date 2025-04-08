"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import Image from "next/image";
import { SecurityTab } from "./security-tab";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { loadRSAPrivateKeyBytes } from "@/utils/keyStorage";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userIpfsHash, setUserIpfsHash] = useState<string | null>(null);
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null);
  const [userPrivateKey, setUserPrivateKey] = useState<Uint8Array | null>(null);
  const { address, isConnected, contracts } = useEthersWithRainbow();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isConnected && contracts?.chitChat) {
        const [name, ipfsHash] = await contracts.chitChat.getUserInfo(address);
        const publicKey = await contracts.chitChat.getUserPublicKey(address);
        const prvateKey = loadRSAPrivateKeyBytes(address as `0x${string}`);
        setUserPrivateKey(prvateKey);
        console.log("User Info:", { name, ipfsHash }, publicKey);
        setUserPublicKey(publicKey);
        setUserName(name);
        setUserIpfsHash(ipfsHash);
      }
    };

    fetchUserInfo();
  }, [address, isConnected, contracts?.chitChat]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b py-3 px-6 flex justify-between items-center bg-background z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        <div className="flex items-center gap-4">
          <ConnectWalletButton />

          <div className="relative">
            <Bell className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
            {/* <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              0
            </Badge> */}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <LogOut className="h-5 w-5" />
          </Button>

          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarImage
              src={
                `https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${userIpfsHash}` ||
                "/placeholder.svg?height=32&width=32"
              }
            />
            <AvatarFallback>{userName}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your ChitChat profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={
                          `https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${userIpfsHash}` ||
                          "/placeholder.svg?height=96&width=96"
                        }
                      />
                      <AvatarFallback className="text-2xl">
                        {userName ? userName[0]?.toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-medium">
                      {userName || "Anonymous User"}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <div className="p-2 bg-muted rounded-md">
                        {userName || "Not set"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Wallet Address</Label>
                      <div className="p-2 bg-muted rounded-md font-mono text-sm break-all">
                        {address || "Not connected"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Connected Wallet</CardTitle>
                  <CardDescription>
                    Your currently connected wallet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                        <Image
                          src="/placeholder.svg?height=24&width=24"
                          width={24}
                          height={24}
                          alt="MetaMask"
                        />
                      </div>
                      <div>
                        <p className="font-medium">MetaMask</p>
                        <p className="text-xs text-muted-foreground">
                          {address ? address : "0x123...4567"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecurityTab
                publicKey={userPublicKey}
                privateKey={userPrivateKey}
                account={address as `0x${string}`}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">
                        Enable notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications for new messages and friend
                        requests
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sound">Notification sounds</Label>
                      <p className="text-xs text-muted-foreground">
                        Play a sound when you receive a notification
                      </p>
                    </div>
                    <Switch
                      id="sound"
                      defaultChecked
                      disabled={!notifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="read-receipts">Read receipts</Label>
                      <p className="text-xs text-muted-foreground">
                        Let others know when you've read their messages
                      </p>
                    </div>
                    <Switch
                      id="read-receipts"
                      checked={readReceipts}
                      onCheckedChange={setReadReceipts}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-muted-foreground" />
                      <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={toggleDarkMode}
                      />
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="compact-mode">Compact Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Display more content with less spacing
                      </p>
                    </div>
                    <Switch id="compact-mode" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="font-size">Font Size</Label>
                      <p className="text-xs text-muted-foreground">
                        Adjust the size of text throughout the app
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">A</span>
                      <Input
                        id="font-size"
                        type="range"
                        className="w-24"
                        min="1"
                        max="3"
                        step="1"
                        defaultValue="2"
                      />
                      <span className="text-base">A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
