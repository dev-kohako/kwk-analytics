import { buildRuleInsights } from "../src/controllers/analytics/autoInsights.controller";
import type { InsightSummary } from "../src/types/autoInsights.types";

const baseSummary = (overrides: Partial<InsightSummary> = {}): InsightSummary => ({
  window: { from: "2025-09-08", to: "2025-10-08", currentDays: 30, previousDays: 30 },
  revenue: { current: 120_000, previous: 100_000, deltaPercent: 20 },
  orders: { current: 2_000, previous: 1_800, deltaPercent: 11.11 },
  averageTicket: { current: 60, previous: 55.56, deltaPercent: 7.99 },
  dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
    label: `2025-10-${String(i + 1).padStart(2, "0")}`,
    value: 4_000,
  })),
  channels: [
    { label: "iFood", value: 70_000, previous: 60_000 },
    { label: "Rappi", value: 30_000, previous: 25_000 },
    { label: "WhatsApp", value: 20_000, previous: 15_000 },
  ],
  products: [
    { label: "Pizza Calabresa", value: 20_000, previous: 18_000 },
    { label: "Hambúrguer", value: 15_000, previous: 14_000 },
  ],
  weekdays: [
    { label: "domingo", value: 10_000 },
    { label: "segunda", value: 8_000 },
    { label: "terça", value: 9_000 },
    { label: "quarta", value: 11_000 },
    { label: "quinta", value: 12_000 },
    { label: "sexta", value: 30_000 },
    { label: "sábado", value: 28_000 },
  ],
  deliveryMinutes: { current: 0, previous: 0 },
  ...overrides,
});

const products = [
  { product_name: "Pizza Calabresa", total: 20_000 },
  { product_name: "Hambúrguer", total: 15_000 },
  { product_name: "Refrigerante", total: 8_000 },
  { product_name: "Batata", total: 5_000 },
  { product_name: "Sobremesa", total: 2_000 },
];

describe("buildRuleInsights()", () => {
  it("gera o insight de receita com o delta do período", () => {
    const insights = buildRuleInsights(baseSummary(), products);
    const revenue = insights.find((i) => i.id === "revenue-window");

    expect(revenue).toBeDefined();
    expect(revenue?.deltaPercent).toBe(20);
    expect(revenue?.direction).toBe("up");
    expect(revenue?.severity).toBe("positive");
    expect(revenue?.generatedBy).toBe("rule");
  });

  it("omite o tempo de entrega quando o valor é zero", () => {
    const insights = buildRuleInsights(baseSummary(), products);
    expect(insights.find((i) => i.id === "delivery-time")).toBeUndefined();
  });

  it("inclui o tempo de entrega quando há dado real", () => {
    const insights = buildRuleInsights(
      baseSummary({ deliveryMinutes: { current: 42, previous: 38 } }),
      products
    );
    const delivery = insights.find((i) => i.id === "delivery-time");

    expect(delivery).toBeDefined();
    expect(delivery?.value).toBe(42);
  });

  it("alerta quando um único canal concentra mais de 60% da receita", () => {
    const insights = buildRuleInsights(
      baseSummary({
        revenue: { current: 100_000, previous: 90_000, deltaPercent: 11.11 },
        channels: [
          { label: "iFood", value: 80_000, previous: 70_000 },
          { label: "Rappi", value: 20_000, previous: 20_000 },
        ],
      }),
      products
    );
    const channel = insights.find((i) => i.id === "channel-leader");

    expect(channel?.severity).toBe("warning");
    expect(channel?.suggestion).toContain("diversificação");
  });

  it("sinaliza canal em retração relevante", () => {
    const insights = buildRuleInsights(
      baseSummary({
        channels: [
          { label: "iFood", value: 70_000, previous: 60_000 },
          { label: "Rappi", value: 10_000, previous: 30_000 },
        ],
      }),
      products
    );
    const falling = insights.find((i) => i.id === "channel-falling");

    expect(falling?.entity).toBe("Rappi");
    expect(falling?.severity).toBe("critical");
    expect(falling?.direction).toBe("down");
  });

  it("aponta o dia mais forte da semana", () => {
    const insights = buildRuleInsights(baseSummary(), products);
    const weekday = insights.find((i) => i.id === "weekday-seasonality");

    expect(weekday?.entity).toBe("sexta");
    expect(weekday?.type).toBe("seasonality");
  });

  it("detecta queda anômala na série diária", () => {
    const daily = Array.from({ length: 30 }, (_, i) => ({
      label: `2025-10-${String(i + 1).padStart(2, "0")}`,
      value: i === 15 ? 100 : 4_000,
    }));

    const insights = buildRuleInsights(baseSummary({ dailyRevenue: daily }), products);
    const anomaly = insights.find((i) => i.id === "revenue-anomaly");

    expect(anomaly?.severity).toBe("critical");
    expect(anomaly?.entity).toBe("2025-10-16");
  });

  it("nunca emite HTML nas mensagens", () => {
    const insights = buildRuleInsights(baseSummary(), products);

    for (const insight of insights) {
      expect(insight.message).not.toMatch(/<[^>]+>/);
      expect(insight.title.length).toBeGreaterThan(0);
    }
  });

  it("não quebra com período sem dado algum", () => {
    const empty = baseSummary({
      revenue: { current: 0, previous: 0, deltaPercent: 0 },
      orders: { current: 0, previous: 0, deltaPercent: 0 },
      averageTicket: { current: 0, previous: 0, deltaPercent: 0 },
      dailyRevenue: [],
      channels: [],
      products: [],
      weekdays: [],
      deliveryMinutes: { current: null, previous: null },
    });

    expect(() => buildRuleInsights(empty, [])).not.toThrow();
  });
});
