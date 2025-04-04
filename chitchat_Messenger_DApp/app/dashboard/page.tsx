"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, UserPlus, Bell, Settings, MessageSquare, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { FriendRequestCard } from "@/components/friend-request-card"
import { ChatList } from "@/components/chat-list"
import { FriendsList } from "@/components/friends-list"

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">ChitChat</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="h-5 w-5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">3</Badge>
              </div>

              <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
                <Settings className="h-5 w-5" />
              </Button>

              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="p-4 flex-1 overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages or friends..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => router.push("/add-friend")}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Friend
              </Button>
            </div>

            <Tabs defaultValue="chats" className="h-[calc(100%-3rem)]">
              <TabsList className="mb-4">
                <TabsTrigger value="chats" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chats
                </TabsTrigger>
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Friends
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex items-center gap-2 relative">
                  <UserPlus className="h-4 w-4" />
                  Requests
                  <Badge className="h-5 w-5 absolute -top-1 -right-1 flex items-center justify-center">3</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chats" className="h-full overflow-y-auto space-y-4 pr-2">
                <ChatList searchQuery={searchQuery} />
              </TabsContent>

              <TabsContent value="friends" className="h-full overflow-y-auto space-y-4 pr-2">
                <FriendsList searchQuery={searchQuery} />
              </TabsContent>

              <TabsContent value="requests" className="h-full overflow-y-auto space-y-4 pr-2">
                <div className="space-y-4">
                  <FriendRequestCard name="Alex Johnson" username="alexj" timestamp="2 hours ago" />
                  <FriendRequestCard name="Maria Garcia" username="maria_g" timestamp="Yesterday" />
                  <FriendRequestCard name="Sam Wilson" username="samw" timestamp="3 days ago" />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

