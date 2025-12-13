"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  History,
  Home,
  LogOut,
  Settings,
  Stethoscope,
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

export function AppSidebar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isUpload = pathname?.startsWith("/upload");
  const isDocuments = pathname?.startsWith("/documents");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none"
              tooltip="Clinical Console"
            >
              <span className="mt-0.5 ml-2 inline-flex group-data-[collapsible=icon]:mt-0">
                <Stethoscope />
              </span>
              <span className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden whitespace-normal! overflow-visible!">
                <span className="text-base font-semibold tracking-tight">
                  Clinical Console
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Admin tools for document analysis.
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isHome} tooltip="Home">
                  <Link href="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={!!isUpload}
                  tooltip="Upload & summarize"
                >
                  <Link href="/upload">
                    <FileText />
                    <span>Upload & summarize</span>
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
                    <span>Recent documents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled tooltip="Settings (coming soon)">
                  <Settings />
                  <span>Settings (coming soon)</span>
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
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/login" })}
              tooltip="Sign out"
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
