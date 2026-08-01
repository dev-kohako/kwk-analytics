import { render, screen, fireEvent, act } from "@testing-library/react";
import InsightsPage from "../page";
import React from "react";

jest.mock("@/store/useDashboardStore", () => ({
  useDashboardStore: () => ({ filters: {} }),
}));

jest.mock("framer-motion", () => ({
  motion: {
    section: ({ children }: { children: React.ReactNode }) => (
      <section>{children}</section>
    ),
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

jest.mock("@/hooks/useInsights", () => ({
  useInsights: jest.fn(),
}));
const mockUseInsights = require("@/hooks/useInsights").useInsights;

jest.mock("@/components/dashboard/DashboardCard", () => ({
  DashboardCard: ({ title, subtitle, children }: any) => (
    <div data-testid="dashboard-card">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div>{children}</div>
    </div>
  ),
}));

jest.mock("@/components/dashboard/KpiCard", () => ({
  KpiCard: ({ title, value }: any) => (
    <div data-testid="kpi-card">
      {title}: {value}
    </div>
  ),
}));

jest.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-testid="skeleton" />,
}));

jest.mock("@/components/dashboard/DashboardFilters", () => ({
  DashboardFilters: ({ onApply }: any) => (
    <button data-testid="dashboard-filters" onClick={onApply}>
      Apply Filters
    </button>
  ),
}));

jest.mock("@/components/charts/BarChart", () => ({
  BarChart: ({ data }: any) => (
    <div data-testid="bar-chart">{`BarChart (${data.length})`}</div>
  ),
}));

jest.mock("@/components/charts/LineChart", () => ({
  LineChart: ({ data }: any) => (
    <div data-testid="line-chart">{`LineChart (${data.length})`}</div>
  ),
}));

const emptyKpis = {
  revenue: { value: null, previous: null, deltaPercent: null },
  averageTicket: { value: null, previous: null, deltaPercent: null },
  lostCustomers: 0,
  regions: 0,
};

const baseMock = (overrides: Record<string, unknown> = {}) => ({
  isLoading: false,
  loading: false,
  refetchAll: jest.fn(),
  insights: [],
  topProducts: [],
  deliveryTrend: [],
  lostCustomers: [],
  kpis: emptyKpis,
  aiInsightsCount: 0,
  saveDashboard: jest.fn(),
  ...overrides,
});

describe("InsightsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and base elements", () => {
    mockUseInsights.mockReturnValue(baseMock());

    render(<InsightsPage />);

    expect(
      screen.getByRole("heading", { name: /insights analíticos/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-filters")).toBeInTheDocument();
  });

  it("renders loading skeletons when isLoading is true", () => {
    mockUseInsights.mockReturnValue(baseMock({ isLoading: true }));

    render(<InsightsPage />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders KPI cards from real metrics", () => {
    mockUseInsights.mockReturnValue(
      baseMock({
        deliveryTrend: [{ delivery_region: "Sul", avg_cur: 5, avg_prev: 4 }],
        lostCustomers: [{ id: 1 }, { id: 2 }, { id: 3 }],
        kpis: {
          revenue: { value: 120000, previous: 100000, deltaPercent: 20 },
          averageTicket: { value: 60, previous: 55, deltaPercent: 9 },
          lostCustomers: 3,
          regions: 1,
        },
      })
    );

    render(<InsightsPage />);

    expect(screen.getAllByTestId("kpi-card").length).toBeGreaterThan(0);
    expect(screen.getByText(/Receita \(30 dias\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ticket Médio/i)).toBeInTheDocument();
  });

  it("renders top products chart when data exists", () => {
    mockUseInsights.mockReturnValue(
      baseMock({ topProducts: [{ product_id: 1, faturamento: 200 }] })
    );

    render(<InsightsPage />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders fallback when no topProducts exist", () => {
    mockUseInsights.mockReturnValue(baseMock());

    render(<InsightsPage />);
    expect(screen.getByText(/sem vendas registradas/i)).toBeInTheDocument();
  });

  it("renders delivery trend chart when data exists", () => {
    mockUseInsights.mockReturnValue(
      baseMock({
        deliveryTrend: [{ delivery_region: "Norte", avg_cur: 3, avg_prev: 4 }],
      })
    );

    render(<InsightsPage />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders fallback when no delivery trend data", () => {
    mockUseInsights.mockReturnValue(baseMock());

    render(<InsightsPage />);
    expect(screen.getByText(/sem registros de entregas/i)).toBeInTheDocument();
  });

  it("renders insight cards with title, message and suggestion", () => {
    mockUseInsights.mockReturnValue(
      baseMock({
        insights: [
          {
            id: "revenue-window",
            title: "Receita dos últimos 30 dias",
            message: "A receita subiu 20% no período.",
            severity: "positive",
            generatedBy: "rule",
            deltaPercent: 20,
          },
          {
            id: "ai-1",
            title: "Ticket médio em queda",
            message: "O volume cresce mas o valor por pedido cai.",
            severity: "warning",
            generatedBy: "ai",
            suggestion: "Revise os combos do canal principal.",
          },
        ],
        aiInsightsCount: 1,
      })
    );

    render(<InsightsPage />);

    expect(screen.getByText(/Receita dos últimos 30 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/A receita subiu 20%/i)).toBeInTheDocument();
    expect(screen.getByText(/Revise os combos/i)).toBeInTheDocument();
  });

  it("marks which insights came from the AI", () => {
    mockUseInsights.mockReturnValue(
      baseMock({
        insights: [
          {
            id: "ai-1",
            title: "Leitura da IA",
            message: "Mensagem gerada por modelo.",
            severity: "info",
            generatedBy: "ai",
          },
        ],
        aiInsightsCount: 1,
      })
    );

    render(<InsightsPage />);
    expect(screen.getByText("IA")).toBeInTheDocument();
  });

  it("renders insight message as text, never as HTML", () => {
    mockUseInsights.mockReturnValue(
      baseMock({
        insights: [
          {
            id: "rule-1",
            title: "Teste",
            message: "<img src=x onerror=alert(1)> texto",
            severity: "info",
            generatedBy: "rule",
          },
        ],
      })
    );

    const { container } = render(<InsightsPage />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)> texto/)).toBeInTheDocument();
  });

  it("calls saveDashboard when clicking save", async () => {
    const saveDashboard = jest.fn().mockResolvedValue(true);
    mockUseInsights.mockReturnValue(baseMock({ saveDashboard }));

    render(<InsightsPage />);

    const input = screen.getByLabelText(/nome do dashboard/i);
    fireEvent.change(input, { target: { value: "Meu Dashboard" } });

    const button = screen.getByRole("button", {
      name: /salvar dashboard atual/i,
    });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(saveDashboard).toHaveBeenCalledWith("Meu Dashboard");
  });
});
