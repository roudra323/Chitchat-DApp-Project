"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  UserPlus,
  Bell,
  Settings,
  MessageSquare,
  Users,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatList } from "@/components/chat-list";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { useChitChatEvents } from "@/hooks/useChitChatEvents";
import { FriendsList } from "@/components/friends-list";
import { FriendRequestsList } from "@/components/friend-requests-list";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { address, contracts } = useEthersWithRainbow();
  const { friendRequests } = useChitChatEvents();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");

  // Get pending request count for current user
  useEffect(() => {
    if (!address || !friendRequests.length) {
      setPendingRequestCount(0);
      return;
    }

    const count = friendRequests.filter(
      (req) => req.receiver.toLowerCase() === address.toLowerCase()
    ).length;

    setPendingRequestCount(count);
  }, [address, friendRequests]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const [name, ipfsHash] = await contracts.chitChat?.getUserInfo(address);
        setUserName(name);
        setUserImage(ipfsHash);
        // use the name and ipfsHash here
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    if (contracts.chitChat) {
      fetchUserInfo();
    }
  }, [contracts.chitChat, address]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b py-3 px-6 flex justify-between items-center bg-background z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ChitChat</h1>
        </div>

        <div className="flex items-center gap-4">
          <ConnectWalletButton />

          <div className="relative">
            <Bell className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
            {pendingRequestCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                {pendingRequestCount}
              </Badge>
            )}
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

          <Avatar
            className="h-8 w-8 cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <AvatarImage
              src={`https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${userImage}`}
            />
            <AvatarFallback>
              {address ? address.slice(0, 2) : "JD"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Conversations/Friends List */}
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages or friends..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => router.push("/add-friend")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="chats" className="h-full">
              <div className="px-4 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger
                    value="chats"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chats
                  </TabsTrigger>
                  <TabsTrigger
                    value="friends"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Friends
                  </TabsTrigger>
                  <TabsTrigger
                    value="requests"
                    className="flex-1 flex items-center justify-center gap-2 relative"
                  >
                    <UserPlus className="h-4 w-4" />
                    Requests
                    {pendingRequestCount > 0 && (
                      <Badge className="h-5 w-5 absolute -top-1 -right-1 flex items-center justify-center">
                        {pendingRequestCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="chats"
                className="p-4 h-full overflow-y-auto space-y-4 pr-2 mt-0"
              >
                <ChatList searchQuery={searchQuery} />
              </TabsContent>

              <TabsContent
                value="friends"
                className="p-4 h-full overflow-y-auto space-y-4 pr-2 mt-0"
              >
                <FriendsList searchQuery={searchQuery} />
              </TabsContent>

              <TabsContent
                value="requests"
                className="p-4 h-full overflow-y-auto space-y-4 pr-2 mt-0"
              >
                <FriendRequestsList />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Panel - Welcome or Chat */}
        <div className="w-2/3 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center max-w-md p-6">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary/40" />
              <h2 className="text-2xl font-bold mb-2">Welcome to ChitChat</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation from the list or start a new chat by
                adding a friend.
              </p>
              <Button onClick={() => router.push("/add-friend")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add a Friend
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
