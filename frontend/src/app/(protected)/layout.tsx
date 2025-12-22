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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading session…</p>
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
    if (normalizedPath === "/faxes/settings") {
      return { href: "/faxes/settings", label: "Settings & Stats" };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-foreground flex">
        <AppSidebar />

        <SidebarInset className="w-full">
          <main className="flex-1 flex flex-col w-full">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
              <div className="px-6 py-4 flex items-center gap-3">
                <SidebarTrigger className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" />
                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
                <Breadcrumb>
                  <BreadcrumbList>
                    {normalizedPath === "/" ? (
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-medium text-slate-900 dark:text-slate-100">{homeCrumb.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    ) : (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href={homeCrumb.href} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                              {homeCrumb.label}
                            </Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-slate-300 dark:text-slate-600" />
                        {parentCrumb && (
                          <>
                            <BreadcrumbItem>
                              <BreadcrumbLink asChild>
                                <Link href={parentCrumb.href} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                                  {parentCrumb.label}
                                </Link>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="text-slate-300 dark:text-slate-600" />
                          </>
                        )}
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-medium text-slate-900 dark:text-slate-100">{currentCrumb.label}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex-1 p-6 md:p-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
