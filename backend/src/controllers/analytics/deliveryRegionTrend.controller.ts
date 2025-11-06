import prisma from "../../lib/prisma";
import { RegionTrend, RegionTrendInput } from "../../types/deliveryRegionTrend.types";
import { AppError } from "../../utils/errors";

export async function getDeliveryRegionTrend(
  input: RegionTrendInput
): Promise<RegionTrend[]> {
  if (!input?.period?.dateFrom || !input?.period?.dateTo) {
    throw new AppError("Período inválido: datas não definidas.", 400);
  }

  const { dateFrom, dateTo, prevDateFrom, prevDateTo } = input.period;
  const fromPrev = prevDateFrom ?? dateFrom;
  const toPrev = prevDateTo ?? dateTo;

  try {
    const [cur, prev] = await Promise.all([
      prisma.$queryRaw<RegionTrend[]>`
        SELECT 
          delivery_region, 
          AVG(delivery_minutes)::numeric AS avg_cur
        FROM mv_sales_fact
        WHERE sold_date BETWEEN ${dateFrom}::timestamp AND ${dateTo}::timestamp
          AND delivery_region IS NOT NULL
          AND delivery_minutes IS NOT NULL
        GROUP BY delivery_region;
      `,
      prisma.$queryRaw<RegionTrend[]>`
        SELECT 
          delivery_region, 
          AVG(delivery_minutes)::numeric AS avg_prev
        FROM mv_sales_fact
        WHERE sold_date BETWEEN ${fromPrev}::timestamp AND ${toPrev}::timestamp
          AND delivery_region IS NOT NULL
          AND delivery_minutes IS NOT NULL
        GROUP BY delivery_region;
      `,
    ]);

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return cur.map((r) => {
      const prevMatch = prev.find((x) => x.delivery_region === r.delivery_region);
      const avg_prev = Number(prevMatch?.avg_prev ?? 0);
      const avg_cur = Number(r.avg_cur ?? 0);
      const delta_min = avg_cur - avg_prev;
      const delta_percent = avg_prev ? ((avg_cur - avg_prev) / avg_prev) * 100 : 0;

      return {
        delivery_region: r.delivery_region,
        avg_prev: round2(avg_prev),
        avg_cur: round2(avg_cur),
        delta_min: round2(delta_min),
        delta_percent: Number(delta_percent.toFixed(2)),
      };
    });
  } catch (err) {
    console.error("❌ Erro em getDeliveryRegionTrend:", err);
    throw new AppError("Erro ao buscar tendência por região de entrega", 500, err);
  }
}
