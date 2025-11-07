"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import z from "zod";
import { toast } from "sonner";
import {
  GET_AUTO_INSIGHTS,
  GET_DELIVERY_REGION_TREND,
  GET_LOST_BUT_LOYAL,
  GET_TOP_PRODUCTS,
  SAVE_DASHBOARD,
} from "@/queries/insights.queries";
import {
  AutoInsight,
  DeliveryRegionTrend,
  LostCustomer,
  ProductAgg,
  SaveDashboardMutation,
  SaveDashboardMutationVariables,
} from "@/gql/graphql";
import { CommonFilterSchema } from "../validation/insights.zod";

type Filters = z.infer<typeof CommonFilterSchema>;

export function useInsights(filters: Filters) {
  const commonInput = (() => {
    if (filters?.period?.dateFrom && filters?.period?.dateTo) {
      return {
        period: filters.period,
        channel: filters.channel,
        dow: filters.dow,
        hourFrom: filters.hourFrom,
        hourTo: filters.hourTo,
      };
    }
    return undefined;
  })();

  const auto = useQuery<{ autoInsights: AutoInsight[] }>(GET_AUTO_INSIGHTS, {
    fetchPolicy: "network-only",
  });

  const products = useQuery<{ topProducts: ProductAgg[] }>(GET_TOP_PRODUCTS, {
    variables: commonInput ? { input: commonInput } : undefined,
    skip: !commonInput,
    fetchPolicy: "network-only",
  });

  const region = useQuery<{ deliveryRegionTrend: DeliveryRegionTrend[] }>(
    GET_DELIVERY_REGION_TREND,
    {
      variables: commonInput ? { input: commonInput } : undefined,
      skip: !commonInput,
      fetchPolicy: "network-only",
    }
  );

  const loyal = useQuery<{ lostButLoyal: LostCustomer[] }>(GET_LOST_BUT_LOYAL, {
    fetchPolicy: "network-only",
  });

  const [mutate, { loading }] = useMutation<
    SaveDashboardMutation,
    SaveDashboardMutationVariables
  >(SAVE_DASHBOARD);

  const refetchAll = async () => {
    await Promise.all([
      auto.refetch(),
      products.refetch(),
      region.refetch(),
      loyal.refetch(),
    ]);
  };

  const isLoading =
    auto.loading || products.loading || region.loading || loyal.loading;

  const insights = auto.data?.autoInsights ?? [];
  const topProducts = products.data?.topProducts ?? [];
  const deliveryTrend = region.data?.deliveryRegionTrend ?? [];
  const lostCustomers = loyal.data?.lostButLoyal ?? [];

  const totalLost = lostCustomers.length;
  const totalLoyal = Math.floor(totalLost * 0.3);
  const totalRecovered = Math.floor(totalLost * 0.1);

  const saveDashboard = async (dashboardName: string) => {
    if (!dashboardName.trim()) {
      toast.error("Digite um nome para o dashboard.");
      return;
    }

    const config = {
      filters,
      insights,
      topProducts,
      deliveryTrend,
      lostCustomers,
      kpis: { totalLost, totalLoyal, totalRecovered },
    };

    try {
      const { data } = await mutate({
        variables: { input: { name: dashboardName, config } },
      });

      if (data?.saveDashboard) {
        toast.success("Dashboard salvo com sucesso!");
        return true;
      } else {
        toast.error("Erro ao salvar dashboard.");
        return false;
      }
    } catch (err) {
      console.error("Erro ao salvar dashboard:", err);
      toast.error("Erro ao salvar dashboard.");
      return false;
    }
  };

  return {
    isLoading,
    loading,
    refetchAll,
    insights,
    topProducts,
    deliveryTrend,
    lostCustomers,
    totalLost,
    totalLoyal,
    totalRecovered,
    saveDashboard,
  };
}
