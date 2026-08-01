"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Copy, RefreshCcw } from "lucide-react";
import { useDashboardById } from "../../../../hooks/useDashboardById";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { formatDateSmart } from "@/lib/utils";

export default function DashboardDetailsPage() {
  const { id } = useParams();
  const dashboardId = Number(id);
  const { dashboard, loading, error, refetch, copyLink } =
    useDashboardById(dashboardId);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-1/2 md:w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-destructive font-medium mb-4">
          Erro ao carregar dashboard: {error.message}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-4 md:p-6 text-center text-muted-foreground">
        Dashboard não encontrado.
      </div>
    );
  }

  return (
    <main className="py-6 w-full max-w-7xl mx-auto space-y-8 overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-center sm:text-left">
          {dashboard.name}
        </h1>
        <div className="space-x-2 space-y-4">
          <Button
            onClick={() => refetch()}
            className="self-center sm:self-auto w-full sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <Button
            variant="outline"
            className="self-center sm:self-auto w-full sm:w-auto"
            onClick={copyLink}
          >
            <Copy className="w-4 h-4 mr-2" /> Copiar link
          </Button>
        </div>
      </header>

      <DashboardContent dashboard={dashboard} />

      {/* A configuração crua interessa a quem depura, não a quem analisa venda.
          Sai da tela principal e vira detalhe recolhido no rodapé. */}
      <details className="group border-t pt-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronRight
            className="h-4 w-4 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
          Ver a configuração salva
        </summary>
        <pre className="mt-3 w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(dashboard.config, null, 2)}
        </pre>
      </details>

      <p className="text-sm text-muted-foreground">
        Criado em {formatDateSmart(dashboard.created_at)}
      </p>
    </main>
  );
}
