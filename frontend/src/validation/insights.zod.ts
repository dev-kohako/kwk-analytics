import { z } from "zod";

export const PeriodSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  prevDateFrom: z.string().optional(),
  prevDateTo: z.string().optional(),
});

export const TopProductsInputSchema = z.object({
  channel: z.string().optional(),
  dow: z.number().optional(),
  hourFrom: z.number().optional(),
  hourTo: z.number().optional(),
  period: PeriodSchema,
});

export const DeliveryRegionTrendInputSchema = z.object({
  period: PeriodSchema,
});

export const CommonFilterSchema = z.object({
  period: PeriodSchema.optional(),
  channel: z.string().optional(),
  dow: z.number().optional(),
  hourFrom: z.number().optional(),
  hourTo: z.number().optional(),
});