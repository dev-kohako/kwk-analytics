export interface AutoInsight {
  message: string;
  type?: "sales" | "channel" | "product" | "delivery";
}

export interface TotalRevenueRow {
  cur: number | null;
  prev: number | null;
}

export interface ChannelRow {
  name: string;
  total: number;
}

export interface ProductRow {
  product_name: string;
  total: number;
}

export interface DeliveryRow {
  avg_cur: number;
}