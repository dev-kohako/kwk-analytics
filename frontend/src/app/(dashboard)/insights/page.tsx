"use client";

import { motion } from "framer-motion";
import {
  Copy,
  Download,
  MapPin,
  Save,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { copyToClipboard, exportToCSV } from "@/lib/utils";
import {
  countBySeverity,
  insightsToRows,
  insightsToText,
  sortBySeverity,
} from "@/lib/insights";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useInsights } from "../../../hooks/useInsights";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function InsightsPage() {
  const { filters } = useDashboardStore();
  const {
    isLoading,
    refetchAll,
    insights,
    topProducts,
    deliveryTrend,
    lostCustomers,
    kpis,
    aiInsightsCount,
    saveDashboard,
    loading
  } = useInsights(filters);

  const [dashboardName, setDashboardName] = useState("");

  // O React Compiler cuida da memoização — sem useMemo manual aqui.
  const orderedInsights = sortBySeverity(insights);
  const severityCounts = countBySeverity(insights);

  const handleExportInsights = () => {
    exportToCSV(insightsToRows(orderedInsights), "insights-30-dias.csv");
    toast.success("Planilha baixada.");
  };

  const handleCopySummary = async () => {
    const ok = await copyToClipboard(insightsToText(insights));
    if (ok) toast.success("Resumo copiado — é só colar.");
    else toast.error("Não foi possível copiar o resumo.");
  };

const handleSaveDashboard = async () => {
  const ok = await saveDashboard(dashboardName);
  if (ok) setDashboardName("");
};

  return (
    <main className="py-6 w-full max-w-7xl mx-auto space-y-8 overflow-hidden">
      <header className="flex flex-col lg:flex-row items-start lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Insights Analíticos
          </h1>
          <p className="text-sm text-muted-foreground">
            Tendências automáticas e indicadores baseados nos dados recentes.
          </p>
        </div>

        <div className="flex flex-row items-end gap-3 w-full md:w-auto">
          <div className="flex flex-col w-full">
            <Label
              htmlFor="dashboard-name"
              className="text-sm font-medium text-muted-foreground"
            >
              Nome do dashboard
            </Label>
            <Input
              id="dashboard-name"
              placeholder="Digite um nome..."
              value={dashboardName}
              onChange={(e) => setDashboardName(e.target.value)}
              className="w-full lg:w-72 mt-1"
            />
          </div>

          <Button
            onClick={handleSaveDashboard}
            disabled={loading || !dashboardName.trim()}
            variant="default"
            aria-label="Salvar dashboard atual"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <Separator className="block md:hidden w-full -mt-3 mb-5" />

      <DashboardFilters onApply={refetchAll} />

      {isLoading ? (
        <section
          aria-busy="true"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Receita (30 dias)"
            value={kpis.revenue.value}
            previous={kpis.revenue.previous}
            deltaPercent={kpis.revenue.deltaPercent}
            isCurrency
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          />
          <KpiCard
            title="Ticket Médio"
            value={kpis.averageTicket.value}
            previous={kpis.averageTicket.previous}
            deltaPercent={kpis.averageTicket.deltaPercent}
            isCurrency
            icon={<TrendingUp className="h-5 w-5 text-sky-500" />}
          />
          <KpiCard
            title="Clientes Perdidos"
            value={kpis.lostCustomers}
            icon={<Users className="h-5 w-5 text-red-500" />}
          />
          <KpiCard
            title="Regiões Atendidas"
            value={deliveryTrend.length}
            icon={<MapPin className="h-5 w-5" />}
          />
        </section>
      )}

      {topProducts.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardCard
            title="Top Produtos"
            subtitle="Produtos mais vendidos no período"
          >
            <BarChart
              data={topProducts.slice(0, 5)}
              xKey="product_id"
              bars={[{ key: "faturamento", name: "Faturamento (R$)" }]}
              height={350}
            />
          </DashboardCard>
        </motion.section>
      ) : (
        !isLoading && (
          <DashboardCard
            title="Top Produtos"
            subtitle="Nenhum dado disponível no período selecionado."
          >
            <p className="flex items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <TrendingDown className="h-4 w-4" aria-hidden="true" />
              Sem vendas registradas nesse intervalo.
            </p>
          </DashboardCard>
        )
      )}

      {deliveryTrend.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardCard
            title="Tendência por Região"
            subtitle="Tempo médio de entrega por região (em minutos)"
          >
            <LineChart
              data={deliveryTrend}
              xKey="delivery_region"
              lines={[
                { key: "avg_prev", name: "Período Anterior" },
                { key: "avg_cur", name: "Período Atual" },
              ]}
              height={350}
            />
          </DashboardCard>
        </motion.section>
      ) : (
        !isLoading && (
          <DashboardCard
            title="Tendência por Região"
            subtitle="Nenhum dado disponível no período."
          >
            <p className="flex items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Truck className="h-4 w-4" aria-hidden="true" />
              Sem registros de entregas nesse intervalo.
            </p>
          </DashboardCard>
        )
      )}

      {insights.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight">
                Leituras automáticas
              </h2>
              <p className="text-sm text-muted-foreground">
                Últimos 30 dias contra os 30 anteriores.
                {aiInsightsCount > 0
                  ? ` ${aiInsightsCount} ${aiInsightsCount === 1 ? "leitura foi gerada" : "leituras foram geradas"} por IA.`
                  : " Análise determinística — a IA está desligada."}
              </p>

              {(severityCounts.critical || severityCounts.warning) && (
                <div className="flex flex-wrap items-center gap-2">
                  {severityCounts.critical > 0 && (
                    <Badge variant="destructive">
                      {severityCounts.critical}{" "}
                      {severityCounts.critical === 1 ? "crítico" : "críticos"}
                    </Badge>
                  )}
                  {severityCounts.warning > 0 && (
                    <Badge variant="secondary">
                      {severityCounts.warning}{" "}
                      {severityCounts.warning === 1
                        ? "ponto de atenção"
                        : "pontos de atenção"}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySummary}
                aria-label="Copiar resumo dos insights"
              >
                <Copy className="h-4 w-4" />
                Copiar resumo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportInsights}
                aria-label="Baixar insights em planilha"
              >
                <Download className="h-4 w-4" />
                Baixar planilha
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {orderedInsights.map((insight, idx) => (
              <InsightCard key={insight.id} insight={insight} index={idx} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
