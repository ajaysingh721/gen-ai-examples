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
  const isFaxSettings = pathname === "/faxes/settings";

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/50 dark:border-slate-800/50">
      <SidebarHeader className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none"
              tooltip="Clinical Console"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Clinical Console
                </span>
                <span className="text-[11px] text-muted-foreground">
                  AI Document Analysis
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
            <Zap className="h-3.5 w-3.5 mr-2 inline" />
            Fax Processing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxQueue}
                  tooltip="Fax Queue"
                  className="rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-blue-500/25"
                >
                  <Link href="/faxes">
                    <Inbox className="h-4 w-4" />
                    <span className="font-medium">Fax Queue</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxUpload}
                  tooltip="Upload Fax"
                  className="rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-blue-500/25"
                >
                  <Link href="/faxes/upload">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload Fax</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isFaxSettings}
                  tooltip="Fax Settings"
                  className="rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-blue-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-indigo-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-blue-500/25"
                >
                  <Link href="/faxes/settings">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium">Settings & Stats</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-2">
            <FileText className="h-3.5 w-3.5 mr-2 inline" />
            Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={isHome} 
                  tooltip="Home"
                  className="rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500 data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-emerald-500/25"
                >
                  <Link href="/">
                    <Home className="h-4 w-4" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isUpload}
                  tooltip="Upload & summarize"
                  className="rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500 data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-emerald-500/25"
                >
                  <Link href="/upload">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Upload & Summarize</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={!!isDocuments}
                  tooltip="Recent documents"
                  className="rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500 data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:shadow-emerald-500/25"
                >
                  <Link href="/documents">
                    <History className="h-4 w-4" />
                    <span className="font-medium">Recent Documents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/50 dark:border-slate-800/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              tooltip="Sign out"
              className="rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/50 transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium group-data-[collapsible=icon]:hidden">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
