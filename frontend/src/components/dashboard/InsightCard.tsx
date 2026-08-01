"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Lightbulb,
  Minus,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, pct } from "@/lib/utils";
import type { AutoInsight } from "@/gql/graphql";

/**
 * Renderiza um insight como texto — nunca como HTML.
 * A mensagem pode vir de um modelo de linguagem, então tratá-la como markup
 * abriria espaço para injeção de conteúdo na página.
 */

const SEVERITY_STYLES = {
  positive: {
    ring: "border-l-4 border-l-emerald-500",
    icon: TrendingUp,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    label: "Positivo",
  },
  info: {
    ring: "border-l-4 border-l-sky-500",
    icon: Info,
    iconClass: "text-sky-600 dark:text-sky-400",
    label: "Informativo",
  },
  warning: {
    ring: "border-l-4 border-l-amber-500",
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    label: "Atenção",
  },
  critical: {
    ring: "border-l-4 border-l-red-500",
    icon: AlertTriangle,
    iconClass: "text-red-600 dark:text-red-400",
    label: "Crítico",
  },
} as const;

type Severity = keyof typeof SEVERITY_STYLES;

const DeltaChip = ({ value }: { value: number }) => {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone =
    value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : value < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", tone)}>
      <Icon className="h-4 w-4" />
      {pct(value)}
    </span>
  );
};

export function InsightCard({
  insight,
  index = 0,
}: {
  insight: AutoInsight;
  index?: number;
}) {
  const severity = (insight.severity ?? "info") as Severity;
  const style = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;
  const Icon = style.icon;
  const isAI = insight.generatedBy === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card
        className={cn(
          "flex h-full flex-col gap-0 border-border/60 py-0 shadow-sm",
          style.ring
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-6 pb-3 pt-5">
          <div className="flex items-start gap-2">
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.iconClass)} />
            <CardTitle className="text-base leading-tight">
              {insight.title}
            </CardTitle>
          </div>

          <Badge
            variant={isAI ? "default" : "secondary"}
            className="shrink-0 gap-1"
            title={
              isAI
                ? "Gerado por modelo de linguagem a partir dos agregados"
                : "Calculado por regra determinística sobre os dados"
            }
          >
            {isAI ? <Sparkles className="h-3 w-3" /> : null}
            {isAI ? "IA" : "Regra"}
          </Badge>
        </CardHeader>

        <CardContent className="flex-1 space-y-3 px-6 pb-6 pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {insight.message}
          </p>

          {(insight.deltaPercent !== null && insight.deltaPercent !== undefined) ||
          insight.entity ? (
            <div className="flex flex-wrap items-center gap-3">
              {insight.deltaPercent !== null &&
                insight.deltaPercent !== undefined && (
                  <DeltaChip value={insight.deltaPercent} />
                )}
              {insight.entity && (
                <Badge variant="outline" className="font-normal">
                  {insight.entity}
                </Badge>
              )}
            </div>
          ) : null}

          {insight.suggestion && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 p-3">
              <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-sm leading-relaxed">{insight.suggestion}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
