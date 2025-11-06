import { saveDashboard, getDashboardById } from "../src/controllers";
import { AppError } from "../src/utils/errors";

describe("getDashboardById()", () => {
  it("deve retornar um dashboard existente pelo ID", async () => {
    const newDash = await saveDashboard("Dashboard Pivot Test", {
      type: "bar",
      xKey: "product_id",
      lines: [{ key: "revenue", name: "Faturamento", color: "#00BFFF" }],
      data: [],
    });

    expect(newDash).toHaveProperty("id");

    const found = await getDashboardById(newDash.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(newDash.id);
    expect(found?.name).toBe("Dashboard Pivot Test");
  });

  it("deve lançar erro se o dashboard não existir", async () => {
    const fakeId = 999999;
    await expect(getDashboardById(fakeId)).rejects.toThrow(AppError);
  });
});
