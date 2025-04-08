"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { useChitChatEvents } from "@/hooks/useChitChatEvents";
import { useSocket } from "@/lib/socket-context";
import { useGetFromPinata } from "@/hooks/useGetFromPinata";
import { useSymmetricKey } from "@/hooks/useSymmetricKey";

interface ChatListProps {
  searchQuery?: string;
}

type MessageStatus = "sent" | "delivered" | "read";

interface ChatItem {
  id: string;
  userId: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: MessageStatus;
  avatar?: string;
}

interface LastMessage {
  message: string;
  timestamp: string;
  status: MessageStatus;
}

export function ChatList({ searchQuery = "" }: ChatListProps) {
  const router = useRouter();
  const { socket } = useSocket();
  const { address, contracts } = useEthersWithRainbow();
  const { acceptedFriends, messageEvents } = useChitChatEvents();
  const { getFile } = useGetFromPinata();
  const {
    getStoredSymmetricKey,
    decryptWithSymmetricKey,
    decryptSymmetricKeyWithPrivateKey,
  } = useSymmetricKey();

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, LastMessage>>(
    {}
  );

  // Function to fetch user profile information
  const fetchUserProfile = async (userAddress: string) => {
    try {
      // Get user profile IPFS hash from contract
      const [name, ipfsHash] = await contracts.chitChat?.getUserInfo(
        userAddress
      );

      if (ipfsHash && name) {
        // Fetch profile data from IPFS
        return {
          name: name || `User ${userAddress.substring(0, 6)}`,
          avatar:
            `https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${ipfsHash}` ||
            "/placeholder.svg?height=40&width=40",
        };
      }

      return {
        name: `User ${userAddress.substring(0, 6)}`,
        avatar: "/placeholder.svg?height=40&width=40",
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return {
        name: `User ${userAddress.substring(0, 6)}`,
        avatar: "/placeholder.svg?height=40&width=40",
      };
    }
  };

  // Function to fetch and decrypt the last message
  const fetchLastMessage = async (friendAddress: string) => {
    try {
      if (!contracts?.chitChat || !address) return null;

      // Get message history from the contract
      const messageHistory =
        await contracts.chitChat.getEncryptedMessageHistory(friendAddress);

      if (messageHistory.length === 0) return null;

      // Get the latest message (last in the array)
      const latestMessage = messageHistory[messageHistory.length - 1];

      // Get symmetric key for decryption
      let symmetricKey = getStoredSymmetricKey(friendAddress);

      if (!symmetricKey) {
        const encryptedKey = await contracts.chitChat.getSharedKeyFrom(
          friendAddress
        );

        if (encryptedKey && encryptedKey.length > 0) {
          symmetricKey = await decryptSymmetricKeyWithPrivateKey(
            encryptedKey,
            address
          );
        } else {
          return null; // No key for decryption
        }
      }

      // Fetch message data from IPFS
      const fileData = await getFile(latestMessage.contentCID);

      if (!fileData?.data) return null;

      // Parse message data
      const messageData =
        typeof fileData.data === "string"
          ? JSON.parse(fileData.data)
          : fileData.data;

      // Decrypt message content
      const decryptedContent = await decryptWithSymmetricKey(
        messageData.message,
        symmetricKey
      );

      // Format timestamp
      const messageDate = new Date(messageData.timestamp);
      const formattedTime = formatMessageTime(messageDate);

      // Determine message status
      const status =
        messageData.from.toLowerCase() === address.toLowerCase()
          ? ("read" as MessageStatus)
          : ("delivered" as MessageStatus);

      return {
        message: decryptedContent,
        timestamp: formattedTime,
        status,
      };
    } catch (error) {
      console.error("Error fetching last message:", error);
      return null;
    }
  };

  // Format timestamp for display
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Load chat data from accepted friends
  useEffect(() => {
    const loadChats = async () => {
      if (!address || !contracts?.chitChat || acceptedFriends.length === 0)
        return;

      const chatData: ChatItem[] = [];

      for (const friend of acceptedFriends) {
        // Determine which address is the friend
        const friendAddress =
          friend.sender.toLowerCase() === address.toLowerCase()
            ? friend.receiver
            : friend.sender;

        // Get user profile
        const profile = await fetchUserProfile(friendAddress);

        // Get last message
        const lastMessage = await fetchLastMessage(friendAddress);

        if (lastMessage) {
          setLastMessages((prev) => ({
            ...prev,
            [friendAddress]: lastMessage,
          }));
        }

        // Create chat item
        chatData.push({
          id: friendAddress,
          userId: friendAddress,
          name: profile.name,
          lastMessage: lastMessage?.message || "Start a conversation",
          timestamp: lastMessage?.timestamp || "Now",
          unread: unreadCounts[friendAddress] || 0,
          status: lastMessage?.status || "delivered",
          avatar: profile.avatar,
        });
      }

      setChats(chatData);
    };

    loadChats();
  }, [address, contracts?.chitChat, acceptedFriends, unreadCounts]);

  // Process new message events
  useEffect(() => {
    if (!messageEvents || !address) return;

    const handleNewMessage = async (event: {
      sender: string;
      receiver: string;
      ipfsHash: string;
    }) => {
      const { sender, receiver, ipfsHash } = event;

      // Only process messages where current user is either sender or receiver
      if (
        sender.toLowerCase() !== address.toLowerCase() &&
        receiver.toLowerCase() !== address.toLowerCase()
      ) {
        return;
      }

      // Determine friend address
      const friendAddress =
        sender.toLowerCase() === address.toLowerCase() ? receiver : sender;

      try {
        // Get symmetric key
        let symmetricKey = getStoredSymmetricKey(friendAddress);

        if (!symmetricKey) {
          const encryptedKey = await contracts?.chitChat?.getSharedKeyFrom(
            friendAddress
          );

          if (encryptedKey && encryptedKey.length > 0) {
            symmetricKey = await decryptSymmetricKeyWithPrivateKey(
              encryptedKey,
              address
            );
          } else {
            return;
          }
        }

        // Fetch message from IPFS
        const fileData = await getFile(ipfsHash);

        if (!fileData?.data) return;

        // Parse message data
        const messageData =
          typeof fileData.data === "string"
            ? JSON.parse(fileData.data)
            : fileData.data;

        // Decrypt message content
        const decryptedContent = await decryptWithSymmetricKey(
          messageData.message,
          symmetricKey
        );

        // Format timestamp
        const messageDate = new Date(messageData.timestamp);
        const formattedTime = formatMessageTime(messageDate);

        // Update last message for this friend
        setLastMessages((prev) => ({
          ...prev,
          [friendAddress]: {
            message: decryptedContent,
            timestamp: formattedTime,
            status:
              sender.toLowerCase() === address.toLowerCase()
                ? "delivered"
                : "delivered", // Using "delivered" instead of "received"
          } as LastMessage,
        }));

        // Increment unread count if message was received
        if (sender.toLowerCase() !== address.toLowerCase()) {
          setUnreadCounts((prev) => ({
            ...prev,
            [friendAddress]: (prev[friendAddress] || 0) + 1,
          }));
        }
      } catch (error) {
        console.error("Error processing new message event:", error);
      }
    };

    // Process any new message events
    messageEvents.forEach(handleNewMessage);
  }, [messageEvents, address, contracts?.chitChat]);

  // Listen for socket events for real-time updates
  useEffect(() => {
    if (!socket || !address) return;

    // Listen for read receipts
    socket.on(
      "message:read",
      (data: { chatId: string; messageIds: string[] }) => {
        // Update message status to read
        setLastMessages((prev) => {
          const friend = prev[data.chatId];
          if (friend) {
            return {
              ...prev,
              [data.chatId]: {
                ...friend,
                status: "read" as MessageStatus,
              },
            };
          }
          return prev;
        });
      }
    );

    // Listen for online status changes
    socket.on(
      "user:status",
      (data: { userId: string; status: "online" | "offline" }) => {
        // You can handle online status updates here if needed
      }
    );

    // Reset unread count when opening a chat
    socket.on("chat:opened", (data: { chatId: string }) => {
      setUnreadCounts((prev) => ({
        ...prev,
        [data.chatId]: 0,
      }));
    });

    return () => {
      socket.off("message:read");
      socket.off("user:status");
      socket.off("chat:opened");
    };
  }, [socket, address]);

  // Filter chats based on search query
  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startChat = (friendAddress: string, friendName: string) => {
    router.push(
      `/chat/${friendAddress}?name=${encodeURIComponent(friendName)}`
    );
  };

  // Handle clicking on a chat
  const handleChatClick = (chatId: string) => {
    // Reset unread count for this chat
    setUnreadCounts((prev) => ({
      ...prev,
      [chatId]: 0,
    }));

    // Emit event that chat was opened
    if (socket) {
      socket.emit("chat:opened", { chatId });
    }

    // Navigate to chat page
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="space-y-2">
      {filteredChats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {acceptedFriends.length === 0
            ? "No friends added yet"
            : "No chats found"}
        </div>
      ) : (
        filteredChats.map((chat) => (
          <Card
            key={chat.id}
            className={cn(
              "cursor-pointer hover:bg-muted/50 transition-colors",
              chat.unread > 0 ? "bg-primary/5" : ""
            )}
            onClick={() => startChat(chat.userId, chat.name)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage
                    src={chat.avatar || "/placeholder.svg?height=40&width=40"}
                  />
                  <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 border-2 border-background">
                  <OnlineStatusIndicator userId={chat.userId} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{chat.name}</h3>
                    <OnlineStatusIndicator
                      userId={chat.userId}
                      className="h-1.5 w-1.5"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage}
                  </p>
                  <div className="flex items-center">
                    {chat.status && chat.status !== "read" && (
                      <span className="mr-1">
                        {chat.status === "sent" && (
                          <Check className="h-3 w-3 text-muted-foreground" />
                        )}
                        {chat.status === "delivered" && (
                          <CheckCheck className="h-3 w-3 text-muted-foreground" />
                        )}
                      </span>
                    )}
                    {chat.unread > 0 && (
                      <Badge className="ml-2">{chat.unread}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
