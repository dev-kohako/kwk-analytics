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

export type SaveDashboardInputType = z.infer<typeof SaveDashboardInput>;
