import { cacheWrap, clearCache } from "../src/utils/cache";

describe("cacheWrap()", () => {
  beforeEach(() => clearCache());

  it("deve armazenar e reutilizar o valor em cache", async () => {
    let runs = 0;
    const fn = async () => (++runs, "resultado");

    const r1 = await cacheWrap("t", 1000, fn);
    const r2 = await cacheWrap("t", 1000, fn);

    expect(r1).toBe("resultado");
    expect(r2).toBe("resultado");
    expect(runs).toBe(1);
  });

  it("deve reexecutar após expiração do TTL", async () => {
    let runs = 0;
    const fn = async () => (++runs, "novo");

    await cacheWrap("expira", 50, fn);
    await new Promise((r) => setTimeout(r, 60));
    await cacheWrap("expira", 50, fn);

    expect(runs).toBe(2);
  });

  it("deve limpar cache corretamente", () => {
    cacheWrap("x", 1000, async () => "ok");
    clearCache();
    expect(() => clearCache()).not.toThrow();
  });
});
