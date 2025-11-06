import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { PivotInput, PivotFieldInput } from "../../types/pivot.types";
import { AppError } from "../../utils/errors";

export const runPivot = async (input: PivotInput) => {
  try {
    const {
      dimensions,
      measures,
      limit = 100,
      filters = [],
      dateRange,
    } = input;

    if (!measures?.length) {
      throw new AppError("Ao menos uma métrica é obrigatória.", 400);
    }

    const FIELD_MAP: Record<string, string> = {
      product: "product_name",
      delivery_region: "delivery_region",
      channel: "channel",
      store_id: "store_id",
      customer_id: "customer_id",
      product_id: "product_id",
      sold_date: "sold_date",
      revenue: "revenue",
      quantity: "quantity",
      sale_id: "sale_id",
    };

    for (const m of measures) {
      if (!FIELD_MAP[m.field]) {
        throw new AppError(`Campo inválido na métrica: "${m.field}"`, 400);
      }
    }
    for (const d of dimensions ?? []) {
      if (!FIELD_MAP[d]) {
        throw new AppError(`Dimensão inválida: "${d}"`, 400);
      }
    }

    const dimSql = dimensions?.length
      ? dimensions.map((d) => `"${FIELD_MAP[d]}"`)
      : [];

    const measuresSql = measures.map((m) => {
      const field = FIELD_MAP[m.field];
      const alias = m.alias || `${m.fn.toLowerCase()}_${field}`;
      return `${m.fn.toUpperCase()}(${field}) AS ${alias}`;
    });

    const whereParts: string[] = [];

    for (const f of filters) {
      const field = FIELD_MAP[f.field];
      if (!field) throw new AppError(`Filtro inválido: "${f.field}"`, 400);

      const safeValue = (val: any) => `'${String(val).replace(/'/g, "''")}'`;

      if (f.op === "in" && Array.isArray(f.value) && f.value.length > 0) {
        whereParts.push(
          `"${field}" IN (${f.value.map((v: any) => safeValue(v)).join(",")})`
        );
      } else if (["=", "!=", "<", ">", "<=", ">="].includes(f.op)) {
        whereParts.push(`"${field}" ${f.op} ${safeValue(f.value)}`);
      } else if (f.op === "like") {
        whereParts.push(
          `"${field}" ILIKE '%${String(f.value).replace(/'/g, "''")}%'`
        );
      }
    }

    if (dateRange?.from && dateRange?.to) {
      whereParts.push(
        `"sold_date" BETWEEN '${dateRange.from}'::timestamp AND '${dateRange.to}'::timestamp`
      );
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(" AND ")}`
      : "";
    const groupClause = dimSql.length ? `GROUP BY ${dimSql.join(", ")}` : "";
    const limitSafe = Math.min(limit, 1000);

    const sql = `
      SELECT ${[...dimSql, ...measuresSql].join(", ")}
      FROM mv_sales_fact
      ${whereClause}
      ${groupClause}
      ORDER BY ${measures[0].fn.toLowerCase()}_${
      FIELD_MAP[measures[0].field]
    } DESC
      LIMIT ${limitSafe};
    `;

    const rows = await prisma.$queryRawUnsafe<any[]>(sql.trim());

    const serialized = rows.map((row) => {
      const fixed: Record<string, any> = {};
      for (const key in row) {
        const val = (row as any)[key];
        fixed[key] = typeof val === "bigint" ? Number(val) : val;
      }
      return fixed;
    });

    return { sql: sql.trim(), rows: serialized };
  } catch (err) {
    console.error("❌ Erro no Pivot:", err);
    throw new AppError("Erro ao executar pivot", 400, err);
  }
};

export async function getPivotFieldValues(
  input: PivotFieldInput
): Promise<string[]> {
  const FIELD_MAP: Record<string, { table: string; column: string }> = {
    channel: { table: "mv_sales_fact", column: "channel" },
    delivery_region: { table: "mv_sales_fact", column: "delivery_region" },
    store_id: { table: "mv_sales_fact", column: "store_id" },
    product: { table: "mv_sales_fact", column: "product_name" },
    product_id: { table: "mv_sales_fact", column: "product_id" },
    customer_id: { table: "mv_sales_fact", column: "customer_id" },
  };

  const def = FIELD_MAP[input.field];
  if (!def) throw new AppError(`Campo "${input.field}" não suportado.`, 400);

  const { table, column } = def;
  const normalizedLimit = Math.max(1, Math.min(input.limit ?? 50, 200));
  const search = input.search?.trim();

  try {
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT DISTINCT ${Prisma.raw(column)} AS value
      FROM ${Prisma.raw(table)}
      ${
        search
          ? Prisma.sql`WHERE ${Prisma.raw(column)} ILIKE ${"%" + search + "%"}`
          : Prisma.empty
      }
      ORDER BY value NULLS LAST
      LIMIT ${normalizedLimit};
    `;

    return rows.map((r) => r.value).filter(Boolean);
  } catch (err) {
    console.error("❌ Erro ao buscar valores do pivot:", err);
    throw new AppError(
      "Falha ao carregar valores de filtro dinâmico.",
      500,
      err
    );
  }
}
