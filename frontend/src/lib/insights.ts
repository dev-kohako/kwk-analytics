import type { AutoInsight } from "@/gql/graphql";
import { formatCurrency, pct } from "@/lib/utils";

/**
 * Helpers de leitura e exportação dos insights.
 *
 * O público final não é técnico: o que importa primeiro é o problema, e o que
 * sai da tela precisa abrir no Excel e colar no WhatsApp sem retrabalho.
 */

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  positive: 2,
  info: 3,
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "Crítico",
  warning: "Atenção",
  positive: "Positivo",
  info: "Informativo",
};

export const severityLabel = (severity?: string | null): string =>
  SEVERITY_LABEL[severity ?? "info"] ?? "Informativo";

/** Problema primeiro: crítico, atenção, positivo e por último informativo. */
export function sortBySeverity(insights: AutoInsight[]): AutoInsight[] {
  return [...insights].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );
}

export function countBySeverity(insights: AutoInsight[]) {
  return insights.reduce<Record<string, number>>((acc, insight) => {
    acc[insight.severity] = (acc[insight.severity] ?? 0) + 1;
    return acc;
  }, {});
}

/** Linhas com cabeçalho em português, prontas para virar planilha. */
export function insightsToRows(insights: AutoInsight[]) {
  return insights.map((insight) => ({
    Prioridade: severityLabel(insight.severity),
    Título: insight.title,
    Leitura: insight.message,
    Métrica: insight.metric ?? "",
    Item: insight.entity ?? "",
    Valor: insight.value ?? "",
    "Valor anterior": insight.previousValue ?? "",
    "Variação (%)": insight.deltaPercent ?? "",
    "O que fazer": insight.suggestion ?? "",
    Origem: insight.generatedBy === "ai" ? "IA" : "Regra",
  }));
}

const isMoney = (metric?: string | null): boolean =>
  metric === "revenue" || metric === "average_ticket" || metric === "revenue_daily";

/** Resumo em texto puro, pensado para colar em WhatsApp ou e-mail. */
export function insightsToText(insights: AutoInsight[]): string {
  const linhas = sortBySeverity(insights).map((insight) => {
    const partes = [`• ${insight.title}: ${insight.message}`];

    if (insight.value !== null && insight.value !== undefined) {
      const valor = isMoney(insight.metric)
        ? formatCurrency(insight.value)
        : String(insight.value);
      const delta =
        insight.deltaPercent !== null && insight.deltaPercent !== undefined
          ? ` (${pct(insight.deltaPercent, 1)})`
          : "";
      partes.push(`  ${valor}${delta}`);
    }

    if (insight.suggestion) partes.push(`  → ${insight.suggestion}`);

    return partes.join("\n");
  });

  return [
    "Resumo dos últimos 30 dias — KWK Analytics",
    "",
    ...linhas,
    "",
    `Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
  ].join("\n");
}
