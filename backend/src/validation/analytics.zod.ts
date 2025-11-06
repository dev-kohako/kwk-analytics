import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Data inválida (YYYY-MM-DD)");

export const PeriodInput = z.object({
  dateFrom: isoDate,
  dateTo: isoDate,
  prevDateFrom: isoDate.optional(),
  prevDateTo: isoDate.optional(),
});

export const SaveDashboardInput = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100),
  config: z.any(),
});

export const DeliveryRegionTrendInput = z.object({
  period: PeriodInput,
});

export const TopProductsInput = z.object({
  channel: z.string().trim().optional(),
  dow: z.number().min(0).max(6).optional(),
  hourFrom: z.number().min(0).max(23).optional(),
  hourTo: z.number().min(0).max(23).optional(),
  period: PeriodInput,
});

export const DateRangeInput = z
  .object({
    from: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T.*)?$/,
        "Data inválida (esperado YYYY-MM-DD ou ISO)"
      )
      .optional()
      .or(z.literal("")),
    to: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T.*)?$/,
        "Data inválida (esperado YYYY-MM-DD ou ISO)"
      )
      .optional()
      .or(z.literal("")),
  })
  .optional();

export const PivotMeasureInput = z.object({
  field: z.string(),
  fn: z.enum(["sum", "avg", "count", "count_distinct", "min", "max"]),
  alias: z.string().optional(),
});

export const FilterInput = z.object({
  field: z.string(),
  op: z.enum(["=", "!=", ">", "<", ">=", "<=", "in", "between", "like"]),
  value: z.any(),
});

export const PivotInput = z.object({
  dimensions: z.array(z.string()).optional(),
  measures: z.array(PivotMeasureInput),
  filters: z.array(FilterInput).optional(),
  dateRange: DateRangeInput.optional(),
  limit: z.number().min(1).max(1000).optional(),
});

export const PivotFieldInput = z.object({
  field: z.string(),
  search: z.string().trim().optional(),
  limit: z.number().min(1).max(200).optional(),
});

export type SaveDashboardInputType = z.infer<typeof SaveDashboardInput>;
