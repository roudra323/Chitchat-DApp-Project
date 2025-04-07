"use client";

import type React from "react";
import { use } from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreVertical,
  Lock,
  Send,
  Paperclip,
  Bell,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  Key,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "@/components/chat-message";
import { OnlineStatusIndicator } from "@/components/online-status-indicator";
import { useSocket } from "@/lib/socket-context";
import { Badge } from "@/components/ui/badge";
import { ConnectWalletButton } from "@/components/ui/connect-button";
import { ChatList } from "@/components/chat-list";
import { KeyExchangeModal } from "@/components/key-exchange-modal";
import { useToast } from "@/hooks/use-toast";
import { useEthersWithRainbow } from "@/hooks/useEthersWithRainbow";
import { Contract } from "ethers";
import { useUploadToPinata } from "@/hooks/useUploadToPinata";
import { useGetFromPinata } from "@/hooks/useGetFromPinata";
import { useSymmetricKey } from "@/hooks/useSymmetricKey";
import { useChitChatEvents } from "@/hooks/useChitChatEvents";
import { hasPrivateKey } from "@/utils/rsaKeyUtils";
import { Address } from "viem";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  content: string;
  sender: "me" | "them";
  timestamp: string;
  status: "sent" | "delivered" | "read";
  cid?: string; // IPFS Content ID
}

interface IPFSMetadata {
  contentCID: string;
  uploadedAt: number;
  isEncrypted: boolean;
}

interface MessageData {
  from: string;
  to: string;
  message: string; // encrypted message
  timestamp: string;
}

