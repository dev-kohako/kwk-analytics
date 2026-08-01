/**
 * Aceita qualquer métrica com função e campo — o store trabalha com um
 * conjunto maior de funções (`count_distinct`, `min`, `max`) do que o tipo
 * `Measure` do Pivot Builder.
 */
export type AnyMeasure = { fn: string; field: string; alias?: string };

/**
 * Tradução entre os nomes técnicos do banco e a linguagem de quem usa.
 *
 * Quem abre a plataforma é dono de restaurante, não analista: "dow" e
 * "sum(revenue)" não significam nada. Este arquivo é a fonte única desses
 * rótulos e da formatação de cada métrica.
 */

export const DIMENSION_LABELS: Record<string, string> = {
  store_id: "Loja",
  channel: "Canal",
  product_id: "Produto",
  customer_id: "Cliente",
  sold_date: "Data",
  dow: "Dia da semana",
  hour_of_day: "Hora do dia",
  delivery_region: "Região",
};

export const dimensionLabel = (dim: string): string =>
  DIMENSION_LABELS[dim] ?? dim;

/** Rótulo de métrica: o que o número significa, não como ele é calculado. */
export const MEASURE_LABELS: Record<string, string> = {
  "sum:revenue": "Faturamento",
  "avg:revenue": "Faturamento médio",
  "sum:quantity": "Itens vendidos",
  "avg:quantity": "Itens por pedido",
  "count:sale_id": "Pedidos",
  "count_distinct:customer_id": "Clientes distintos",
  "avg:delivery_minutes": "Tempo médio de entrega",
};

export const measureKey = (m: AnyMeasure): string => `${m.fn}:${m.field}`;

export const measureLabel = (m: AnyMeasure): string =>
  MEASURE_LABELS[measureKey(m)] ?? `${m.fn}(${m.field})`;

/** Coluna que o backend devolve para uma métrica. */
export const measureColumn = (m: AnyMeasure): string => `${m.fn}_${m.field}`;

type Format = "currency" | "integer" | "decimal" | "minutes";

const FORMAT_BY_FIELD: Record<string, Format> = {
  revenue: "currency",
  quantity: "integer",
  sale_id: "integer",
  customer_id: "integer",
  delivery_minutes: "minutes",
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata o valor conforme o significado da métrica, não conforme o tipo. */
export function formatMeasure(
  value: unknown,
  field: string,
  fallback = "—"
): string {
  if (value === null || value === undefined || value === "") return fallback;

  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  switch (FORMAT_BY_FIELD[field] ?? "decimal") {
    case "currency":
      return brl.format(n);
    case "integer":
      return inteiro.format(n);
    case "minutes":
      return `${decimal.format(n)} min`;
    default:
      return decimal.format(n);
  }
}

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

/** Valores de dimensão também precisam de tradução: dow=5 vira "Sexta". */
export function formatDimensionValue(dim: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (dim === "dow") {
    const i = Number(value);
    return WEEKDAYS[i] ?? String(value);
  }

  if (dim === "hour_of_day") {
    const h = Number(value);
    return Number.isFinite(h) ? `${String(h).padStart(2, "0")}h` : String(value);
  }

  if (dim === "sold_date") {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime())
      ? String(value)
      : d.toLocaleDateString("pt-BR");
  }

  return String(value);
}
