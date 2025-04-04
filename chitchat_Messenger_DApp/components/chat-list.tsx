"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { OnlineStatusIndicator } from "@/components/online-status-indicator"

interface ChatListProps {
  searchQuery?: string
}

export function ChatList({ searchQuery = "" }: ChatListProps) {
  const router = useRouter()

  const chats = [
    {
      id: "1",
      userId: "1",
      name: "Jane Doe",
      lastMessage: "Hey there! How's it going?",
      timestamp: "10:30 AM",
      unread: 0,
      status: "read",
    },
    {
      id: "2",
      userId: "2",
      name: "John Smith",
      lastMessage: "Did you see the latest update?",
      timestamp: "Yesterday",
      unread: 3,
      status: "delivered",
    },
    {
      id: "3",
      userId: "3",
      name: "Alice Johnson",
      lastMessage: "Let's meet tomorrow at 2pm",
      timestamp: "Yesterday",
      unread: 0,
      status: "sent",
    },
    {
      id: "4",
      userId: "4",
      name: "Bob Williams",
      lastMessage: "Thanks for the help!",
      timestamp: "Monday",
      unread: 0,
      status: "read",
    },
    {
      id: "5",
      userId: "5",
      name: "Emma Davis",
      lastMessage: "I'll send you the document later",
      timestamp: "Sunday",
      unread: 0,
      status: "read",
    },
  ]

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      {filteredChats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No chats found</div>
      ) : (
        filteredChats.map((chat) => (
          <Card
            key={chat.id}
            className={cn("cursor-pointer hover:bg-muted/50 transition-colors", chat.unread > 0 ? "bg-primary/5" : "")}
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
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
                    <OnlineStatusIndicator userId={chat.userId} className="h-1.5 w-1.5" />
                  </div>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>

                  <div className="flex items-center">
                    {chat.status && chat.status !== "read" && (
                      <span className="mr-1">
                        {chat.status === "sent" && <Check className="h-3 w-3 text-muted-foreground" />}
                        {chat.status === "delivered" && <CheckCheck className="h-3 w-3 text-muted-foreground" />}
                      </span>
                    )}

                    {chat.unread > 0 && <Badge className="ml-2">{chat.unread}</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