export default function ChatPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const friendNameFromQuery = searchParams.get("name") || "Jane Doe";

  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friendName, setFriendName] = useState(friendNameFromQuery);
  const [friendImage, setFriendImage] = useState(
    "/placeholder.svg?height=40&width=40"
  );
  const [isKeyExchangeModalOpen, setIsKeyExchangeModalOpen] = useState(false);
  const [hasExchangedKeys, setHasExchangedKeys] = useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Create a state for the friend ID
  const [friendId, setFriendId] = useState<string>("");

  const { address, contracts } = useEthersWithRainbow();
  const { messageEvents } = useChitChatEvents();

  const { uploadFile, isUploading, uploadError, uploadResult } =
    useUploadToPinata();

  const { getFile, isLoading, error, fileData } = useGetFromPinata();

  const {
    encryptWithSymmetricKey,
    decryptWithSymmetricKey,
    decryptSymmetricKeyWithPrivateKey,
    getOrCreateSymmetricKey,
    getStoredSymmetricKey,
  } = useSymmetricKey();

  // Sample messages for demo - will be replaced with actual messages
  const sampleMessages: Message[] = [
    {
      id: "1",
      content: "Hey there! How's it going?",
      sender: "them",
      timestamp: "10:30 AM",
      status: "read",
    },
    {
      id: "2",
      content: "I'm doing well, thanks for asking! How about you?",
      sender: "me",
      timestamp: "10:32 AM",
      status: "read",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Set it once in an effect
  useEffect(() => {
    if (id) {
      setFriendId(id);
    }
  }, [id]);

  // Function to encrypt and upload message to IPFS
  const encryptAndUploadMessage = async (
    messageContent: string,
    recipientAddress: string
  ) => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // First, check if we have a shared symmetric key
      let symmetricKey = getStoredSymmetricKey(recipientAddress);

      if (!symmetricKey) {
        // If not, we need to check if the recipient has shared one with us
        const encryptedKeyFromFriend =
          await contracts.chitChat?.getSharedKeyFrom(recipientAddress);

        if (encryptedKeyFromFriend && encryptedKeyFromFriend.length > 0) {
          // Decrypt the symmetric key using our private key
          console.log("From encryptAndUploadMessage messages");
          symmetricKey = await decryptSymmetricKeyWithPrivateKey(
            encryptedKeyFromFriend,
            address
          );
        } else {
          throw new Error("No symmetric key available for this conversation");
        }
      }

      // Encrypt the message content
      const encryptedContent = await encryptWithSymmetricKey(
        messageContent,
        symmetricKey
      );

      // Create the message object for IPFS
      const messageObject: MessageData = {
        from: address,
        to: recipientAddress,
        message: encryptedContent,
        timestamp: new Date().toISOString(),
      };

      // Prepare JSON string for upload
      const jsonBlob = new Blob([JSON.stringify(messageObject)], {
        type: "application/json",
      });
      const jsonFile = new File([jsonBlob], "message.json", {
        type: "application/json",
      });

      // Upload to IPFS via Pinata
      const result = await uploadFile(jsonFile);

      if (!result) {
        throw new Error(`Failed to upload to IPFS: ${uploadError}`);
      }

      if (!result?.cid) {
        throw new Error("Failed to get IPFS hash from upload");
      }

      const cid = result?.cid;

      // const cid = "bafkreihk4t2momavl3b7ao3j4kakkicz265bytem6zpidx7bofyvreplp4";

      console.log("Message uploaded to IPFS with CID:", cid);

      // Store the CID reference in the smart contract
      const tx = await contracts.chitChat?.sendEncryptedMessage(
        recipientAddress,
        cid
      );
      await tx.wait();

      console.log("Message stored on blockchain with CID:", cid);
      return cid;
    } catch (error) {
      console.error("Error encrypting and uploading message:", error);
      toast({
        title: "Message Upload Failed",
        description: `Failed to upload encrypted message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Function to fetch, decrypt and display messages
  const fetchAndDecryptMessages = async () => {
    if (!contracts.chitChat || !address || !friendId) return;

    setIsLoadingMessages(true);

    try {
      // Get message history from the blockchain
      const messageHistory: IPFSMetadata[] =
        await contracts.chitChat.getEncryptedMessageHistory(friendId);
      console.log("Message history:", messageHistory);

      // Get the symmetric key
      let symmetricKey = getStoredSymmetricKey(friendId);

      console.log("Getting symmetric key if not generated by own and stored");
      console.log("Symmetric key:", symmetricKey);

      if (!symmetricKey) {
        // Try to get the key the other party shared with us
        const encryptedKeyFromFriend =
          await contracts.chitChat.getSharedKeyFrom(friendId); // possible bug

        if (encryptedKeyFromFriend && encryptedKeyFromFriend.length > 0) {
          console.log("From fetch and decrypt messages");
          console.log("Encrypted key from friend:", encryptedKeyFromFriend);
          console.log("My address:", address);

          console.log(
            "Is Private Key Saved:",
            hasPrivateKey(address as Address)
          );

          console.log(
            "Is Private Key Saved (Friends):",
            hasPrivateKey(friendId as Address)
          );

          console.log("Getting symmetric key if not generated by own");

          symmetricKey = await decryptSymmetricKeyWithPrivateKey(
            encryptedKeyFromFriend,
            address
          );

          console.log("Decrypted symmetric key:", symmetricKey);
        } else {
          throw new Error("No symmetric key available for decryption");
        }
      }

      // Process and decrypt each message
      const decryptedMessages: Message[] = [];

      for (const metadata of messageHistory) {
        // Get the encrypted message from IPFS
        let fileData = await getFile(metadata.contentCID);
        fileData = fileData?.data;

        // const fileData = {
        //   from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        //   to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        //   message:
        //     "o7x9FaVpxJm7AYr2yoSPXXmBGW6jgIlIBBzHLyTk1xfkoDbURb+oQPIBfDUPYxY=",
        //   timestamp: "2025-04-07T08:27:24.933Z",
        // };

        if (!fileData) {
          console.error(
            "Failed to fetch message from IPFS:",
            metadata.contentCID
          );
          continue;
        }

        console.log("Fetched fileData:", fileData);

        // Parse the message data
        const messageData: MessageData =
          typeof fileData === "string" ? JSON.parse(fileData) : fileData;

        console.log("Message to decrypt:", messageData?.message);

        // Decrypt the message content
        const decryptedContent = await decryptWithSymmetricKey(
          messageData.message,
          symmetricKey
        );

        // Determine if the sender is "me" or "them"
        const sender =
          messageData.from.toLowerCase() === address.toLowerCase()
            ? "me"
            : "them";

        // Format the timestamp
        const messageDate = new Date(messageData.timestamp);
        const formattedTime = messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Create a message object
        decryptedMessages.push({
          id: metadata.contentCID, // Use the CID as the message ID
          content: decryptedContent,
          sender,
          timestamp: formattedTime,
          status: "read", // Default to read for historical messages
          cid: metadata.contentCID,
        });
      }

      // Sort by timestamp (assuming the original timestamps are ISO format)
      decryptedMessages.sort((a, b) => {
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      setMessages(
        decryptedMessages.length > 0 ? decryptedMessages : sampleMessages
      );
    } catch (error) {
      console.error("Error fetching and decrypting messages:", error);
      toast({
        title: "Failed to Load Messages",
        description: `Couldn't load encrypted messages: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });

      // Fall back to sample messages
      setMessages(sampleMessages);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Process new message events from blockchain
  const processNewMessageEvent = async (
    sender: string,
    receiver: string,
    ipfsHash: string
  ) => {
    console.log("New message event:", { sender, receiver, ipfsHash });

    // Only process messages relevant to this chat
    if (
      (sender.toLowerCase() === address?.toLowerCase() &&
        receiver.toLowerCase() === friendId.toLowerCase()) ||
      (receiver.toLowerCase() === address?.toLowerCase() &&
        sender.toLowerCase() === friendId.toLowerCase())
    ) {
      try {
        // Get the symmetric key
        let symmetricKey = getStoredSymmetricKey(
          sender.toLowerCase() === address?.toLowerCase() ? receiver : sender
        );

        if (!symmetricKey) {
          const encryptedKey = await contracts.chitChat?.getSharedKeyFrom(
            sender.toLowerCase() === address?.toLowerCase() ? receiver : sender
          );

          if (encryptedKey && encryptedKey.length > 0 && address) {
            console.log("From process  messages");
            symmetricKey = await decryptSymmetricKeyWithPrivateKey(
              encryptedKey,
              address
            );
          } else {
            throw new Error(
              "Cannot decrypt message: No symmetric key available"
            );
          }
        }

        // Fetch message data from IPFS
        await getFile(ipfsHash);

        if (error || !fileData) {
          throw new Error(`Failed to fetch message from IPFS: ${ipfsHash}`);
        }

        // Parse the message data
        const messageData: MessageData =
          typeof fileData === "string" ? JSON.parse(fileData) : fileData;

        // Decrypt the message
        const decryptedContent = await decryptWithSymmetricKey(
          messageData.message,
          symmetricKey
        );

        // Determine message sender (from my perspective)
        const messageType =
          messageData.from.toLowerCase() === address?.toLowerCase()
            ? "me"
            : "them";

        // Format timestamp
        const messageDate = new Date(messageData.timestamp);
        const formattedTime = messageDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Create and add the new message
        const newMessage: Message = {
          id: ipfsHash,
          content: decryptedContent,
          sender: messageType,
          timestamp: formattedTime,
          status: "delivered",
          cid: ipfsHash,
        };

        setMessages((prev) => [...prev, newMessage]);

        // If the message is from the other person, mark it as read
        if (messageType === "them") {
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === ipfsHash ? { ...msg, status: "read" } : msg
              )
            );
          }, 1000);
        }
      } catch (error) {
        console.error("Error processing new message:", error);
        toast({
          title: "Message Processing Failed",
          description: `Failed to process new message: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if keys have been exchanged with this friend
  useEffect(() => {
    const checkKeyExchange = async () => {
      if (!contracts.chitChat || !address) return;
      setIsCheckingKeys(true);
      try {
        console.log("Checking key exchange for:", friendId);
        console.log("User address:", address);
        console.log("Contracts:", contracts);
        const keysExchanged = await contracts.chitChat?.isKeyExchanged(
          friendId
        );

        console.log("Keys exchanged:", keysExchanged);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setHasExchangedKeys(keysExchanged);

        if (!keysExchanged) {
          // Show a toast notification that keys need to be exchanged
          toast({
            title: "Key exchange required",
            description: "You need to exchange encryption keys before chatting",
          });
        } else {
          // If keys have been exchanged, load the messages
          fetchAndDecryptMessages();
        }
      } catch (error) {
        console.error("Error checking key exchange:", error);
      } finally {
        setIsCheckingKeys(false);
      }
    };

    checkKeyExchange();
  }, [friendId, toast, contracts.chitChat, address]);

  // Process blockchain events for new messages
  useEffect(() => {
    if (messageEvents && messageEvents.length > 0) {
      // Process each message event
      messageEvents.forEach((event) => {
        processNewMessageEvent(event.sender, event.receiver, event.ipfsHash);
      });
    }
  }, [messageEvents]);

  useEffect(() => {
    if (socket && isConnected) {
      // Join the chat room
      socket.emit("join:chat", { chatId: friendId });

      // Listen for new messages
      socket.on("chat:message", (newMessage: Message) => {
        setMessages((prev) => [...prev, newMessage]);
      });

      // Listen for typing indicators
      socket.on(
        "chat:typing",
        (data: { userId: string; isTyping: boolean }) => {
          // Handle typing indicator
          console.log("User is typing:", data);
        }
      );

      return () => {
        // Leave the chat room
        socket.emit("leave:chat", { chatId: friendId });

        // Remove event listeners
        socket.off("chat:message");
        socket.off("chat:typing");
      };
    }
  }, [socket, isConnected, friendId]);

  const handleSendMessage = async () => {
    if (!hasExchangedKeys) {
      setIsKeyExchangeModalOpen(true);
      return;
    }

    if (message.trim() && address) {
      const messageToSend = message.trim();
      setMessage(""); // Clear input field immediately for better UX

      // Create a temporary message object to show in the UI
      const tempId = Date.now().toString();
      const newMessage: Message = {
        id: tempId,
        content: messageToSend,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sent",
      };

      // Add the temporary message to the UI
      setMessages((prev) => [...prev, newMessage]);

      try {
        // Encrypt and upload to IPFS + store on blockchain
        const cid = await encryptAndUploadMessage(messageToSend, friendId);

        if (cid) {
          // Update the message with the real CID
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: cid, cid, status: "delivered" }
                : msg
            )
          );

          // Simulate message being read after a delay
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === cid ? { ...msg, status: "read" } : msg
              )
            );
          }, 3000);
        } else {
          // If failed, mark the message with an error state
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? { ...msg, status: "sent" } : msg
            )
          );

          toast({
            title: "Message not delivered",
            description:
              "Your message couldn't be encrypted or stored on the blockchain",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Update UI to show the message failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "sent" } : msg
          )
        );

        toast({
          title: "Message Failed",
          description: `Failed to send message: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Emit typing indicator
  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit("chat:typing", {
        chatId: friendId,
        isTyping: true,
      });

      // Clear typing indicator after a delay
      setTimeout(() => {
        socket.emit("chat:typing", {
          chatId: friendId,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const handleKeyExchangeComplete = () => {
    setHasExchangedKeys(true);
    // Load messages after key exchange
    fetchAndDecryptMessages();
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

          <Avatar className="h-10 w-10">
            <AvatarImage src={friendImage} />
            <AvatarFallback>{friendName.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h2 className="font-semibold">{friendName}</h2>
            <div className="flex items-center gap-1">
              <OnlineStatusIndicator userId={friendId} />
              <span className="text-xs text-muted-foreground">
                {useSocket().onlineFriends.has(friendId) ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectWalletButton />

          <div className="relative">
            <Bell className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
              3
            </Badge>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={
                    hasExchangedKeys ? "text-green-500" : "text-yellow-500"
                  }
                  onClick={() =>
                    !hasExchangedKeys && setIsKeyExchangeModalOpen(true)
                  }
                >
                  {hasExchangedKeys ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <Key className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {hasExchangedKeys
                    ? "End-to-end encrypted"
                    : "Key exchange required"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Conversations List (hidden on mobile) */}
        <div className="w-1/3 border-r flex-col hidden md:flex">
          <div className="p-4 border-b">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ChatList searchQuery="" />
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col">
          {isCheckingKeys ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">
                  Checking encryption status...
                </p>
              </div>
            </div>
          ) : !hasExchangedKeys ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-muted p-6 rounded-lg max-w-md text-center">
                <div className="h-16 w-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-yellow-600 dark:text-yellow-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Key Exchange Required
                </h3>
                <p className="text-muted-foreground mb-6">
                  Before you can chat with {friendName}, you need to exchange
                  encryption keys to enable secure end-to-end encrypted
                  messaging.
                </p>
                <Button onClick={() => setIsKeyExchangeModalOpen(true)}>
                  <Key className="h-4 w-4 mr-2" />
                  Exchange Encryption Keys
                </Button>
              </div>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">
                  Loading encrypted messages...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    content={msg.content}
                    sender={msg.sender}
                    timestamp={msg.timestamp}
                    status={msg.status}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onInput={handleTyping}
                    className="flex-1"
                  />

                  <Button
                    size="icon"
                    disabled={!message.trim() || isUploading}
                    onClick={handleSendMessage}
                  >
                    {isUploading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </footer>
            </>
          )}
        </div>
      </div>

      {/* Key Exchange Modal */}
      <KeyExchangeModal
        isOpen={isKeyExchangeModalOpen}
        onClose={() => setIsKeyExchangeModalOpen(false)}
        friendAddress={friendId}
        friendName={friendName}
        onKeyExchangeComplete={handleKeyExchangeComplete}
        chitChatContract={contracts.chitChat as Contract}
      />
    </div>
  );
}
