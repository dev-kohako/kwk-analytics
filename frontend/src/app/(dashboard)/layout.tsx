"use client";

import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="fixed bg-background w-full flex h-16 shrink-0 items-center gap-2 border-b px-4 z-40">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </header>
        {/* min-h-screen com padding: h-screen + mt-14 somava 100vh + 3.5rem e
            cortava o fim da página. */}
        <div className="flex min-h-screen bg-background text-foreground pt-16">
          <main className="flex-1 flex flex-col">
            <section className="flex-1 p-6">{children}</section>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
