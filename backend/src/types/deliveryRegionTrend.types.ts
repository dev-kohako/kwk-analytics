export interface RegionTrend {
  delivery_region: string;
  avg_prev: number;
  avg_cur: number;
  delta_min: number;
  delta_percent: number;
}

export interface RegionTrendInput {
  period: {
    dateFrom: string;
    dateTo: string;
    prevDateFrom?: string;
    prevDateTo?: string;
  };
}