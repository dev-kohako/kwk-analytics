export type ChartLine = {
  key: string;
  name?: string;
  color?: string;
};

export type Dimension =
  | "store_id"
  | "channel"
  | "product_id"
  | "customer_id"
  | "sold_date"
  | "dow"
  | "hour_of_day"
  | "delivery_region";

export type MeasureFn = "sum" | "avg" | "count";

export interface Measure {
  fn: MeasureFn;
  field: string;
}

export type PivotRow = Record<string, string | number | null>;

export const DIMENSIONS: Dimension[] = [
  "store_id",
  "channel",
  "product_id",
  "customer_id",
  "sold_date",
  "dow",
  "hour_of_day",
  "delivery_region",
];

export const MEASURES: Measure[] = [
  { fn: "sum", field: "revenue" },
  { fn: "sum", field: "quantity" },
  { fn: "avg", field: "delivery_minutes" },
];
