import type { Direction } from "../lib/analytics/stats";

export type InsightType =
  | "sales"
  | "channel"
  | "product"
  | "delivery"
  | "customer"
  | "seasonality"
  | "concentration"
  | "anomaly";

export type InsightSeverity = "positive" | "info" | "warning" | "critical";

/** Quem produziu o insight: regra determinística ou modelo de linguagem. */
export type InsightSource = "rule" | "ai";

export interface AutoInsight {
  id: string;
  title: string;
  /** Texto puro. Nunca HTML — o frontend renderiza como texto. */
  message: string;
  type: InsightType;
  severity: InsightSeverity;
  metric?: string;
  value?: number;
  previousValue?: number;
  deltaPercent?: number;
  direction?: Direction;
  /** Dimensão analisada, ex.: "channel", "product_name", "dow". */
  dimension?: string;
  /** Item concreto dentro da dimensão, ex.: "iFood". */
  entity?: string;
  /** Ação sugerida a partir do número. */
  suggestion?: string;
  generatedBy: InsightSource;
  /** 0 a 1. Nos insights de regra, reflete a força estatística do sinal. */
  confidence?: number;
}

/** Recorte agregado enviado ao modelo — sem linhas cruas e sem PII. */
export interface InsightSummary {
  /** Janela analisada. `to` é a última data com venda, não a data de hoje. */
  window: { from: string; to: string; currentDays: number; previousDays: number };
  revenue: { current: number; previous: number; deltaPercent: number | null };
  orders: { current: number; previous: number; deltaPercent: number | null };
  averageTicket: {
    current: number;
    previous: number;
    deltaPercent: number | null;
  };
  dailyRevenue: Array<{ label: string; value: number }>;
  channels: Array<{ label: string; value: number; previous: number }>;
  products: Array<{ label: string; value: number; previous: number }>;
  weekdays: Array<{ label: string; value: number }>;
  deliveryMinutes: { current: number | null; previous: number | null };
}

export interface TotalRevenueRow {
  cur: number | null;
  prev: number | null;
}

export interface OrdersRow {
  cur: number | null;
  prev: number | null;
}

export interface DailyRevenueRow {
  day: Date | string;
  total: number | null;
}

export interface ChannelRow {
  name: string;
  total: number | null;
  total_prev: number | null;
}

export interface ProductRow {
  product_name: string;
  total: number | null;
  total_prev: number | null;
}

export interface WeekdayRow {
  dow: number;
  total: number | null;
}

export interface DeliveryRow {
  avg_cur: number | null;
  avg_prev: number | null;
}
