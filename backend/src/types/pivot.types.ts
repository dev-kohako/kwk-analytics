export interface PivotMeasure {
  field: string;
  fn: "sum" | "avg" | "count" | "count_distinct" | "min" | "max";
  alias?: string;
}

export interface PivotFilter {
  field: string;
  op:
    | "="
    | "!="
    | ">"
    | "<"
    | ">="
    | "<="
    | "in"
    | "between"
    | "like";
  value?: any;
}

export interface PivotDateRange {
  from?: string;
  to?: string;
}

export interface PivotInput {
  dimensions?: string[];
  measures: PivotMeasure[];
  filters?: PivotFilter[];
  dateRange?: PivotDateRange;
  limit?: number;
}

export interface PivotFieldInput {
  field: string;
  search?: string;
  limit?: number;
}