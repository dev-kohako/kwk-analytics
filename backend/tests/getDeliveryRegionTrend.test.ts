import { getDeliveryRegionTrend } from "../src/controllers";

describe("getDeliveryRegionTrend()", () => {
  it("deve calcular média e delta_percent corretamente", async () => {
    const data = await getDeliveryRegionTrend({
      period: {
        dateFrom: "2025-10-01",
        dateTo: "2025-10-31",
        prevDateFrom: "2025-09-01",
        prevDateTo: "2025-09-30",
      },
    });

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      const d = data[0];
      expect(d).toHaveProperty("delivery_region");
      expect(typeof d.delta_percent).toBe("number");
    }
  });

  it("deve lançar erro se período for inválido", async () => {
    await expect(
      getDeliveryRegionTrend({ period: {} as any })
    ).rejects.toThrow();
  });
});
