import { getLostButLoyal } from "../src/controllers";

describe("getLostButLoyal()", () => {
  it("deve retornar clientes fiéis inativos", async () => {
    const data = await getLostButLoyal();
    expect(data).toBeInstanceOf(Array);

    if (data.length > 0) {
      const c = data[0];
      expect(c.n_orders).toBeGreaterThanOrEqual(3);
      expect(c).toHaveProperty("last_date");
    }
  });
});
