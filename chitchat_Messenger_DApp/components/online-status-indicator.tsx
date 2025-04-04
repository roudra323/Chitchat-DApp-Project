"use client"

import { useSocket } from "@/lib/socket-context"
import { cn } from "@/lib/utils"

interface OnlineStatusIndicatorProps {
  userId: string
  className?: string
}

export function OnlineStatusIndicator({ userId, className }: OnlineStatusIndicatorProps) {
  const { onlineFriends } = useSocket()
  const isOnline = onlineFriends.has(userId)

  return (
    <div
      className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-400", className)}
      title={isOnline ? "Online" : "Offline"}
    />
  )
}

