import { render, screen } from "@testing-library/react";
import PainelPage from "../page";

jest.mock("@/store/useDashboardStore", () => ({
  useDashboardStore: () => ({ filters: {} }),
}));

jest.mock("@/hooks/useInsights", () => ({
  useInsights: jest.fn(),
}));
const mockUseInsights = require("@/hooks/useInsights").useInsights;

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    section: ({ children }: { children: React.ReactNode }) => (
      <section>{children}</section>
    ),
  },
}));

jest.mock("@/components/dashboard/KpiCard", () => ({
  KpiCard: ({ title, value }: any) => (
    <div data-testid="kpi-card">
      {title}: {value}
    </div>
  ),
}));

const semDados = {
  isLoading: false,
  insights: [],
  kpis: {
    revenue: { value: null, previous: null, deltaPercent: null },
    averageTicket: { value: null, previous: null, deltaPercent: null },
    lostCustomers: 0,
    regions: 0,
  },
};

describe("PainelPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("abre com os indicadores do período", () => {
    mockUseInsights.mockReturnValue({
      ...semDados,
      kpis: {
        ...semDados.kpis,
        revenue: { value: 140422.54, previous: 113662.95, deltaPercent: 23.54 },
        lostCustomers: 200,
      },
    });

    render(<PainelPage />);

    expect(
      screen.getByRole("heading", { name: /sua operação/i })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("kpi-card").length).toBe(4);
    expect(screen.getByText(/Receita/)).toBeInTheDocument();
  });

  it("destaca o insight que precisa de atenção", () => {
    mockUseInsights.mockReturnValue({
      ...semDados,
      insights: [
        {
          id: "channel-falling",
          title: "Canal em retração",
          message: "iFood caiu 49,9% contra o período anterior.",
          severity: "critical",
          generatedBy: "rule",
        },
        {
          id: "revenue-window",
          title: "Receita dos últimos 30 dias",
          message: "A receita subiu 23,5%.",
          severity: "positive",
          generatedBy: "rule",
        },
      ],
    });

    render(<PainelPage />);

    expect(screen.getByText(/precisa da sua atenção/i)).toBeInTheDocument();
    expect(screen.getByText(/Canal em retração/)).toBeInTheDocument();
  });

  it("diz que está tudo tranquilo quando não há alerta", () => {
    mockUseInsights.mockReturnValue({
      ...semDados,
      insights: [
        {
          id: "revenue-window",
          title: "Receita dos últimos 30 dias",
          message: "A receita subiu 23,5%.",
          severity: "positive",
          generatedBy: "rule",
        },
      ],
    });

    render(<PainelPage />);

    expect(screen.getByText(/nada urgente por aqui/i)).toBeInTheDocument();
    expect(
      screen.getByText(/nenhum ponto crítico no período/i)
    ).toBeInTheDocument();
  });

  it("mostra os atalhos para as três áreas", () => {
    mockUseInsights.mockReturnValue(semDados);

    render(<PainelPage />);

    expect(screen.getByText("Insights")).toBeInTheDocument();
    expect(screen.getByText("Explorar")).toBeInTheDocument();
    expect(screen.getByText("Dashboards")).toBeInTheDocument();
  });
});
