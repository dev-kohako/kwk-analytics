"use client";

import { FileQuestion } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DashboardChart } from "@/components/charts/DashboardChart";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { describeAnalysis } from "@/lib/labels";
import type { Dashboard } from "@/gql/graphql";

/**
 * Renderiza o dashboard conforme o que foi realmente salvo.
 *
 * O `config` é um JSON livre e mudou de formato ao longo do tempo: existem
 * dashboards salvos só com definição de gráfico, outros com insights, outros
 * com a definição de um pivot, e alguns sem dado nenhum para desenhar. Antes a
 * tela assumia sempre o formato de gráfico, então quem abria um dos outros via
 * um gráfico vazio, sem explicação.
 */

type Config = Record<string, any>;

const temGrafico = (c: Config): boolean =>
  Boolean(c.xKey) &&
  Array.isArray(c.lines) &&
  c.lines.length > 0 &&
  Array.isArray(c.data) &&
  c.data.length > 0;

const temInsights = (c: Config): boolean =>
  Array.isArray(c.insights) && c.insights.length > 0;

/** Só os KPIs com origem no dado. O formato antigo guardava valores estimados. */
const kpisReais = (c: Config) => {
  const k = c.kpis;
  if (!k || typeof k !== "object") return null;
  if (!k.revenue && !k.averageTicket) return null;
  return k;
};

const temPivot = (c: Config): boolean =>
  Array.isArray(c.measures) && c.measures.length > 0;

export function DashboardContent({ dashboard }: { dashboard: Dashboard }) {
  const config: Config = (dashboard.config as Config) ?? {};

  const grafico = temGrafico(config);
  const insights = temInsights(config);
  const kpis = kpisReais(config);
  const pivot = temPivot(config);

  const vazio = !grafico && !insights && !kpis && !pivot;

  if (vazio) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <FileQuestion
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            Este dashboard foi salvo sem dados para exibir.
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Ele guarda apenas a configuração, sem o resultado. Refaça a análise
            em Explorar e salve novamente para vê-la aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {kpis && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Receita"
            value={kpis.revenue?.value}
            previous={kpis.revenue?.previous}
            deltaPercent={kpis.revenue?.deltaPercent}
            isCurrency
          />
          <KpiCard
            title="Ticket médio"
            value={kpis.averageTicket?.value}
            previous={kpis.averageTicket?.previous}
            deltaPercent={kpis.averageTicket?.deltaPercent}
            isCurrency
          />
          <KpiCard
            title="Clientes que pararam de comprar"
            value={kpis.lostCustomers}
          />
          <KpiCard title="Regiões atendidas" value={kpis.regions} />
        </section>
      )}

      {grafico && <DashboardChart dashboard={dashboard} />}

      {pivot && (
        <Card>
          <CardContent className="px-6 py-5">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Análise: </span>
              {describeAnalysis(config.measures, config.dimensions ?? [])}
            </p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Leituras salvas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {config.insights.map((insight: any, idx: number) => (
              <InsightCard
                key={insight.id ?? idx}
                insight={insight}
                index={idx}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
