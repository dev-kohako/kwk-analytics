import { create } from "zustand";

export type Period = { dateFrom: string; dateTo: string };
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

export const useDashboardStore = create<State>((set) => ({
  filters: {},
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: {} }),
}));
