import { create } from "zustand";

export type Period = {
  dateFrom: string;
  dateTo: string;
  prevDateFrom?: string;
  prevDateTo?: string;
};

type Filters = {
  channel?: string;
  dow?: number;
  hourFrom?: number;
  hourTo?: number;
  period?: Period;
};

type State = {
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  clearFilters: () => void;
};

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * Últimos 30 dias, com os 30 anteriores como base de comparação.
 *
 * Sem período definido as consultas de produtos e de entrega ficam `skip`, e a
 * tela abre dizendo "sem vendas registradas" — o que parece defeito, mas é só
 * falta de filtro. Abrir com um recorte padrão resolve: quem entra vê dado.
 */
export function defaultPeriod(): Period {
  const hoje = new Date();

  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - 30);

  const anteriorFim = new Date(inicio);
  anteriorFim.setDate(anteriorFim.getDate() - 1);

  const anteriorInicio = new Date(anteriorFim);
  anteriorInicio.setDate(anteriorInicio.getDate() - 30);

  return {
    dateFrom: iso(inicio),
    dateTo: iso(hoje),
    prevDateFrom: iso(anteriorInicio),
    prevDateTo: iso(anteriorFim),
  };
}

export const useDashboardStore = create<State>((set) => ({
  filters: { period: defaultPeriod() },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: { period: defaultPeriod() } }),
}));
