import { saveDashboard, getDashboards } from "../src/controllers";

describe("Dashboard management", () => {
  it("deve criar e listar dashboards corretamente", async () => {
    const dash = await saveDashboard("Dashboard Teste", {
      chartTitle: "Teste",
      type: "bar",
      xKey: "product_id",
      lines: [{ key: "faturamento", name: "Faturamento" }],
      data: [{ product_id: "Pizza", faturamento: 1000 }],
      showLegend: true,
    });

    expect(dash).toHaveProperty("id");

    const dashboards = await getDashboards();
    const found = dashboards.find((d) => d.id === dash.id);
    expect(found).toBeTruthy();
  });
});
