import { render, screen, fireEvent } from "@testing-library/react";
import DashboardDetailsPage from "../[id]/page";

jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
}));

jest.mock("@/hooks/useDashboardById", () => ({
  useDashboardById: jest.fn(),
}));
const mockUseDashboardById =
  require("@/hooks/useDashboardById").useDashboardById;

jest.mock("@/components/charts/DashboardChart", () => ({
  DashboardChart: ({ dashboard }: any) => (
    <div data-testid="dashboard-chart">Chart for {dashboard.name}</div>
  ),
}));

describe("DashboardDetailsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skeleton when loading", () => {
    mockUseDashboardById.mockReturnValue({
      dashboard: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);
    const skeletons = screen.getAllByRole("generic", { hidden: true });
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders error state correctly", () => {
    mockUseDashboardById.mockReturnValue({
      dashboard: null,
      loading: false,
      error: { message: "Falha" },
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);
    expect(screen.getByText(/erro ao carregar dashboard/i)).toBeInTheDocument();
  });

  it("renders not found message when dashboard is null", () => {
    mockUseDashboardById.mockReturnValue({
      dashboard: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);
    expect(screen.getByText(/dashboard não encontrado/i)).toBeInTheDocument();
  });

  it("renders the chart when the saved config has chart data", () => {
    mockUseDashboardById.mockReturnValue({
      dashboard: {
        id: 1,
        name: "Relatório Semanal",
        config: {
          type: "bar",
          xKey: "channel",
          lines: [{ key: "revenue", name: "Faturamento" }],
          data: [{ channel: "iFood", revenue: 100 }],
        },
        created_at: "2025-11-05T00:00:00Z",
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);

    expect(
      screen.getByRole("heading", { name: /relatório semanal/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-chart")).toBeInTheDocument();
    expect(screen.getByText(/ver a configuração salva/i)).toBeInTheDocument();
    expect(screen.getByText(/criado em/i)).toBeInTheDocument();
  });

  it("explica quando o dashboard foi salvo sem dado para desenhar", () => {
    // 22 dos 78 dashboards em produção estão neste formato: guardam a
    // configuração mas nenhuma série. Antes abriam um gráfico vazio.
    mockUseDashboardById.mockReturnValue({
      dashboard: {
        id: 2,
        name: "Análise antiga",
        config: { type: "bar", x: "channel", y: "revenue" },
        created_at: "2025-11-05T00:00:00Z",
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);

    expect(
      screen.getByText(/salvo sem dados para exibir/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-chart")).not.toBeInTheDocument();
  });

  it("mostra as leituras quando o dashboard guardou insights", () => {
    mockUseDashboardById.mockReturnValue({
      dashboard: {
        id: 3,
        name: "Insights de outubro",
        config: {
          insights: [
            {
              id: "channel-falling",
              title: "Canal em retração",
              message: "iFood caiu 49,9%.",
              severity: "critical",
              generatedBy: "rule",
            },
          ],
        },
        created_at: "2025-11-05T00:00:00Z",
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);

    expect(screen.getByText(/leituras salvas/i)).toBeInTheDocument();
    // Aparece no card e também dentro do JSON recolhido no rodapé.
    expect(screen.getAllByText(/Canal em retração/).length).toBeGreaterThan(0);
  });

  it("handles refresh button click", () => {
    const refetch = jest.fn();
    mockUseDashboardById.mockReturnValue({
      dashboard: {
        id: 1,
        name: "Relatório Semanal",
        config: {},
        created_at: "2025-11-05T00:00:00Z",
      },
      loading: false,
      error: null,
      refetch,
      copyLink: jest.fn(),
    });

    render(<DashboardDetailsPage />);
    fireEvent.click(screen.getByRole("button", { name: /atualizar/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
