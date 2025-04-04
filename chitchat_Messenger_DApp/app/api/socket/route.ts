import { NextResponse } from "next/server"
import type { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import type { Socket as SocketIOSocket } from "socket.io"

// Map to track online users
const onlineUsers = new Map<string, string>() // userId -> socketId

// Function to initialize Socket.IO server
function initSocketServer(req: Request) {
  // Get the server instance from the request
  const res = new NextResponse()
  const server = (res as any).socket?.server

  // If the Socket.IO server is already initialized, return it
  if (server?.io) {
    return res
  }

  // Create a new Socket.IO server
  const io = new SocketIOServer(server as NetServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
  })

  // Store the Socket.IO server on the server instance
  server.io = io

  // Set up event handlers
  io.on("connection", (socket: SocketIOSocket) => {
    console.log("Socket connected:", socket.id)

    // Handle user registration
    socket.on("register", ({ userId }) => {
      console.log(`User ${userId} registered with socket ${socket.id}`)

      // Store the user's socket ID
      onlineUsers.set(userId, socket.id)

      // Broadcast to all clients that this user is online
      io.emit("user:online", userId)

      // Send the current list of online users to the newly connected client
      socket.emit("presence", {
        onlineUsers: Array.from(onlineUsers.keys()),
      })
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id)

      // Find the user ID associated with this socket
      let disconnectedUserId: string | undefined

      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId
          break
        }
      }

      // If we found the user, remove them from the online users map
      if (disconnectedUserId) {
        onlineUsers.delete(disconnectedUserId)

        // Broadcast to all clients that this user is offline
        io.emit("user:offline", disconnectedUserId)
      }
    })
  })

  return res
}

export async function GET(req: Request) {
  return initSocketServer(req)
}

export const dynamic = "force-dynamic"

