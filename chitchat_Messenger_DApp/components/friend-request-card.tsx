"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import { useState } from "react"

interface FriendRequestCardProps {
  name: string
  username: string
  timestamp: string
}

export function FriendRequestCard({ name, username, timestamp }: FriendRequestCardProps) {
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending")

  const handleAccept = () => {
    setStatus("accepted")
  }

  const handleReject = () => {
    setStatus("rejected")
  }

  if (status !== "pending") {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>

          <div className="text-sm text-muted-foreground">
            {status === "accepted" ? "Friend request accepted" : "Friend request rejected"}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Avatar>
          <AvatarImage src="/placeholder.svg?height=40&width=40" />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-medium">{name}</h3>
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          </div>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleReject}>
            <X className="h-4 w-4" />
          </Button>

          <Button size="sm" className="h-8 w-8 p-0" onClick={handleAccept}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

