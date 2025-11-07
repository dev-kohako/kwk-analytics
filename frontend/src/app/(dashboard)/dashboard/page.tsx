"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateSmart } from "@/lib/utils";
import { useDashboards } from "@/hooks/useDashboards";

export default function DashboardsList() {
  const router = useRouter();
  const {
    dashboards,
    visibleDashboards,
    loading,
    error,
    page,
    totalPages,
    setPage,
    handleRefetch,
  } = useDashboards();

  const handleCreateDashboard = () => {
    toast.info("Redirecionando para criação de Dashboard...");
    router.push("/insights");
  };

  return (
    <main
      className="py-6 w-full max-w-7xl mx-auto space-y-8 overflow-hidden"
      aria-labelledby="dashboards-heading"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1
          id="dashboards-heading"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          Dashboards
        </h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefetch}
            className="flex items-center gap-2"
            aria-label="Atualizar lista de dashboards"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            <span>Atualizar</span>
          </Button>
          <Button
            onClick={handleCreateDashboard}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>Novo Dashboard</span>
          </Button>
        </div>
      </div>

      {loading && (
        <section aria-busy="true" aria-label="Carregando dashboards">
          <ul className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-20 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md"
        >
          ⚠️ Erro ao carregar dashboards: {error.message}
        </p>
      )}

      {!loading && !error && (
        <section
          aria-live="polite"
          aria-label="Lista de dashboards"
          className="min-h-[40vh]"
        >
          {dashboards.length > 0 ? (
            <>
              <ul
                role="list"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visibleDashboards.map((d, index) => (
                  <motion.li
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={`/dashboard/${d.id}`}
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg block"
                      aria-label={`Abrir dashboard ${d.name}`}
                    >
                      <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold truncate">
                            {d.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Criado em {formatDateSmart(d.created_at)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div
              role="status"
              className="flex flex-col items-center justify-center h-[40vh] text-center space-y-3"
            >
              <p className="text-lg font-medium">
                Nenhum dashboard salvo ainda.
              </p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Crie e salve dashboards personalizados para monitorar os dados
                do seu negócio em tempo real.
              </p>
              <Button
                variant="outline"
                onClick={handleCreateDashboard}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>Criar Dashboard</span>
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
