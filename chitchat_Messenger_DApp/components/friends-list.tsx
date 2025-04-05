"use client";

import { useState, useEffect } from "react";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { useChitChatEvents } from "@/hooks/useChitChatEvents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Friend {
  address: string;
  name: string;
  profilePicture: string;
  timestamp: string;
}

interface Relationship {
  sender: string;
  receiver: string;
  timestamp: string;
}

interface FriendsListProps {
  searchQuery?: string;
}

export function FriendsList({ searchQuery = "" }: FriendsListProps) {
  const router = useRouter();
  const { address, contracts } = useEthersWithRainbow();
  const { acceptedFriends } = useChitChatEvents(); // assumed to be Relationship[]
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadFriendDetails = async () => {
      if (!contracts?.chitChat || !address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Filter relationships to only include those where the current user is involved
        const userRelationships = acceptedFriends.filter(
          (relationship: Relationship) =>
            relationship.sender === address || relationship.receiver === address
        );

        if (userRelationships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendsWithDetails = await Promise.all(
          userRelationships.map(async (relationship: Relationship) => {
            const friendAddress =
              relationship.sender === address
                ? relationship.receiver
                : relationship.sender;

            const [name, ipfsHash] = await contracts.chitChat?.getUserInfo(
              friendAddress
            );

            return {
              address: friendAddress,
              name,
              profilePicture: ipfsHash,
              timestamp: relationship.timestamp,
            } as Friend;
          })
        );

        setFriends(friendsWithDetails);
      } catch (error) {
        console.error("Error loading friend details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendDetails();
  }, [address, contracts?.chitChat, acceptedFriends]);

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveFriend = async (friendAddress: string) => {
    try {
      if (!contracts?.chitChat) return;
      await contracts.chitChat.removeFriend(friendAddress);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const startChat = (friendAddress: string) => {
    router.push(`/chat/${friendAddress}`);
  };

  if (loading) {
    return <div className="text-center py-8">Loading friends...</div>;
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No friends yet. Add friends to start chatting!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredFriends.map((friend) => (
        <Card
          key={friend.address}
          className="hover:bg-muted/50 transition-colors"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarImage
                  src={`https://ipfs.io/ipfs/${friend.profilePicture}`}
                />
                <AvatarFallback>{friend.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{friend.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                {friend.address}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => startChat(friend.address)}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveFriend(friend.address)}
              >
                <UserMinus className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
