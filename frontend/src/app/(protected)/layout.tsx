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
    if (normalizedPath.startsWith("/upload")) {
      return { href: "/upload", label: "Upload & summarize" };
    }
    if (normalizedPath.startsWith("/documents")) {
      return { href: "/documents", label: "Recent documents" };
    }

    const segment = normalizedPath.split("/").filter(Boolean)[0] ?? "";
    const label = segment
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : "Home";
    return { href: normalizedPath, label };
  })();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex">
        <AppSidebar />

        <SidebarInset>
          <main className="flex-1 flex flex-col">
            <div className="px-4 pt-4 flex items-center gap-2">
              <SidebarTrigger />
              <Breadcrumb>
                <BreadcrumbList>
                  {normalizedPath === "/" ? (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{homeCrumb.label}</BreadcrumbPage>
                    </BreadcrumbItem>
                  ) : (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link href={homeCrumb.href}>
                            {homeCrumb.label}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{currentCrumb.label}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex-1 flex px-4 py-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
