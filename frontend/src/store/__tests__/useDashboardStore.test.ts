import { act } from "@testing-library/react";
import { defaultPeriod, useDashboardStore } from "../useDashboardStore";

describe("useDashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.setState({ filters: {} });
  });

  it("sets filters correctly", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "iFood" });
    });
    expect(useDashboardStore.getState().filters.channel).toBe("iFood");
  });

  it("merges filters instead of replacing them", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "iFood" });
      useDashboardStore.getState().setFilters({ dow: 5 });
    });
    expect(useDashboardStore.getState().filters).toEqual({
      channel: "iFood",
      dow: 5,
    });
  });

  it("clears filters back to the default period", () => {
    act(() => {
      useDashboardStore.getState().setFilters({ channel: "Rappi" });
      useDashboardStore.getState().clearFilters();
    });

    const filters = useDashboardStore.getState().filters;

    // Limpar volta ao recorte padrão em vez de zerar: sem período as consultas
    // ficam `skip` e a tela diz "sem vendas", que parece defeito.
    expect(filters.channel).toBeUndefined();
    expect(filters.period).toEqual(defaultPeriod());
  });

  it("starts with the last 30 days already selected", () => {
    useDashboardStore.setState({ filters: { period: defaultPeriod() } });
    const { period } = useDashboardStore.getState().filters;

    expect(period?.dateFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(period?.prevDateTo).toBeDefined();

    const inicio = new Date(period!.dateFrom);
    const fim = new Date(period!.dateTo);
    const dias = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000);
    expect(dias).toBe(30);
  });
});
