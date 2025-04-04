"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  UserPlus,
  Loader2,
  Bell,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ConnectWalletButton } from "@/components/ui/connect-button";

import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import type { Address } from "viem";

interface UserResult {
  address: string; // Add address field
  name: string;
  ipfsHash: string;
  status: "not_friend" | "friend" | "pending" | "requested";
}

export default function AddFriendPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState<string>("");
  const [userIpfsHash, setUserIpfsHash] = useState<string>("");

  const { isConnected, contracts, address } = useEthersWithRainbow();

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isConnected && contracts?.chitChat) {
        const [name, ipfsHash] = await contracts.chitChat.getUserInfo(address);
        setUserName(name);
        setUserIpfsHash(ipfsHash);
      }
    };

    fetchUserInfo();
  }, [isConnected, contracts, address]);

  const handleSearch = async () => {
    if (!isConnected || !contracts?.chitChat) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a username or wallet address to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Get all user addresses except self
      const tempAddresses = await contracts.chitChat.getAllUsers();
      const filteredAddresses = tempAddresses.filter(
        (userAddress: Address) => userAddress !== address
      );

      // Fetch user info and filter by name OR address
      const userPromises = filteredAddresses.map(async (addr: Address) => {
        const [name, ipfsHash] = await contracts.chitChat?.getUserInfo(addr);
        const statusCode = await contracts.chitChat?.friendRequestStatus(addr);

        const status =
          statusCode === 2
            ? "friend"
            : statusCode === 1 || statusCode === 3
            ? "pending"
            : "not_friend";

        return {
          address: addr,
          name,
          ipfsHash,
          status,
        } as UserResult;
      });

      const users = await Promise.all(userPromises);

      // Now filter based on name or address
      const lowerQuery = searchQuery.toLowerCase();
      const filteredResults = users.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.address.toLowerCase().includes(lowerQuery)
      );

      setSearchResults(filteredResults);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error searching users",
        description: error.message || "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (address: Address) => {
    console.log("Sending friend request to:", address);
    // setSentRequests((prev) => new Set(prev).add(userId));

    const tx = await contracts?.chitChat?.sendFriendRequest(address);
    await tx.wait();

    if (!tx) {
      toast({
        title: "Transaction failed",
        description: "Failed to send friend request",
        variant: "destructive",
      });
      return;
    }
    setSentRequests((prev) => new Set(prev).add(address));

    toast({
      title: "Friend request sent",
      description: "Your friend request has been sent successfully",
    });
  };

  const getActionButton = (user: UserResult) => {
    if (user.status === "friend") {
      return (
        <Button variant="outline" disabled>
          Already Friends
        </Button>
      );
    } else if (user.status === "pending") {
      return (
        <Button variant="outline" disabled>
          Request Pending
        </Button>
      );
    } else if (user.status === "requested") {
      return <Button variant="outline">Accept Request</Button>;
    } else if (sentRequests.has(user.address)) {
      return (
        <Button variant="outline" disabled>
          Request Sent
        </Button>
      );
    } else {
      return (
        <Button onClick={() => handleSendRequest(user.address as Address)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      );
    }
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
          <h1 className="text-xl font-bold">Add Friend</h1>
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

          <Avatar
            className="h-8 w-8 cursor-pointer"
            onClick={() => router.push("/settings")}
          >
            <AvatarImage
              src={`https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${userIpfsHash}`}
            />
            <AvatarFallback>
              {userName ? userName[0]?.toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>
                Search for users by username or wallet address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search by username or wallet address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
              </div>

              {isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((user) => (
                    <Card key={user.address}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={`https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${user?.ipfsHash}`}
                            />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {user.address &&
                                user.address.slice(0, 6) +
                                  "..." +
                                  user.address.slice(-4)}
                            </p>
                          </div>
                        </div>
                        {getActionButton(user)}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching "{searchQuery}"
                </div>
              ) : null}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              <Label className="text-sm font-medium">
                Don't see who you're looking for?
              </Label>
              <p className="text-sm text-muted-foreground">
                You can also send a friend request directly by sharing your
                username with others.
              </p>
              <div className="bg-muted p-3 rounded-md w-full mt-2">
                <p className="text-sm font-medium">Your address</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-background px-2 py-1 rounded text-sm flex-1">
                    {address}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(address ? address : "");
                      toast({
                        title: "Address copied",
                        description:
                          "Your addresss has been copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
