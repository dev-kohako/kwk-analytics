import { render, screen, fireEvent } from "@testing-library/react";
import DashboardsList from "../page";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
  },
}));

jest.mock("@/hooks/useDashboards", () => ({
  useDashboards: jest.fn(),
}));

jest.mock("framer-motion", () => ({
  motion: {
    li: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  },
}));

const mockUseDashboards = require("@/hooks/useDashboards").useDashboards;

describe("DashboardsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders skeletons while loading", () => {
    mockUseDashboards.mockReturnValue({
      dashboards: [],
      visibleDashboards: [],
      loading: true,
      error: null,
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      handleRefetch: jest.fn(),
    });

    render(<DashboardsList />);
    expect(screen.getByLabelText(/carregando dashboards/i)).toBeInTheDocument();
  });

  it("renders error message when error occurs", () => {
    mockUseDashboards.mockReturnValue({
      dashboards: [],
      visibleDashboards: [],
      loading: false,
      error: { message: "Erro ao buscar dados" },
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      handleRefetch: jest.fn(),
    });

    render(<DashboardsList />);
    expect(
      screen.getByText(/erro ao carregar dashboards/i)
    ).toBeInTheDocument();
  });

  it("renders empty state when no dashboards exist", () => {
    mockUseDashboards.mockReturnValue({
      dashboards: [],
      visibleDashboards: [],
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      handleRefetch: jest.fn(),
    });

    render(<DashboardsList />);
    expect(
      screen.getByText(/nenhum dashboard salvo ainda/i)
    ).toBeInTheDocument();
  });

  it("renders dashboard cards when data is available", () => {
    mockUseDashboards.mockReturnValue({
      dashboards: [
        { id: 1, name: "Vendas", created_at: "2025-11-05T00:00:00Z" },
      ],
      visibleDashboards: [
        { id: 1, name: "Vendas", created_at: "2025-11-05T00:00:00Z" },
      ],
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      handleRefetch: jest.fn(),
    });

    render(<DashboardsList />);
    expect(screen.getByText(/vendas/i)).toBeInTheDocument();
  });

  it("triggers router push when creating new dashboard", () => {
    const push = jest.fn();
    const handleRefetch = jest.fn();
    mockUseDashboards.mockReturnValue({
      dashboards: [],
      visibleDashboards: [],
      loading: false,
      error: null,
      page: 1,
      totalPages: 1,
      setPage: jest.fn(),
      handleRefetch,
    });

    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push });

    render(<DashboardsList />);

    const btn = screen.getByRole("button", { name: /novo dashboard/i });
    fireEvent.click(btn);
    expect(push).toHaveBeenCalledWith("/insights");
  });
});
