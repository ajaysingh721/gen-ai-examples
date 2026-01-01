"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = pathname ? encodeURIComponent(pathname) : "/";
      router.replace(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router, pathname]);

  if (status === "loading") {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-purple-950/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const normalizedPath = pathname ?? "/";
  const homeCrumb = { href: "/", label: "Home" };
  const currentCrumb = (() => {
    if (normalizedPath === "/") return homeCrumb;
    if (normalizedPath === "/upload") {
      return { href: "/upload", label: "Upload & Summarize" };
    }
    if (normalizedPath.startsWith("/documents")) {
      return { href: "/documents", label: "Recent Documents" };
    }
    if (normalizedPath === "/faxes") {
      return { href: "/faxes", label: "Fax Queue" };
    }
    if (normalizedPath === "/faxes/upload") {
      return { href: "/faxes/upload", label: "Upload Fax" };
    }
    if (normalizedPath === "/faxes/statistics") {
      return { href: "/faxes/statistics", label: "Statistics" };
    }
    if (normalizedPath === "/faxes/settings") {
      return { href: "/faxes/settings", label: "Settings" };
    }

    const segment = normalizedPath.split("/").filter(Boolean)[0] ?? "";
    const label = segment
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : "Home";
    return { href: normalizedPath, label };
  })();

  // Parent crumb for nested fax pages
  const parentCrumb = normalizedPath.startsWith("/faxes/") 
    ? { href: "/faxes", label: "Fax Queue" } 
    : null;

  return (
    <SidebarProvider>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/20 text-foreground flex">
        <AppSidebar />

        <SidebarInset className="w-full">
          <main className="flex-1 flex flex-col w-full">
            <header className="sticky top-0 z-10 glass border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <div className="px-6 py-4 flex items-center gap-3">
                <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 hover:scale-105" />
                <div className="h-5 w-px bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-700" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {normalizedPath === "/" ? (
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-semibold text-slate-900 dark:text-slate-100">{homeCrumb.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    ) : (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href={homeCrumb.href} className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">
                              {homeCrumb.label}
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-400 dark:text-slate-600" />
                        {parentCrumb && (
                          <>
                            <BreadcrumbItem>
                              <BreadcrumbLink asChild>
                                <Link href={parentCrumb.href} className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">
                                  {parentCrumb.label}
                                </Link>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-400 dark:text-slate-600" />
                          </>
                        )}
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-semibold text-slate-900 dark:text-slate-100">{currentCrumb.label}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
