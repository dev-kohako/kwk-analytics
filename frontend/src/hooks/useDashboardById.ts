"use client";

import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_BY_ID } from "../queries/dashboard.queries";
import { Dashboard } from "@/gql/graphql";
import { toast } from "sonner";

export function useDashboardById(id: number) {
  const { data, loading, error, refetch } = useQuery<{ dashboard: Dashboard }>(
    GET_DASHBOARD_BY_ID,
    {
      variables: { id },
      skip: isNaN(id),
      fetchPolicy: "network-only",
    }
  );

    const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado! Compartilhe com sua equipe.");
  };

  return {
    dashboard: data?.dashboard,
    loading,
    error,
    refetch,
    copyLink,
  };
}
