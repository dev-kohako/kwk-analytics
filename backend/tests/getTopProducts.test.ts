import { getTopProducts } from "../src/controllers";

describe("getTopProducts()", () => {
  it("deve retornar produtos mais vendidos com métricas válidas", async () => {
    const result = await getTopProducts({
      channel: "iFood",
      dow: 3,
      hourFrom: 10,
      hourTo: 22,
      period: {
        dateFrom: "2025-10-01",
        dateTo: "2025-10-31",
        prevDateFrom: "2025-09-01",
        prevDateTo: "2025-09-30",
      },
    });

    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const p = result[0];
      expect(p).toHaveProperty("product_id");
      expect(p).toHaveProperty("faturamento");
      expect(typeof p.delta_percent).toBe("number");
    }
  });
});
