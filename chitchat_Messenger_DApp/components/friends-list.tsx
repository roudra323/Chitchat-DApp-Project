"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { OnlineStatusIndicator } from "@/components/online-status-indicator"

interface FriendsListProps {
  searchQuery?: string
}

export function FriendsList({ searchQuery = "" }: FriendsListProps) {
  const router = useRouter()

  const friends = [
    {
      id: "1",
      name: "Jane Doe",
      username: "jane_doe",
    },
    {
      id: "2",
      name: "John Smith",
      username: "johnsmith",
    },
    {
      id: "3",
      name: "Alice Johnson",
      username: "alice_j",
    },
    {
      id: "4",
      name: "Bob Williams",
      username: "bob_w",
    },
    {
      id: "5",
      name: "Emma Davis",
      username: "emma_davis",
    },
  ]

  const filteredFriends = friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-2">
      {filteredFriends.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No friends found</div>
      ) : (
        filteredFriends.map((friend) => (
          <Card key={friend.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 border-2 border-background">
                  <OnlineStatusIndicator userId={friend.id} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{friend.name}</h3>
                  <OnlineStatusIndicator userId={friend.id} className="h-1.5 w-1.5" />
                </div>
                <p className="text-sm text-muted-foreground">@{friend.username}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => router.push(`/chat/${friend.id}`)}>
                  <MessageSquare className="h-5 w-5" />
                </Button>

                <Button size="icon" variant="ghost">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

