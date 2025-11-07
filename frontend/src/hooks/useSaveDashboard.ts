"use client";

import { useMutation } from "@apollo/client/react";
import {
  SaveDashboardMutation,
  SaveDashboardMutationVariables,
} from "@/gql/graphql";
import { SAVE_DASHBOARD } from "@/queries/insights.queries";

export function useSaveDashboard() {
  const [mutate, { loading, error }] = useMutation<
    SaveDashboardMutation,
    SaveDashboardMutationVariables
  >(SAVE_DASHBOARD);

  const saveDashboard = async (name: string, config: any) => {
    try {
      const { data } = await mutate({
        variables: { input: { name, config } },
      });

      return data?.saveDashboard ?? null;
    } catch (err) {
      console.error("Erro ao salvar dashboard:", err);
      return null;
    }
  };

  return { saveDashboard, loading, error };
}
