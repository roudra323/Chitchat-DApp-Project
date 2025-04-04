"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ArrowLeft, MoreVertical, Lock, Send, Paperclip } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ChatMessage } from "@/components/chat-message"
import { OnlineStatusIndicator } from "@/components/online-status-indicator"
import { useSocket } from "@/lib/socket-context"

interface Message {
  id: string
  content: string
  sender: "me" | "them"
  timestamp: string
  status: "sent" | "delivered" | "read"
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { socket, isConnected } = useSocket()
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
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
    {
      id: "3",
      content:
        "Pretty good! I've been exploring this new decentralized messaging app. The encryption seems really solid.",
      sender: "them",
      timestamp: "10:35 AM",
      status: "read",
    },
    {
      id: "4",
      content: "Yeah, I love that it's all end-to-end encrypted. No one can read our messages except us.",
      sender: "me",
      timestamp: "10:36 AM",
      status: "read",
    },
    {
      id: "5",
      content: "Exactly! And using wallet-based authentication means no more passwords to remember.",
      sender: "them",
      timestamp: "10:38 AM",
      status: "read",
    },
    {
      id: "6",
      content: "Have you tried any of the other features yet?",
      sender: "them",
      timestamp: "10:39 AM",
      status: "delivered",
    },
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (socket && isConnected) {
      // Join the chat room
      socket.emit("join:chat", { chatId: params.id })

      // Listen for new messages
      socket.on("chat:message", (newMessage: Message) => {
        setMessages((prev) => [...prev, newMessage])
      })

      // Listen for typing indicators
      socket.on("chat:typing", (data: { userId: string; isTyping: boolean }) => {
        // Handle typing indicator
        console.log("User is typing:", data)
      })

      return () => {
        // Leave the chat room
        socket.emit("leave:chat", { chatId: params.id })

        // Remove event listeners
        socket.off("chat:message")
        socket.off("chat:typing")
      }
    }
  }, [socket, isConnected, params.id])

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: "me",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "sent",
      }

      setMessages([...messages, newMessage])
      setMessage("")

      // Send message via socket if connected
      if (socket && isConnected) {
        socket.emit("chat:send", {
          chatId: params.id,
          message: newMessage,
        })
      }

      // Simulate message being delivered
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
      }, 1000)

      // Simulate message being read
      setTimeout(() => {
        setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "read" } : msg)))
      }, 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Emit typing indicator
  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit("chat:typing", {
        chatId: params.id,
        isTyping: true,
      })

      // Clear typing indicator after a delay
      setTimeout(() => {
        socket.emit("chat:typing", {
          chatId: params.id,
          isTyping: false,
        })
      }, 2000)
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>

              <div>
                <h2 className="font-semibold">Jane Doe</h2>
                <div className="flex items-center gap-1">
                  <OnlineStatusIndicator userId={params.id} />
                  <span className="text-xs text-muted-foreground">
                    {useSocket().onlineFriends.has(params.id) ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-primary">
                      <Lock className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>End-to-end encrypted</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </header>

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

              <Button size="icon" disabled={!message.trim()} onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  )
}

