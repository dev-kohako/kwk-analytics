"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber, pct } from "@/lib/utils";

type Props = {
  title: string;
  value: number | null | undefined;
  previous?: number | null;
  deltaPercent?: number | null;
  isCurrency?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
};

export function KpiCard({
  title,
  value,
  previous,
  deltaPercent,
  isCurrency = false,
  icon,
  loading = false,
}: Props) {
  const formattedValue = isCurrency ? formatCurrency(value) : formatNumber(value);

  const deltaColor =
    deltaPercent && deltaPercent > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : deltaPercent && deltaPercent < 0
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  const DeltaIcon =
    deltaPercent && deltaPercent > 0
      ? TrendingUp
      : deltaPercent && deltaPercent < 0
      ? TrendingDown
      : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="flex h-full flex-col justify-between gap-0 border-border/60 py-0 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2 pt-5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>

        <CardContent className="px-6 pb-5">
          {loading ? (
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {formattedValue}
              </p>

              {deltaPercent !== undefined && deltaPercent !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
                  <span className={`text-sm font-medium ${deltaColor}`}>
                    {pct(deltaPercent)}
                  </span>
                  {previous !== undefined && previous !== null && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (anterior: {isCurrency ? formatCurrency(previous) : formatNumber(previous)})
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
