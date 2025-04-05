"use client";

import { useState, useEffect } from "react";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { useChitChatEvents } from "@/hooks/useChitChatEvents";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

// Define the type for the event coming from useChitChatEvents
export interface FriendRequestEvent {
  sender: string;
  receiver: string;
  timestamp: string;
}

// Define the type for the detailed friend request (after fetching user info)
export interface FriendRequest {
  sender: string;
  name: string;
  profilePicture: string;
  timestamp: string;
}

export function FriendRequestsList() {
  const { address, contracts } = useEthersWithRainbow();
  // Assume friendRequests is an array of FriendRequestEvent
  const { friendRequests } = useChitChatEvents();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadRequestDetails = async () => {
      // Check if contracts.chitChat is available, address is set and there are events
      if (!contracts?.chitChat || !address || friendRequests.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Filter for requests where the current user is the receiver
        const relevantRequests = friendRequests.filter(
          (req: FriendRequestEvent) =>
            req.receiver.toLowerCase() === address.toLowerCase()
        );

        // Get user details for each request sender
        const requestsWithDetails: FriendRequest[] = await Promise.all(
          relevantRequests.map(async (request: FriendRequestEvent) => {
            // Using non-null assertion (!) because we've already confirmed contracts.chitChat exists
            const [name, ipfsHash] = await contracts.chitChat!.getUserInfo(
              request.sender
            );

            return {
              sender: request.sender,
              name,
              profilePicture: ipfsHash,
              timestamp: request.timestamp,
            };
          })
        );

        setPendingRequests(requestsWithDetails);
      } catch (error) {
        console.error("Error loading request details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRequestDetails();
  }, [address, contracts?.chitChat, friendRequests]);

  // Annotate senderAddress as string
  const handleAcceptRequest = async (senderAddress: string) => {
    try {
      if (!contracts?.chitChat) return;

      await contracts.chitChat.acceptFriendRequest(senderAddress);
      // The event listener will update the state accordingly
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  // Annotate senderAddress as string
  const handleRejectRequest = async (senderAddress: string) => {
    try {
      if (!contracts?.chitChat) return;

      await contracts.chitChat.rejectFriendRequest(senderAddress);
      // The event listener will update the state accordingly
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No friend requests pending.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <div
          key={request.sender}
          className="flex items-center justify-between p-3 rounded-md bg-muted/20"
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={`https://ipfs.io/ipfs/${request.profilePicture}`}
              />
              <AvatarFallback>{request.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{request.name}</h4>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                {request.sender}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(parseInt(request.timestamp) * 1000).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleAcceptRequest(request.sender)}
            >
              <Check className="h-4 w-4" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleRejectRequest(request.sender)}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
