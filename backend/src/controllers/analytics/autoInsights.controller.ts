import prisma from "../../lib/prisma";
import {
  concentration,
  detectAnomalies,
  extremes,
  linearTrend,
  pctDelta,
  direction as toDirection,
  round,
  type Point,
} from "../../lib/analytics/stats";
import { generateAIInsights } from "./aiAnalytics";
import {
  AutoInsight,
  ChannelRow,
  DailyRevenueRow,
  DeliveryRow,
  InsightSummary,
  OrdersRow,
  ProductRow,
  TotalRevenueRow,
  WeekdayRow,
} from "../../types/autoInsights.types";

const WINDOW_DAYS = 30;
const TOP_N = 5;

const WEEKDAYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

const fmtBRL = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);

/** "11/09 a 08/10" — o período realmente analisado, não "últimos 30 dias". */
const fmtPeriodo = (from: string, to: string): string => {
  const br = (iso: string) => {
    const [a, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${br(from)} a ${br(to)}`;
};

const fmtPct = (value: number): string =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const num = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toISODate = (day: Date | string): string =>
  day instanceof Date
    ? day.toISOString().slice(0, 10)
    : String(day).slice(0, 10);

/**
 * Data mais recente com venda registrada.
 *
 * A análise se ancora nela, não em `current_date`: uma base que parou de
 * receber carga há meses devolveria trinta dias vazios e a tela diria "sem
 * vendas", como se a operação tivesse parado. Ancorando no dado, a leitura
 * continua fazendo sentido — e o período fica explícito na mensagem.
 */
async function loadAnchor(): Promise<Date | null> {
  const [row] = await prisma.$queryRaw<Array<{ anchor: Date | null }>>`
    SELECT MAX(sold_date)::date AS anchor FROM mv_sales_fact;
  `;
  return row?.anchor ?? null;
}

/**
 * Janelas comparadas: os 30 dias até a âncora contra os 30 imediatamente
 * anteriores. Os limites não se sobrepõem — o dia -30 pertence apenas à
 * janela anterior.
 */
async function loadAggregates(anchor: Date) {
  return prisma.$transaction([
    prisma.$queryRaw<TotalRevenueRow[]>`
      SELECT
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '30 days'
        ), 0)::float8 AS cur,
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '60 days'
            AND sold_date <  ${anchor}::date - interval '30 days'
        ), 0)::float8 AS prev
      FROM mv_sales_fact;
    `,
    prisma.$queryRaw<OrdersRow[]>`
      SELECT
        COUNT(DISTINCT sale_id) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '30 days'
        )::int AS cur,
        COUNT(DISTINCT sale_id) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '60 days'
            AND sold_date <  ${anchor}::date - interval '30 days'
        )::int AS prev
      FROM mv_sales_fact;
    `,
    prisma.$queryRaw<DailyRevenueRow[]>`
      SELECT sold_date AS day, COALESCE(SUM(revenue), 0)::float8 AS total
      FROM mv_sales_fact
      WHERE sold_date >= ${anchor}::date - interval '30 days'
      GROUP BY sold_date
      ORDER BY sold_date;
    `,
    prisma.$queryRaw<ChannelRow[]>`
      SELECT
        channel AS name,
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '30 days'
        ), 0)::float8 AS total,
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '60 days'
            AND sold_date <  ${anchor}::date - interval '30 days'
        ), 0)::float8 AS total_prev
      FROM mv_sales_fact
      WHERE channel IS NOT NULL
        AND sold_date >= ${anchor}::date - interval '60 days'
      GROUP BY channel
      ORDER BY total DESC;
    `,
    prisma.$queryRaw<ProductRow[]>`
      SELECT
        product_name,
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '30 days'
        ), 0)::float8 AS total,
        COALESCE(SUM(revenue) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '60 days'
            AND sold_date <  ${anchor}::date - interval '30 days'
        ), 0)::float8 AS total_prev
      FROM mv_sales_fact
      WHERE product_name IS NOT NULL
        AND sold_date >= ${anchor}::date - interval '60 days'
      GROUP BY product_name
      ORDER BY total DESC
      LIMIT 50;
    `,
    prisma.$queryRaw<WeekdayRow[]>`
      SELECT dow::int AS dow, COALESCE(SUM(revenue), 0)::float8 AS total
      FROM mv_sales_fact
      WHERE sold_date >= ${anchor}::date - interval '30 days'
      GROUP BY dow
      ORDER BY dow;
    `,
    prisma.$queryRaw<DeliveryRow[]>`
      SELECT
        AVG(delivery_minutes) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '30 days'
        )::float8 AS avg_cur,
        AVG(delivery_minutes) FILTER (
          WHERE sold_date >= ${anchor}::date - interval '60 days'
            AND sold_date <  ${anchor}::date - interval '30 days'
        )::float8 AS avg_prev
      FROM mv_sales_fact
      WHERE delivery_minutes IS NOT NULL;
    `,
  ]);
}

export function buildSummary(
  anchor: Date | string,
  revenue: TotalRevenueRow | undefined,
  orders: OrdersRow | undefined,
  daily: DailyRevenueRow[],
  channels: ChannelRow[],
  products: ProductRow[],
  weekdays: WeekdayRow[],
  delivery: DeliveryRow | undefined
): InsightSummary {
  const revenueCur = num(revenue?.cur);
  const revenuePrev = num(revenue?.prev);
  const ordersCur = num(orders?.cur);
  const ordersPrev = num(orders?.prev);

  const ticketCur = ordersCur > 0 ? round(revenueCur / ordersCur) : 0;
  const ticketPrev = ordersPrev > 0 ? round(revenuePrev / ordersPrev) : 0;

  const ate = toISODate(anchor);
  const de = toISODate(
    new Date(new Date(ate).getTime() - WINDOW_DAYS * 86_400_000)
  );

  return {
    window: {
      from: de,
      to: ate,
      currentDays: WINDOW_DAYS,
      previousDays: WINDOW_DAYS,
    },
    revenue: {
      current: round(revenueCur),
      previous: round(revenuePrev),
      deltaPercent: pctDelta(revenueCur, revenuePrev),
    },
    orders: {
      current: ordersCur,
      previous: ordersPrev,
      deltaPercent: pctDelta(ordersCur, ordersPrev),
    },
    averageTicket: {
      current: ticketCur,
      previous: ticketPrev,
      deltaPercent: pctDelta(ticketCur, ticketPrev),
    },
    dailyRevenue: daily.map((row) => ({
      label: toISODate(row.day),
      value: round(num(row.total)),
    })),
    channels: channels.slice(0, TOP_N).map((row) => ({
      label: row.name,
      value: round(num(row.total)),
      previous: round(num(row.total_prev)),
    })),
    products: products.slice(0, TOP_N).map((row) => ({
      label: row.product_name,
      value: round(num(row.total)),
      previous: round(num(row.total_prev)),
    })),
    weekdays: weekdays.map((row) => ({
      label: WEEKDAYS[row.dow] ?? String(row.dow),
      value: round(num(row.total)),
    })),
    deliveryMinutes: {
      current:
        delivery?.avg_cur === null || delivery?.avg_cur === undefined
          ? null
          : round(num(delivery.avg_cur)),
      previous:
        delivery?.avg_prev === null || delivery?.avg_prev === undefined
          ? null
          : round(num(delivery.avg_prev)),
    },
  };
}

/** Insights determinísticos — a base que sempre existe, com ou sem IA. */
export function buildRuleInsights(
  summary: InsightSummary,
  allProducts: Array<{ product_name: string; total: number | null }>
): AutoInsight[] {
  const insights: AutoInsight[] = [];
  const push = (insight: AutoInsight) => insights.push(insight);

  // 1. Receita da janela
  const revenueDelta = summary.revenue.deltaPercent;
  if (summary.revenue.current > 0 || summary.revenue.previous > 0) {
    const dir = toDirection(revenueDelta);
    push({
      id: "revenue-window",
      title: `Receita de ${fmtPeriodo(summary.window.from, summary.window.to)}`,
      message:
        revenueDelta === null
          ? `A receita entre ${fmtPeriodo(summary.window.from, summary.window.to)} foi de ${fmtBRL(summary.revenue.current)}. Não há base anterior para comparação.`
          : `A receita entre ${fmtPeriodo(summary.window.from, summary.window.to)} foi de ${fmtBRL(summary.revenue.current)}, ${fmtPct(revenueDelta)} contra os 30 dias anteriores (${fmtBRL(summary.revenue.previous)}).`,
      type: "sales",
      severity: dir === "down" ? "warning" : dir === "up" ? "positive" : "info",
      metric: "revenue",
      value: summary.revenue.current,
      previousValue: summary.revenue.previous,
      deltaPercent: revenueDelta ?? undefined,
      direction: dir,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 2. Ticket médio — o sinal interessante é quando ele diverge da receita
  const ticketDelta = summary.averageTicket.deltaPercent;
  if (summary.averageTicket.current > 0) {
    const ticketDir = toDirection(ticketDelta);
    const diverge =
      revenueDelta !== null &&
      ticketDelta !== null &&
      Math.sign(revenueDelta) !== Math.sign(ticketDelta) &&
      ticketDir !== "flat";

    push({
      id: "average-ticket",
      title: "Ticket médio",
      message: diverge
        ? `O ticket médio ficou em ${fmtBRL(summary.averageTicket.current)} (${fmtPct(ticketDelta as number)}), movendo-se na direção oposta à da receita — o volume de pedidos está compensando o valor por pedido.`
        : `O ticket médio ficou em ${fmtBRL(summary.averageTicket.current)}${ticketDelta === null ? "." : `, ${fmtPct(ticketDelta)} contra o período anterior.`}`,
      type: "sales",
      severity: diverge || ticketDir === "down" ? "warning" : "info",
      metric: "average_ticket",
      value: summary.averageTicket.current,
      previousValue: summary.averageTicket.previous,
      deltaPercent: ticketDelta ?? undefined,
      direction: ticketDir,
      suggestion: diverge
        ? "Revise combos e itens adicionais nos canais de maior volume para recuperar valor por pedido."
        : undefined,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 3. Tendência dentro da janela
  const trend = linearTrend(summary.dailyRevenue.map((point) => point.value));
  if (trend && trend.r2 >= 0.3 && trend.direction !== "flat") {
    push({
      id: "revenue-trend",
      title: "Tendência dentro do período",
      message: `Dentro do período a receita diária vem ${trend.direction === "up" ? "subindo" : "caindo"} de forma consistente (${fmtPct(trend.changePercent ?? 0)} do início ao fim da janela).`,
      type: "sales",
      severity: trend.direction === "down" ? "warning" : "positive",
      metric: "revenue_daily",
      deltaPercent: trend.changePercent ?? undefined,
      direction: trend.direction,
      generatedBy: "rule",
      confidence: trend.r2,
    });
  }

  // 4. Anomalias diárias
  const anomalies = detectAnomalies(summary.dailyRevenue, 2.5);
  if (anomalies.length > 0) {
    const worst = anomalies[0];
    push({
      id: "revenue-anomaly",
      title:
        worst.kind === "spike" ? "Pico fora do padrão" : "Queda fora do padrão",
      message: `O dia ${worst.label} ${worst.kind === "spike" ? "ficou muito acima" : "ficou muito abaixo"} da média do período (${fmtBRL(worst.value)}, ${Math.abs(worst.zScore).toFixed(1)} desvios-padrão).`,
      type: "anomaly",
      severity: worst.kind === "drop" ? "critical" : "info",
      metric: "revenue_daily",
      value: worst.value,
      dimension: "sold_date",
      entity: worst.label,
      suggestion:
        worst.kind === "drop"
          ? "Verifique se houve indisponibilidade de loja, falha de integração de canal ou feriado nesse dia."
          : "Identifique o que puxou esse pico — campanha, evento ou clima — e tente reproduzir.",
      generatedBy: "rule",
      confidence: Math.min(1, Math.abs(worst.zScore) / 4),
    });
  }

  // 5. Canal líder
  const [leadChannel] = summary.channels;
  if (leadChannel) {
    const share =
      summary.revenue.current > 0
        ? round((leadChannel.value / summary.revenue.current) * 100)
        : 0;
    push({
      id: "channel-leader",
      title: "Canal com maior faturamento",
      message: `${leadChannel.label} liderou com ${fmtBRL(leadChannel.value)}, o equivalente a ${share.toFixed(1)}% da receita do período.`,
      type: "channel",
      severity: share >= 60 ? "warning" : "info",
      metric: "revenue",
      value: leadChannel.value,
      previousValue: leadChannel.previous,
      deltaPercent:
        pctDelta(leadChannel.value, leadChannel.previous) ?? undefined,
      dimension: "channel",
      entity: leadChannel.label,
      suggestion:
        share >= 60
          ? "Mais de 60% da receita depende de um único canal — vale trabalhar a diversificação."
          : undefined,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 6. Canal em retração
  const fallingChannel = summary.channels
    .filter((channel) => channel.previous > 0)
    .map((channel) => ({
      ...channel,
      delta: pctDelta(channel.value, channel.previous) ?? 0,
    }))
    .sort((a, b) => a.delta - b.delta)[0];

  if (fallingChannel && fallingChannel.delta <= -10) {
    push({
      id: "channel-falling",
      title: "Canal em retração",
      message: `${fallingChannel.label} caiu ${fmtPct(fallingChannel.delta)} contra o período anterior, saindo de ${fmtBRL(fallingChannel.previous)} para ${fmtBRL(fallingChannel.value)}.`,
      type: "channel",
      severity: fallingChannel.delta <= -25 ? "critical" : "warning",
      metric: "revenue",
      value: fallingChannel.value,
      previousValue: fallingChannel.previous,
      deltaPercent: fallingChannel.delta,
      direction: "down",
      dimension: "channel",
      entity: fallingChannel.label,
      suggestion: `Compare preço, tempo de preparo e disponibilidade de cardápio em ${fallingChannel.label} contra os demais canais.`,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 7. Produto destaque
  const [leadProduct] = summary.products;
  if (leadProduct) {
    const productDelta = pctDelta(leadProduct.value, leadProduct.previous);
    push({
      id: "product-leader",
      title: "Produto de maior receita",
      message: `${leadProduct.label} gerou ${fmtBRL(leadProduct.value)} no período${leadProduct.previous > 0 && productDelta !== null ? `, ${fmtPct(productDelta)} contra os 30 dias anteriores` : ""}.`,
      type: "product",
      severity: "info",
      metric: "revenue",
      value: leadProduct.value,
      previousValue: leadProduct.previous,
      deltaPercent: productDelta ?? undefined,
      dimension: "product_name",
      entity: leadProduct.label,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 8. Concentração de receita (leitura de Pareto)
  const productPoints: Point[] = allProducts.map((row) => ({
    label: row.product_name,
    value: num(row.total),
  }));
  const pareto = concentration(productPoints);
  if (pareto && productPoints.length >= 5) {
    push({
      id: "revenue-concentration",
      title: "Concentração da receita",
      message: `${pareto.itemsToHalf} ${pareto.itemsToHalf === 1 ? "produto responde" : "produtos respondem"} por metade da receita do período, e os 20% maiores concentram ${pareto.topQuintileShare.toFixed(1)}% do total.`,
      type: "concentration",
      severity: pareto.topQuintileShare >= 80 ? "warning" : "info",
      metric: "revenue",
      value: pareto.topQuintileShare,
      dimension: "product_name",
      suggestion:
        pareto.topQuintileShare >= 80
          ? "A receita depende de poucos itens: ruptura de estoque em qualquer um deles derruba o mês."
          : undefined,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  // 9. Sazonalidade por dia da semana
  const weekdayExtremes = extremes(summary.weekdays);
  if (weekdayExtremes && summary.weekdays.length >= 5) {
    const { best, worst } = weekdayExtremes;
    const gap = pctDelta(best.value, worst.value);
    if (gap !== null && gap >= 20) {
      push({
        id: "weekday-seasonality",
        title: "Dia mais forte da semana",
        message: `${best.label} concentra o maior faturamento (${fmtBRL(best.value)}), ${gap.toFixed(0)}% acima de ${worst.label}, o dia mais fraco.`,
        type: "seasonality",
        severity: "info",
        metric: "revenue",
        value: best.value,
        dimension: "dow",
        entity: best.label,
        suggestion: `Concentre promoções em ${worst.label} e reforce a operação em ${best.label}.`,
        generatedBy: "rule",
        confidence: 1,
      });
    }
  }

  // 10. Tempo de entrega — só reporta quando há dado real.
  // A `mv_sales_fact` calcula `delivery_minutes` com um placeholder que resulta
  // em 0; anunciar "0 minutos" seria ruído, então o insight é omitido.
  const deliveryCur = summary.deliveryMinutes.current;
  if (deliveryCur !== null && deliveryCur > 0) {
    const deliveryDelta = pctDelta(
      deliveryCur,
      summary.deliveryMinutes.previous ?? 0
    );
    push({
      id: "delivery-time",
      title: "Tempo médio de entrega",
      message: `O tempo médio de entrega foi de ${deliveryCur.toFixed(1)} minutos${deliveryDelta === null ? "." : `, ${fmtPct(deliveryDelta)} contra o período anterior.`}`,
      type: "delivery",
      severity:
        deliveryDelta !== null && deliveryDelta > 10 ? "warning" : "info",
      metric: "delivery_minutes",
      value: deliveryCur,
      previousValue: summary.deliveryMinutes.previous ?? undefined,
      deltaPercent: deliveryDelta ?? undefined,
      generatedBy: "rule",
      confidence: 1,
    });
  }

  return insights;
}

export const getAutoInsights = async (): Promise<AutoInsight[]> => {
  const anchor = await loadAnchor();

  // Base sem venda alguma: não há o que analisar, e inventar janela não ajuda.
  if (!anchor) return [];

  const [revenue, orders, daily, channels, products, weekdays, delivery] =
    await loadAggregates(anchor);

  const summary = buildSummary(
    anchor,
    revenue?.[0],
    orders?.[0],
    daily,
    channels,
    products,
    weekdays,
    delivery?.[0]
  );

  const ruleInsights = buildRuleInsights(summary, products);

  // A IA é aditiva: se estiver desligada ou falhar, a resposta segue completa.
  const aiInsights = await generateAIInsights(summary, ruleInsights);

  return [...ruleInsights, ...aiInsights];
};
