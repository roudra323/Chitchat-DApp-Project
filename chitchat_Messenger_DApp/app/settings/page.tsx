"use client";

import type React from "react";

import { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  Moon,
  Sun,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import Image from "next/image";
import { SecurityTab } from "./security-tab";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };

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
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
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
              src={avatarPreview || "/placeholder.svg?height=32&width=32"}
            />
            <AvatarFallback>JD</AvatarFallback>
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
                    Update your profile information and username
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={
                          avatarPreview || "/placeholder.svg?height=96&width=96"
                        }
                      />
                      <AvatarFallback className="text-2xl">JD</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="avatar"
                        className="cursor-pointer text-sm text-primary flex items-center gap-1"
                      >
                        <Upload className="h-4 w-4" />
                        Change Profile Picture
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue="jane_doe" />
                    <p className="text-xs text-muted-foreground">
                      This is your public username that others will see
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input id="display-name" defaultValue="Jane Doe" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      defaultValue="Crypto enthusiast and privacy advocate"
                    />
                    <p className="text-xs text-muted-foreground">
                      A short bio about yourself
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile}>Save Changes</Button>
                </CardFooter>
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
                          0x1a2...3b4c
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecurityTab />
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
