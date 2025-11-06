import { render, screen } from "@testing-library/react";
import { DashboardPage } from "../page";

jest.mock("framer-motion", () => ({
  motion: {
    section: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

describe("DashboardPage", () => {
  it("renders main title and key sections", async () => {
    render(<DashboardPage />);

    expect(await screen.findByRole("heading", { name: /kwk analytics/i })).toBeInTheDocument();

    expect(screen.getByText(/Meus Dashboards/i)).toBeInTheDocument();
    expect(screen.getByText(/Insights Automáticos/i)).toBeInTheDocument();

    expect(screen.getAllByText(/Relatórios/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/Criar Meu Primeiro Dashboard/i)).toBeInTheDocument();
  });
});
