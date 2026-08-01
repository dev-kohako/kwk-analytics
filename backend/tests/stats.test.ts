import {
  concentration,
  detectAnomalies,
  extremes,
  linearTrend,
  pctDelta,
  summarize,
} from "../src/lib/analytics/stats";

describe("pctDelta()", () => {
  it("calcula variação percentual simples", () => {
    expect(pctDelta(150, 100)).toBe(50);
    expect(pctDelta(50, 100)).toBe(-50);
  });

  it("devolve 0 quando ambos são zero e null quando só a base é zero", () => {
    expect(pctDelta(0, 0)).toBe(0);
    expect(pctDelta(100, 0)).toBeNull();
  });

  it("ignora valores não numéricos", () => {
    expect(pctDelta(Number.NaN, 100)).toBeNull();
    expect(pctDelta(100, Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("summarize()", () => {
  it("resume uma série numérica", () => {
    const result = summarize([10, 20, 30, 40]);

    expect(result).not.toBeNull();
    expect(result?.count).toBe(4);
    expect(result?.sum).toBe(100);
    expect(result?.mean).toBe(25);
    expect(result?.median).toBe(25);
    expect(result?.min).toBe(10);
    expect(result?.max).toBe(40);
  });

  it("devolve null para série vazia", () => {
    expect(summarize([])).toBeNull();
  });
});

describe("linearTrend()", () => {
  it("identifica série crescente com ajuste perfeito", () => {
    const trend = linearTrend([10, 20, 30, 40, 50]);

    expect(trend?.direction).toBe("up");
    expect(trend?.slope).toBe(10);
    expect(trend?.r2).toBe(1);
  });

  it("identifica série decrescente", () => {
    expect(linearTrend([50, 40, 30, 20, 10])?.direction).toBe("down");
  });

  it("classifica série estável como flat", () => {
    expect(linearTrend([30, 30, 30, 30])?.direction).toBe("flat");
  });

  it("exige pelo menos três pontos", () => {
    expect(linearTrend([10, 20])).toBeNull();
  });
});

describe("detectAnomalies()", () => {
  const stable = Array.from({ length: 10 }, (_, i) => ({
    label: `d${i}`,
    value: 100,
  }));

  it("aponta o ponto que foge da média", () => {
    const series = [...stable, { label: "pico", value: 900 }];
    const anomalies = detectAnomalies(series, 2);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].label).toBe("pico");
    expect(anomalies[0].kind).toBe("spike");
  });

  it("não inventa anomalia em série sem dispersão", () => {
    expect(detectAnomalies(stable, 2)).toEqual([]);
  });

  it("não avalia série curta demais", () => {
    expect(detectAnomalies([{ label: "a", value: 1 }], 2)).toEqual([]);
  });
});

describe("concentration()", () => {
  it("mede quantos itens formam metade do total", () => {
    const result = concentration([
      { label: "a", value: 60 },
      { label: "b", value: 20 },
      { label: "c", value: 10 },
      { label: "d", value: 10 },
    ]);

    expect(result?.total).toBe(100);
    expect(result?.topShare).toBe(60);
    expect(result?.itemsToHalf).toBe(1);
  });

  it("devolve null quando não há valor positivo", () => {
    expect(concentration([{ label: "a", value: 0 }])).toBeNull();
  });
});

describe("extremes()", () => {
  it("devolve o maior e o menor ponto", () => {
    const result = extremes([
      { label: "seg", value: 10 },
      { label: "sex", value: 90 },
      { label: "dom", value: 50 },
    ]);

    expect(result?.best.label).toBe("sex");
    expect(result?.worst.label).toBe("seg");
  });

  it("exige ao menos dois pontos", () => {
    expect(extremes([{ label: "seg", value: 10 }])).toBeNull();
  });
});
