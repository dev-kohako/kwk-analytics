"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Play, Database, Save, Download } from "lucide-react";
import { ChipSelect } from "@/components/dashboard/ChipSelect";
import { useExplore } from "@/hooks/useExplore";
import { DIMENSIONS, MEASURES } from "@/types/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn, exportToCSV } from "@/lib/utils";
import {
  describeAnalysis,
  dimensionLabel,
  formatDimensionValue,
  formatMeasure,
  measureColumn,
  measureKey,
  measureLabel,
} from "@/lib/labels";

/** Numerador dos passos, para o fluxo se ler como um roteiro. */
const StepBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
    {children}
  </span>
);
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Filter, FilterBuilder } from "@/components/dashboard/FilterBuilder";
import { Fragment, useMemo } from "react";

export default function ExplorePage() {
  const {
    filters,
    setFilters,
    handleRun,
    loading,
    data,
    page,
    setPage,
    totalPages,
    saveAsDashboard,
    compare,
    setCompare,
    previous,
  } = useExplore();

  const merged = useMemo(() => {
    const rows = data?.pivot?.rows ?? [];
    const prev = previous ?? [];
    if (rows.length === 0) return [];

    const dim = filters.dimensions?.[0];
    if (!dim) return rows;

    const prevMap = new Map<string, any>();
    for (const p of prev) prevMap.set(String(p[dim] ?? "").trim(), p);

    return rows.map((r) => {
      const key = String(r[dim] ?? "").trim();
      const p = prevMap.get(key);
      if (!p) return r;

      const out: Record<string, any> = { ...r };
      for (const [k, v] of Object.entries(r)) {
        const prevVal = p[k];
        if (typeof v === "number" && typeof prevVal === "number") {
          const delta = v - prevVal;
          const pct = prevVal !== 0 ? delta / prevVal : null;
          out[`${k}_prev`] = prevVal;
          out[`${k}_delta`] = delta;
          out[`${k}_delta_pct`] = pct;
        }
      }
      return out;
    });
  }, [data?.pivot?.rows, previous, filters.dimensions]);

  const paginatedMerged = useMemo(() => {
    const start = (page - 1) * 10;
    return merged.slice(start, start + 10);
  }, [merged, page]);

  // A tabela mostra só o que foi pedido. Antes renderizava as três métricas
  // sempre, então quem escolhia uma via duas colunas inteiras de travessão.
  const activeMeasures =
    filters.measures?.length > 0 ? filters.measures : MEASURES;

  // Colunas de comparação só existem quando há período anterior de fato.
  const showComparison = Boolean(compare && previous);

  return (
    <main className="py-6 w-full max-w-7xl mx-auto space-y-8 overflow-hidden">
      <header className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center justify-center gap-2">
          <Database
            className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500"
            aria-hidden="true"
          />
          Pivot Builder
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto">
          Responda o que quer ver e a plataforma monta a consulta para você.
        </p>
      </header>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-base font-semibold">
            Montar análise
          </CardTitle>
          <CardDescription className="text-sm">
            Quatro passos. Nenhum deles exige saber SQL.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 px-6 pb-6 pt-0">
          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <StepBadge>1</StepBadge>O que você quer ver?
              </h2>
              <p className="pl-8 text-sm text-muted-foreground">
                Escolha uma ou mais informações para medir.
              </p>
            </div>

            <div className="pl-8">
              <ChipSelect
                ariaLabel="Informações a medir"
                minOne
                options={MEASURES.map((m) => ({
                  value: measureKey(m),
                  label: measureLabel(m),
                }))}
                selected={filters.measures.map((m) => measureKey(m))}
                onChange={(values) =>
                  setFilters({
                    ...filters,
                    measures: values.map((v) => {
                      const [fn, field] = v.split(":");
                      return { fn: fn as any, field };
                    }),
                  })
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <StepBadge>2</StepBadge>Como quer separar?
              </h2>
              <p className="pl-8 text-sm text-muted-foreground">
                Sem nenhum selecionado, você vê o total do período.
              </p>
            </div>

            <div className="pl-8">
              <ChipSelect
                ariaLabel="Como separar os resultados"
                options={DIMENSIONS.map((d) => ({
                  value: d,
                  label: dimensionLabel(d),
                }))}
                selected={filters.dimensions ?? []}
                onChange={(values) =>
                  setFilters({ ...filters, dimensions: values })
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <StepBadge>3</StepBadge>Em qual período?
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-4 pl-8">
              <DateRangePicker
                value={
                  filters.dateRange?.from && filters.dateRange?.to
                    ? {
                        from: new Date(filters.dateRange.from),
                        to: new Date(filters.dateRange.to),
                      }
                    : undefined
                }
                onChange={(range) => {
                  if (range?.from && range?.to) {
                    setFilters({
                      ...filters,
                      dateRange: {
                        from: range.from.toISOString(),
                        to: range.to.toISOString(),
                      },
                    });
                  }
                }}
              />

              <div className="flex items-center gap-2">
                <Switch
                  id="compare"
                  checked={compare}
                  onCheckedChange={setCompare}
                />
                <Label
                  htmlFor="compare"
                  className="text-sm text-muted-foreground"
                >
                  Comparar com período anterior
                </Label>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <StepBadge>4</StepBadge>Filtrar algo específico?
                <span className="font-normal text-muted-foreground">
                  (opcional)
                </span>
              </h2>
            </div>

            <div className="pl-8">
              <FilterBuilder
                filters={filters.filters as Filter[]}
                setFilters={(update) =>
                  setFilters((prev) => ({
                    ...prev,
                    filters:
                      typeof update === "function"
                        ? (update(prev.filters as Filter[]) as any)
                        : update,
                  }))
                }
              />
            </div>
          </section>

          <Separator />

          {/* Leitura de volta do que foi montado, em português, antes de rodar. */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Você vai ver: </span>
              {describeAnalysis(filters.measures, filters.dimensions ?? [], {
                comparing: compare,
              })}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                onClick={() => handleRun(compare)}
                disabled={loading || filters.measures.length === 0}
                className="w-full sm:w-auto"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {loading ? "Executando..." : "Executar análise"}
              </Button>

              <Button
                onClick={() => saveAsDashboard("Nova análise pivot")}
                variant="outline"
                disabled={!data?.pivot}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar como Dashboard
              </Button>

              <Button
                onClick={() => exportToCSV(merged || [], "analise.csv")}
                variant="outline"
                disabled={merged.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Baixar planilha
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card className="p-4 sm:p-6 shadow-sm">
          <Skeleton className="h-6 w-56 sm:w-64 mb-4" />
          <Skeleton className="h-[180px] sm:h-[220px] w-full rounded-md" />
        </Card>
      )}

      {data?.pivot && (
        <Card className="overflow-hidden shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
              📊 Resultados da Análise
              <Badge
                variant="outline"
                className="border-blue-500 text-blue-500"
              >
                {data.pivot.rows.length} linhas
              </Badge>
              {compare && previous && (
                <Badge variant="secondary">Comparando períodos</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              Consulta gerada automaticamente pelo motor de pivotagem.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 sm:gap-6 p-4 sm:p-6">
            <details className="mb-2 sm:mb-4">
              <summary className="cursor-pointer text-sm text-muted-foreground pb-3">
                Ver SQL
              </summary>
              <pre className="text-xs sm:text-sm bg-muted p-3 sm:p-4 rounded-md w-full wrap-break-word whitespace-pre-wrap">
                {data.pivot.sql}
              </pre>
            </details>

            <div className="w-full overflow-x-auto rounded-md border">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead className="sticky top-0 bg-muted/70 backdrop-blur-sm">
                  <tr className="text-muted-foreground">
                    {filters.dimensions?.map((dim) => (
                      <th
                        key={dim}
                        rowSpan={showComparison ? 2 : 1}
                        className="px-4 py-3 text-left font-medium border-b border-r bg-muted/50"
                      >
                        {dimensionLabel(dim)}
                      </th>
                    ))}
                    {activeMeasures.map((m) => (
                      <th
                        key={measureKey(m)}
                        colSpan={showComparison ? 3 : 1}
                        className="px-4 py-3 text-center font-semibold border-b border-r bg-muted/50"
                      >
                        {measureLabel(m)}
                      </th>
                    ))}
                  </tr>

                  {showComparison && (
                    <tr className="bg-muted/30 text-muted-foreground">
                      {activeMeasures.flatMap((m) =>
                        ["Atual", "Anterior", "Δ"].map((label) => (
                          <th
                            key={`${measureKey(m)}-${label}`}
                            className="px-4 py-2 border-r text-center font-normal"
                          >
                            {label}
                          </th>
                        ))
                      )}
                    </tr>
                  )}
                </thead>

                <tbody>
                  {paginatedMerged.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      {filters.dimensions?.map((dim) => (
                        <td
                          key={dim}
                          className="px-4 py-3 border-r font-medium whitespace-nowrap"
                        >
                          {formatDimensionValue(dim, row[dim])}
                        </td>
                      ))}

                      {activeMeasures.map((m) => {
                        const base = measureColumn(m);
                        const curr = row[base];
                        const prev = row[`${base}_prev`];
                        const pct = row[`${base}_delta_pct`];
                        const delta = row[`${base}_delta`];
                        const up = typeof delta === "number" && delta > 0;
                        const down = typeof delta === "number" && delta < 0;

                        return (
                          <Fragment key={base}>
                            <td className="px-4 py-3 border-r text-right font-medium tabular-nums">
                              {formatMeasure(curr, m.field)}
                            </td>

                            {showComparison && (
                              <>
                                <td className="px-4 py-3 border-r text-right text-muted-foreground tabular-nums">
                                  {formatMeasure(prev, m.field)}
                                </td>
                                <td
                                  className={cn(
                                    "px-4 py-3 border-r text-right font-semibold whitespace-nowrap tabular-nums",
                                    up && "text-emerald-600 dark:text-emerald-400",
                                    down && "text-red-600 dark:text-red-400"
                                  )}
                                >
                                  {typeof pct === "number"
                                    ? `${up ? "+" : ""}${(pct * 100).toFixed(1)}%`
                                    : "—"}
                                </td>
                              </>
                            )}
                          </Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <>
                <Separator className="my-4" />
                <Pagination>
                  <PaginationContent className="justify-center gap-x-6">
                    <PaginationItem>
                      <PaginationPrevious
                        className="cursor-pointer"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-sm font-medium">
                        Página {page} de {totalPages}
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        className="cursor-pointer"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
