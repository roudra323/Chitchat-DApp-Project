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
import { ArrowLeft, Search, UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { Address } from "viem";

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
      // Get all user addresses
      const tempAddressess = await contracts.chitChat.getAllUsers();
      const addresses = tempAddressess.filter(
        (userAddress: Address) => userAddress != address
      );

      // Filter addresses based on search query
      const filteredAddresses = addresses.filter((address: Address) =>
        address.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Get user info for each filtered address
      const userPromises = filteredAddresses.map(async (address: Address) => {
        const [name, ipfsHash] = await contracts?.chitChat?.getUserInfo(
          address
        );

        return {
          address,
          name,
          ipfsHash,
          status: "not_friend", // You'll need to implement friend status logic
        } as UserResult;
      });

      const results = await Promise.all(userPromises);
      setSearchResults(results);
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

  const handleSendRequest = (userId: string) => {
    setSentRequests((prev) => new Set(prev).add(userId));

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
        <Button onClick={() => handleSendRequest(user.address)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar userName={userName} userImage={userIpfsHash} />

        <main className="flex-1 overflow-auto">
          <header className="border-b p-4 flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <h1 className="text-xl font-bold">Add Friend</h1>
          </header>

          <div className="container max-w-3xl py-8 px-4">
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
        </main>
      </div>
    </SidebarProvider>
  );
}
