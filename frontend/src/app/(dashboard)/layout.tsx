"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/Sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { autenticado, carregando } = useAuth();

  // Espera a renovação do refresh antes de decidir: redirecionar durante a
  // verificação chutaria para fora quem apenas recarregou a página.
  useEffect(() => {
    if (!carregando && !autenticado) router.replace("/entrar");
  }, [carregando, autenticado, router]);

  if (carregando || !autenticado) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

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
