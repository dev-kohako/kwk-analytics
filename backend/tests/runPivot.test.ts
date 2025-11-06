import { runPivot } from "../src/controllers";

describe("runPivot()", () => {
  it("deve gerar SQL dinâmico e resultados agregados", async () => {
    const result = await runPivot({
      dimensions: ["channel"],
      measures: [
        { field: "revenue", fn: "sum" },
        { field: "quantity", fn: "count" },
      ],
      dateRange: { from: "2025-09-01", to: "2025-10-31" },
      limit: 5,
    });

    expect(result).toHaveProperty("sql");
    expect(typeof result.sql).toBe("string");

    expect(result).toHaveProperty("rows");
    expect(Array.isArray(result.rows)).toBe(true);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      expect(row).toEqual(
        expect.objectContaining({
          channel: expect.anything(),
          sum_revenue: expect.any(Number),
          count_quantity: expect.any(Number),
        })
      );
    }
  });
});
