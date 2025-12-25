"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  History,
  Home,
  LogOut,
  Stethoscope,
  Inbox,
  Upload,
  BarChart3,
  Zap,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isUpload = pathname === "/upload";
  const isDocuments = pathname?.startsWith("/documents");
  const isFaxQueue = pathname === "/faxes";
  const isFaxUpload = pathname === "/faxes/upload";
  const isFaxStatistics = pathname === "/faxes/statistics";
  const isFaxSettings = pathname === "/faxes/settings";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Clinical Console"
            >
              <span>
                <Stethoscope />
              </span>
              <span>
                <span>
                  Clinical Console
                </span>
                <span>
                  AI Document Analysis
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Zap />
            Fax Processing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxQueue}
                  tooltip="Fax Queue"
                >
                  <Link href="/faxes">
                    <Inbox />
                    <span>Fax Queue</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxUpload}
                  tooltip="Upload Fax"
                >
                  <Link href="/faxes/upload">
                    <Upload />
                    <span>Upload Fax</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxStatistics}
                  tooltip="Fax Statistics"
                >
                  <Link href="/faxes/statistics">
                    <BarChart3 />
                    <span>Statistics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxSettings}
                  tooltip="Fax Settings"
                >
                  <Link href="/faxes/settings">
                    <FileText />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <FileText />
            Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isHome} 
                  tooltip="Home"
                >
                  <Link href="/">
                    <Home />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isUpload}
                  tooltip="Upload & summarize"
                >
                  <Link href="/upload">
                    <FileText />
                    <span>Upload & Summarize</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={!!isDocuments}
                  tooltip="Recent documents"
                >
                  <Link href="/documents">
                    <History />
                    <span>Recent Documents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              tooltip="Sign out"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
