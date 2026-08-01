/**
 * Funções estatísticas puras usadas pelos insights.
 *
 * Nenhuma delas toca banco, rede ou relógio — o que as torna testáveis sem
 * infraestrutura e determinísticas para o mesmo input.
 */

export interface Point {
  label: string;
  value: number;
}

export type Direction = "up" | "down" | "flat";

const FLAT_THRESHOLD_PERCENT = 1;

export const round = (value: number, digits = 2): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** Variação percentual protegida contra base zero. */
export function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return round(((current - previous) / Math.abs(previous)) * 100);
}

export function direction(deltaPercent: number | null): Direction {
  if (deltaPercent === null) return "flat";
  if (Math.abs(deltaPercent) < FLAT_THRESHOLD_PERCENT) return "flat";
  return deltaPercent > 0 ? "up" : "down";
}

export interface SeriesSummary {
  count: number;
  sum: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export function summarize(values: number[]): SeriesSummary | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return null;

  const sorted = [...clean].sort((a, b) => a - b);
  const sum = clean.reduce((acc, v) => acc + v, 0);
  const mean = sum / clean.length;
  const variance =
    clean.reduce((acc, v) => acc + (v - mean) ** 2, 0) / clean.length;

  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    count: clean.length,
    sum: round(sum),
    mean: round(mean),
    median: round(median),
    stdDev: round(Math.sqrt(variance)),
    min: round(sorted[0]),
    max: round(sorted[sorted.length - 1]),
  };
}

export interface Trend {
  /** Inclinação da reta ajustada, em unidades da métrica por período. */
  slope: number;
  direction: Direction;
  /** Variação total implícita pela reta, do primeiro ao último ponto, em %. */
  changePercent: number | null;
  /** Coeficiente de determinação: quão bem a reta descreve a série (0 a 1). */
  r2: number;
}

/**
 * Regressão linear por mínimos quadrados sobre a ordem dos pontos.
 * Precisa de pelo menos 3 pontos para dizer algo com sentido.
 */
export function linearTrend(values: number[]): Trend | null {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 3) return null;

  const n = clean.length;
  const meanX = (n - 1) / 2;
  const meanY = clean.reduce((acc, v) => acc + v, 0) / n;

  let covariance = 0;
  let varianceX = 0;
  for (let i = 0; i < n; i += 1) {
    covariance += (i - meanX) * (clean[i] - meanY);
    varianceX += (i - meanX) ** 2;
  }

  const slope = varianceX === 0 ? 0 : covariance / varianceX;
  const intercept = meanY - slope * meanX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted = intercept + slope * i;
    ssRes += (clean[i] - predicted) ** 2;
    ssTot += (clean[i] - meanY) ** 2;
  }

  const first = intercept;
  const last = intercept + slope * (n - 1);
  const changePercent = pctDelta(last, first);

  return {
    slope: round(slope),
    direction: direction(changePercent),
    changePercent,
    r2: ssTot === 0 ? 1 : round(Math.max(0, 1 - ssRes / ssTot), 3),
  };
}

export interface Anomaly extends Point {
  zScore: number;
  kind: "spike" | "drop";
}

/**
 * Pontos que fogem da média por mais de `threshold` desvios-padrão.
 * Série curta ou sem dispersão não produz anomalia — evita alarme falso.
 */
export function detectAnomalies(points: Point[], threshold = 2): Anomaly[] {
  const stats = summarize(points.map((p) => p.value));
  if (!stats || stats.count < 5 || stats.stdDev === 0) return [];

  return points
    .map((point) => ({
      ...point,
      zScore: round((point.value - stats.mean) / stats.stdDev, 2),
    }))
    .filter((point) => Math.abs(point.zScore) >= threshold)
    .map((point) => ({
      ...point,
      kind: point.zScore > 0 ? ("spike" as const) : ("drop" as const),
    }))
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

export interface Concentration {
  /** Participação do maior item no total, em %. */
  topShare: number;
  /** Quantos itens são necessários para acumular 50% do total. */
  itemsToHalf: number;
  /** Participação acumulada dos 20% maiores itens, em % (leitura de Pareto). */
  topQuintileShare: number;
  total: number;
}

/** Mede o quanto o faturamento está concentrado em poucos itens. */
export function concentration(points: Point[]): Concentration | null {
  const clean = points.filter((p) => Number.isFinite(p.value) && p.value > 0);
  if (clean.length === 0) return null;

  const sorted = [...clean].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((acc, p) => acc + p.value, 0);
  if (total === 0) return null;

  let accumulated = 0;
  let itemsToHalf = 0;
  for (const point of sorted) {
    accumulated += point.value;
    itemsToHalf += 1;
    if (accumulated >= total / 2) break;
  }

  const quintileSize = Math.max(1, Math.ceil(sorted.length * 0.2));
  const quintileSum = sorted
    .slice(0, quintileSize)
    .reduce((acc, p) => acc + p.value, 0);

  return {
    topShare: round((sorted[0].value / total) * 100),
    itemsToHalf,
    topQuintileShare: round((quintileSum / total) * 100),
    total: round(total),
  };
}

/** Maior e menor ponto de uma série categórica (dia da semana, hora, canal…). */
export function extremes(points: Point[]): { best: Point; worst: Point } | null {
  const clean = points.filter((p) => Number.isFinite(p.value));
  if (clean.length < 2) return null;

  const sorted = [...clean].sort((a, b) => b.value - a.value);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
