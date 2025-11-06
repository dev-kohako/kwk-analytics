"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Dashboard } from "@/__generated__/graphql";
import { GET_DASHBOARDS } from "@/queries/dashboard.queries";

export function useDashboards() {
  const { data, loading, error, refetch } = useQuery<{
    dashboards: Dashboard[];
  }>(GET_DASHBOARDS, { fetchPolicy: "network-only" });

  const dashboards = data?.dashboards ?? [];

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(9);

  useEffect(() => {
    const updatePerPage = () => {
      if (window.innerWidth < 640) setPerPage(4);
      else if (window.innerWidth < 1024) setPerPage(6);
      else setPerPage(9);
    };

    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const totalPages = Math.ceil(dashboards.length / perPage);

  const visibleDashboards = useMemo(() => {
    const start = (page - 1) * perPage;
    return dashboards.slice(start, start + perPage);
  }, [page, perPage, dashboards]);

  const handleRefetch = async () => {
    toast.promise(refetch(), {
      loading: "Atualizando lista...",
      success: "Lista de dashboards atualizada!",
      error: "Erro ao atualizar os dashboards.",
    });
  };

  return {
    dashboards,
    visibleDashboards,
    loading,
    error,
    page,
    totalPages,
    setPage,
    handleRefetch,
  };
}
