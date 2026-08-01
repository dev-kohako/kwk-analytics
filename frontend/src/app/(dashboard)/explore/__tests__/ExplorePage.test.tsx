import { render, screen, fireEvent } from "@testing-library/react";
import ExplorePage from "../page";

jest.mock("@/hooks/useExplore", () => ({
  useExplore: jest.fn(),
}));
const mockUseExplore = require("@/hooks/useExplore").useExplore;

jest.mock("@/components/dashboard/FilterBuilder", () => ({
  FilterBuilder: () => <div data-testid="filter-builder">FilterBuilder</div>,
}));

jest.mock("@/components/ui/date-range-picker", () => ({
  DateRangePicker: ({ onChange }: any) => (
    <button
      data-testid="date-picker"
      onClick={() =>
        onChange({
          from: new Date("2025-11-01"),
          to: new Date("2025-11-05"),
        })
      }
    >
      Mock DateRangePicker
    </button>
  ),
}));

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  exportToCSV: jest.fn(),
}));

describe("ExplorePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and base elements", () => {
    mockUseExplore.mockReturnValue({
      filters: {
        dimensions: [],
        measures: [],
        filters: [],
        dateRange: undefined,
      },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: false,
      data: null,
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);

    expect(
      screen.getByRole("heading", { name: /pivot builder/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/montar análise/i)).toBeInTheDocument();
    expect(screen.getByText(/o que você quer ver/i)).toBeInTheDocument();
    expect(screen.getByTestId("filter-builder")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading", () => {
    mockUseExplore.mockReturnValue({
      filters: { dimensions: [], measures: [], filters: [] },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: true,
      data: null,
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    expect(screen.getAllByRole("generic").length).toBeGreaterThan(0);
  });

  it("renders results table when data.pivot exists", () => {
    mockUseExplore.mockReturnValue({
      filters: {
        dimensions: ["region"],
        measures: [{ fn: "sum", field: "sales" }],
        filters: [],
      },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: false,
      data: {
        pivot: {
          rows: [
            { region: "Sul", sum_sales: 100 },
            { region: "Norte", sum_sales: 50 },
          ],
          sql: "SELECT region, SUM(sales) FROM orders GROUP BY region;",
        },
      },
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    // CardTitle do shadcn renderiza como div, então não há papel de heading.
    expect(screen.getByText("Resultado", { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Sul/)).toBeInTheDocument();
    expect(screen.getByText(/Norte/)).toBeInTheDocument();
  });

  it("triggers setCompare when toggling switch", () => {
    const setCompare = jest.fn();
    mockUseExplore.mockReturnValue({
      filters: { dimensions: [], measures: [], filters: [] },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: false,
      data: null,
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare,
      previous: null,
    });

    render(<ExplorePage />);
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);
    expect(setCompare).toHaveBeenCalled();
  });

  it("calls handleRun when executing analysis", () => {
    const handleRun = jest.fn();
    mockUseExplore.mockReturnValue({
      // O botão só habilita com métrica escolhida: rodar sem nenhuma não
      // produziria análise alguma.
      filters: {
        dimensions: [],
        measures: [{ fn: "sum", field: "revenue" }],
        filters: [],
      },
      setFilters: jest.fn(),
      handleRun,
      loading: false,
      data: null,
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    const runBtn = screen.getByRole("button", { name: /executar análise/i });
    fireEvent.click(runBtn);
    expect(handleRun).toHaveBeenCalled();
  });

  it("calls saveAsDashboard when saving", () => {
    const saveAsDashboard = jest.fn();
    mockUseExplore.mockReturnValue({
      filters: { dimensions: [], measures: [], filters: [] },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: false,
      // Só faz sentido salvar dashboard depois de existir resultado na tela.
      data: { pivot: { rows: [{ a: 1 }], sql: "SELECT 1" } },
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard,
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    fireEvent.click(
      screen.getByRole("button", { name: /salvar como dashboard/i })
    );
    expect(saveAsDashboard).toHaveBeenCalled();
  });

  it("calls exportToCSV when clicking export", () => {
    const { exportToCSV } = require("@/lib/utils");
    mockUseExplore.mockReturnValue({
      filters: { dimensions: [], measures: [], filters: [] },
      setFilters: jest.fn(),
      handleRun: jest.fn(),
      loading: false,
      data: { pivot: { rows: [{ a: 1 }], sql: "SELECT 1" } },
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    fireEvent.click(screen.getByRole("button", { name: /baixar planilha/i }));
    expect(exportToCSV).toHaveBeenCalled();
  });

  it("updates date range when clicking date picker mock", () => {
    const setFilters = jest.fn();
    mockUseExplore.mockReturnValue({
      filters: {
        dimensions: [],
        measures: [],
        filters: [],
        dateRange: undefined,
      },
      setFilters,
      handleRun: jest.fn(),
      loading: false,
      data: null,
      page: 1,
      setPage: jest.fn(),
      totalPages: 1,
      saveAsDashboard: jest.fn(),
      compare: false,
      setCompare: jest.fn(),
      previous: null,
    });

    render(<ExplorePage />);
    fireEvent.click(screen.getByTestId("date-picker"));
    expect(setFilters).toHaveBeenCalled();
  });
});
