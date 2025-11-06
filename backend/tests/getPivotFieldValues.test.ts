import { getPivotFieldValues } from "../src/controllers";
import { AppError } from "../src/utils/errors";

describe("getPivotFieldValues()", () => {
  it("deve retornar valores únicos de um campo válido", async () => {
    const values = await getPivotFieldValues({
      field: "channel",
      limit: 5,
    });

    expect(Array.isArray(values)).toBe(true);
    if (values.length > 0) {
      expect(typeof values[0]).toBe("string");
    }
  });

  it("deve aplicar busca (search) corretamente", async () => {
    const values = await getPivotFieldValues({
      field: "channel",
      search: "iFood",
      limit: 5,
    });

    expect(Array.isArray(values)).toBe(true);
    if (values.length > 0) {
      expect(values.some((v) => v.toLowerCase().includes("ifood"))).toBe(true);
    }
  });

  it("deve lançar erro ao usar campo inválido", async () => {
    await expect(
      getPivotFieldValues({ field: "hack_field" } as any)
    ).rejects.toThrow(AppError);
  });
});
