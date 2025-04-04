"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { io, type Socket } from "socket.io-client"

type SocketContextType = {
  socket: Socket | null
  isConnected: boolean
  onlineFriends: Set<string>
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineFriends: new Set(),
})

export const useSocket = () => useContext(SocketContext)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Create socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
      path: "/api/socket/io",
      addTrailingSlash: false,
    })

    // Set up event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)

      // Send user ID to server to register presence
      socketInstance.emit("register", {
        userId: "current-user-id", // In a real app, this would be the actual user ID
      })
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    socketInstance.on("presence", (data: { onlineUsers: string[] }) => {
      console.log("Presence update:", data)
      setOnlineFriends(new Set(data.onlineUsers))
    })

    socketInstance.on("user:online", (userId: string) => {
      console.log("User online:", userId)
      setOnlineFriends((prev) => new Set([...prev, userId]))
    })

    socketInstance.on("user:offline", (userId: string) => {
      console.log("User offline:", userId)
      setOnlineFriends((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    })

    // Save socket instance
    setSocket(socketInstance)

    // Clean up on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, isConnected, onlineFriends }}>{children}</SocketContext.Provider>
}

