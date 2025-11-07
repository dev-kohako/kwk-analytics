"use client";

import { useState, useMemo } from "react";
import { useLazyQuery, useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { GET_PIVOT } from "@/queries/explore.queries";
import {
  PivotQuery,
  PivotQueryVariables,
  PivotInput,
  PivotFn,
  SaveDashboardMutation,
  SaveDashboardMutationVariables,
  InputMaybe,
} from "@/gql/graphql";
import { ExploreSchemaType } from "@/validation/explore.zod";
import { SAVE_DASHBOARD } from "@/queries/insights.queries";
import { getPrevRange } from "@/lib/utils";

export function useExplore(initialFilters?: ExploreSchemaType) {
  const [compare, setCompare] = useState(false);
  const [previous, setPrevious] = useState<any[] | null>(null);

  const [filters, setFilters] = useState<ExploreSchemaType>(
    initialFilters ?? {
      dimensions: ["channel"],
      measures: [{ fn: "sum", field: "revenue" }],
      limit: 200,
      dateRange: { from: "", to: "" },
      filters: [],
    }
  );

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [runPivot, { data, loading, error }] = useLazyQuery<
    PivotQuery,
    PivotQueryVariables
  >(GET_PIVOT, { fetchPolicy: "network-only" });

  const [runPivotPrev] = useLazyQuery<PivotQuery, PivotQueryVariables>(
    GET_PIVOT,
    { fetchPolicy: "network-only" }
  );

  if (error) toast.error("Erro ao carregar dados de exploração");

  const handleRun = async (compare: boolean) => {
    try {
      const { dateRange } = filters;
      setPrevious(null);

      const input: PivotInput = {
        dimensions: filters.dimensions,
        measures: filters.measures.map((m) => ({
          field: m.field,
          fn: m.fn as PivotFn,
          alias: (m.alias ?? undefined) as InputMaybe<string>,
        })),
        limit: filters.limit ?? 200,
        filters: filters.filters,
        dateRange: dateRange
          ? {
              from: dateRange.from ?? null,
              to: dateRange.to ?? null,
            }
          : null,
      };

      const { data: currData } = await runPivot({ variables: { input } });

      if (compare && dateRange?.from && dateRange?.to) {
        const { prevFrom, prevTo } = getPrevRange(dateRange.from, dateRange.to);
        const prevInput = {
          ...input,
          dateRange: { from: prevFrom, to: prevTo },
        };

        console.log("🔍 Prev range", { prevFrom, prevTo });

        const { data: prevData } = await runPivotPrev({
          variables: { input: prevInput },
        });

        console.log("📦 Prev data", prevData?.pivot?.rows);
        setPrevious(prevData?.pivot?.rows || []);
      } else {
        setPrevious(null);
      }

      return currData?.pivot?.rows ?? [];
    } catch (err) {
      console.error(err);
      toast.error("Erro ao executar análise");
    }
  };

  const paginatedRows = useMemo(() => {
    if (!data?.pivot?.rows) return [];
    const start = (page - 1) * itemsPerPage;
    return data.pivot.rows.slice(start, start + itemsPerPage);
  }, [data, page]);

  const totalPages = data
    ? Math.ceil(data.pivot.rows.length / itemsPerPage)
    : 1;

  const [saveDashboard, { loading: saving }] = useMutation<
    SaveDashboardMutation,
    SaveDashboardMutationVariables
  >(SAVE_DASHBOARD);

  const saveAsDashboard = async (name: string) => {
    try {
      const config = {
        type: "pivot",
        filters,
        dateRange: filters.dateRange,
        dimensions: filters.dimensions,
        measures: filters.measures,
      };

      const { data } = await saveDashboard({
        variables: { input: { name, config } },
      });

      if (data?.saveDashboard) {
        toast.success("Dashboard salvo com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar dashboard");
    }
  };

  return {
    filters,
    setFilters,
    handleRun,
    loading,
    data,
    page,
    setPage,
    totalPages,
    paginatedRows,
    saveAsDashboard,
    compare,
    setCompare,
    previous,
  };
}
