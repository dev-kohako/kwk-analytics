import prisma from "../../lib/prisma";
import { LostCustomer } from "../../types/lostButLoyal.types";
import { AppError } from "../../utils/errors";

export const getLostButLoyal = async (): Promise<LostCustomer[]> => {
  try {
    const rows = await prisma.$queryRaw<LostCustomer[]>`
      WITH orders_by_client AS (
        SELECT 
          customer_id,
          COUNT(DISTINCT sale_id)::int AS n_orders,
          MAX(sold_date)::timestamp AS last_date
        FROM mv_sales_fact
        GROUP BY customer_id
      ),
      maxd AS (SELECT MAX(sold_date)::timestamp AS maxd FROM mv_sales_fact)
      SELECT 
        o.customer_id, 
        o.n_orders, 
        o.last_date
      FROM orders_by_client o, maxd
      WHERE o.n_orders >= 3
        AND o.last_date < (maxd.maxd - INTERVAL '30 days')
      ORDER BY o.last_date ASC
      LIMIT 200;
    `;

    return rows.map((r) => ({
      customer_id: r.customer_id,
      n_orders: Number(r.n_orders ?? 0),
      last_date: r.last_date,
    }));
  } catch (err) {
    console.error("❌ Erro em getLostButLoyal:", err);
    throw new AppError("Erro ao buscar clientes fiéis inativos", 500, err);
  }
};
