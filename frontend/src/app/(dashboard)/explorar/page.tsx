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
import { Play, Database, Save, Download, ChevronRight } from "lucide-react";
import { ChipSelect } from "@/components/dashboard/ChipSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <main className="mx-auto w-full max-w-7xl space-y-8 py-6">
      {/* Mesmo cabeçalho das demais telas: alinhado à esquerda, título em
          2xl, subtítulo em text-sm. Era o único centralizado e em 3xl. */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Explorar dados</h1>
        <p className="text-sm text-muted-foreground">
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
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-6 py-5">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base font-semibold">
                Resultado
              </CardTitle>
              <CardDescription className="text-sm">
                {describeAnalysis(
                  filters.measures,
                  filters.dimensions ?? [],
                  { comparing: showComparison }
                )}
              </CardDescription>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {data.pivot.rows.length}{" "}
                {data.pivot.rows.length === 1 ? "resultado" : "resultados"}
              </Badge>
              {showComparison && (
                <Badge variant="outline">Comparando períodos</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6 pt-0">
            {data.pivot.rows.length === 0 && (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <p className="text-sm font-medium">
                  Nenhuma venda encontrada nesse recorte.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente ampliar o período ou remover algum filtro.
                </p>
              </div>
            )}

            <div className="w-full overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    {filters.dimensions?.map((dim) => (
                      <TableHead
                        key={dim}
                        rowSpan={showComparison ? 2 : 1}
                        className="border-r px-4 py-3 text-left align-middle font-medium text-foreground"
                      >
                        {dimensionLabel(dim)}
                      </TableHead>
                    ))}
                    {activeMeasures.map((m) => (
                      <TableHead
                        key={measureKey(m)}
                        colSpan={showComparison ? 3 : 1}
                        className="border-r px-4 py-3 text-center align-middle font-semibold text-foreground"
                      >
                        {measureLabel(m)}
                      </TableHead>
                    ))}
                  </TableRow>

                  {showComparison && (
                    <TableRow className="hover:bg-transparent">
                      {activeMeasures.flatMap((m) =>
                        ["Atual", "Anterior", "Δ"].map((label) => (
                          <TableHead
                            key={`${measureKey(m)}-${label}`}
                            className="border-r px-4 py-2 text-center align-middle font-normal"
                          >
                            {label}
                          </TableHead>
                        ))
                      )}
                    </TableRow>
                  )}
                </TableHeader>

                <TableBody>
                  {paginatedMerged.map((row, i) => (
                    <TableRow key={i}>
                      {filters.dimensions?.map((dim) => (
                        <TableCell
                          key={dim}
                          className="whitespace-nowrap border-r px-4 py-3 font-medium"
                        >
                          {formatDimensionValue(dim, row[dim])}
                        </TableCell>
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
                            <TableCell className="border-r px-4 py-3 text-right font-medium tabular-nums">
                              {formatMeasure(curr, m.field)}
                            </TableCell>

                            {showComparison && (
                              <>
                                <TableCell className="border-r px-4 py-3 text-right text-muted-foreground tabular-nums">
                                  {formatMeasure(prev, m.field)}
                                </TableCell>
                                <TableCell
                                  className={cn(
                                    "whitespace-nowrap border-r px-4 py-3 text-right font-semibold tabular-nums",
                                    up && "text-emerald-600 dark:text-emerald-400",
                                    down && "text-red-600 dark:text-red-400"
                                  )}
                                >
                                  {typeof pct === "number"
                                    ? `${up ? "+" : ""}${(pct * 100).toFixed(1)}%`
                                    : "—"}
                                </TableCell>
                              </>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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

            {/* A consulta continua acessível, mas como detalhe técnico no rodapé
                em vez de primeira coisa acima da tabela. Quem analisa dado
                precisa poder auditar o número; quem não lê SQL não tropeça. */}
            {data.pivot.rows.length > 0 && (
              <details className="group border-t pt-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                  Ver a consulta que gerou esses números
                </summary>
                <pre className="mt-3 w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs">
                  {data.pivot.sql}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
