import { getAutoInsights } from "../src/controllers";
import { AppError } from "../src/utils/errors";

describe("getAutoInsights()", () => {
  it("deve retornar um array de insights automáticos", async () => {
    const data = await getAutoInsights();

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("message");
      expect(typeof data[0].message).toBe("string");
      expect(["sales", "channel", "product", "delivery"]).toContain(data[0].type);
    }
  });

  it("não deve lançar erro mesmo sem dados", async () => {
    await expect(getAutoInsights()).resolves.not.toThrow(AppError);
  });
});
