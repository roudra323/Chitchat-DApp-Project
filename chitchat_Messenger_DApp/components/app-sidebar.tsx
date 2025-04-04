"use client";

import { Home, MessageSquare, Users, Settings, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">ChitChat</h1>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/dashboard")}
              onClick={() => router.push("/dashboard")}
              tooltip="Dashboard"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/chat")}
              onClick={() => router.push("/dashboard?tab=chats")}
              tooltip="Messages"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Messages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/friends")}
              onClick={() => router.push("/dashboard?tab=friends")}
              tooltip="Friends"
            >
              <Users className="h-5 w-5" />
              <span>Friends</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive("/settings")}
              onClick={() => router.push("/settings")}
              tooltip="Settings"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => router.push("/")}>
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage
                  src={`https://bronze-quickest-snake-412.mypinata.cloud/ipfs/${userImage}`}
                />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span>{userName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
