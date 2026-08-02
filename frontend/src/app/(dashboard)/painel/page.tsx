"use client";

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  LayoutDashboard,
  Lightbulb,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useInsights } from "@/hooks/useInsights";
import { sortBySeverity } from "@/lib/insights";

/**
 * Home como visão geral, não como menu.
 *
 * A versão anterior mostrava três cards de navegação e um bloco dizendo que
 * "aqui você poderá acompanhar KPIs" — futuro, numa ferramenta cujo trabalho é
 * justamente responder como o negócio está indo. Agora a primeira tela já traz
 * o número e o ponto que precisa de atenção.
 */

const ATALHOS = [
  {
    href: "/insights",
    icon: Lightbulb,
    titulo: "Insights",
    descricao: "Leituras automáticas do período",
  },
  {
    href: "/explorar",
    icon: Compass,
    titulo: "Explorar",
    descricao: "Monte sua própria análise",
  },
  {
    href: "/dashboards",
    icon: LayoutDashboard,
    titulo: "Dashboards",
    descricao: "Suas análises salvas",
  },
];

export default function HomePage() {
  const { filters } = useDashboardStore();
  const { isLoading, insights, kpis } = useInsights(filters);

  // O que exige ação aparece primeiro; nada crítico é notícia boa, não ausência.
  const prioritario = sortBySeverity(insights).find(
    (i) => i.severity === "critical" || i.severity === "warning"
  );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sua operação</h1>
        <p className="text-sm text-muted-foreground">
          Últimos 30 dias, comparados com os 30 anteriores.
        </p>
      </header>

      {isLoading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Receita"
            value={kpis.revenue.value}
            previous={kpis.revenue.previous}
            deltaPercent={kpis.revenue.deltaPercent}
            isCurrency
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          />
          <KpiCard
            title="Ticket médio"
            value={kpis.averageTicket.value}
            previous={kpis.averageTicket.previous}
            deltaPercent={kpis.averageTicket.deltaPercent}
            isCurrency
            icon={<TrendingUp className="h-5 w-5 text-sky-500" />}
          />
          <KpiCard
            title="Clientes que pararam de comprar"
            value={kpis.lostCustomers}
            icon={<Users className="h-5 w-5 text-red-500" />}
          />
          <KpiCard
            title="Regiões atendidas"
            value={kpis.regions}
            icon={<Compass className="h-5 w-5 text-muted-foreground" />}
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {prioritario ? "Precisa da sua atenção" : "Nada urgente por aqui"}
        </h2>

        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : prioritario ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <InsightCard insight={prioritario} />
            <Card className="flex h-full items-center justify-center border-dashed">
              <CardContent className="px-6 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Outras {insights.length - 1} leituras do período estão nos
                  Insights.
                </p>
                <Link href="/insights">
                  <Button variant="outline" size="sm" className="mt-3">
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="px-6 py-10 text-center">
              <p className="text-sm font-medium">
                Nenhum ponto crítico no período.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {insights.length > 0
                  ? "As leituras completas estão na tela de Insights."
                  : "Assim que houver vendas no período, as leituras aparecem aqui."}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {ATALHOS.map(({ href, icon: Icon, titulo, descricao }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors hover:border-primary/50 hover:bg-muted/40">
              <CardContent className="flex items-center gap-4 px-6 py-5">
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium">{titulo}</p>
                  <p className="text-sm text-muted-foreground">{descricao}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
