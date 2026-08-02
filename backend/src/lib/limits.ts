import prisma from "../lib/prisma";
import { AppError } from "../utils/errors";

/**
 * Limites por plano.
 *
 * Duas regras: limite ausente ou nulo significa ilimitado, e o contador é
 * incrementado depois da operação dar certo. Cobrar por tentativa que falhou
 * é injusto e vira reclamação de suporte.
 */

export type Metrica = "analyses" | "aiInsights" | "exports" | "dashboards";

/** Cada métrica tem a chave do limite e a janela em que é contada. */
const CONFIG: Record<
  Metrica,
  { chave: string; janela: "dia" | "mes" | "total"; rotulo: string }
> = {
  analyses: { chave: "analysesPerDay", janela: "dia", rotulo: "análises" },
  aiInsights: {
    chave: "aiInsightsPerMonth",
    janela: "mes",
    rotulo: "insights de IA",
  },
  exports: { chave: "exportsPerMonth", janela: "mes", rotulo: "exportações" },
  dashboards: { chave: "dashboards", janela: "total", rotulo: "dashboards" },
};

const chaveJanela = (janela: "dia" | "mes" | "total"): string => {
  if (janela === "total") return "total";
  const hoje = new Date().toISOString();
  return janela === "dia" ? hoje.slice(0, 10) : hoje.slice(0, 7);
};

export interface Consumo {
  metrica: Metrica;
  usado: number;
  limite: number | null;
  restante: number | null;
}

async function limitesDoPlano(userId: number): Promise<Record<string, unknown>> {
  const [linha] = await prisma.$queryRaw<Array<{ limits: unknown }>>`
    SELECT p.limits
    FROM subscription s
    JOIN plan p ON p.code = s.plan_code
    WHERE s.user_id = ${userId}
      AND s.status IN ('trialing', 'active', 'past_due')
    LIMIT 1;
  `;

  // Sem assinatura ativa cai no gratuito, em vez de liberar tudo por omissão.
  if (!linha) {
    const [free] = await prisma.$queryRaw<Array<{ limits: unknown }>>`
      SELECT limits FROM plan WHERE code = 'free' LIMIT 1;
    `;
    return (free?.limits as Record<string, unknown>) ?? {};
  }

  return (linha.limits as Record<string, unknown>) ?? {};
}

async function usoAtual(
  userId: number,
  metrica: Metrica,
  janela: string
): Promise<number> {
  const [linha] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT count FROM usage_counter
    WHERE user_id = ${userId} AND metric = ${metrica} AND window_key = ${janela}
    LIMIT 1;
  `;

  return Number(linha?.count ?? 0);
}

export async function consumo(userId: number): Promise<Consumo[]> {
  const limites = await limitesDoPlano(userId);

  return Promise.all(
    (Object.keys(CONFIG) as Metrica[]).map(async (metrica) => {
      const { chave, janela } = CONFIG[metrica];
      const bruto = limites[chave];
      const limite = typeof bruto === "number" ? bruto : null;
      const usado = await usoAtual(userId, metrica, chaveJanela(janela));

      return {
        metrica,
        usado,
        limite,
        restante: limite === null ? null : Math.max(0, limite - usado),
      };
    })
  );
}

/** Recusa antes de executar quando o limite já foi atingido. */
export async function exigirDentroDoLimite(
  userId: number,
  metrica: Metrica
): Promise<void> {
  const { chave, janela, rotulo } = CONFIG[metrica];
  const limites = await limitesDoPlano(userId);
  const bruto = limites[chave];

  if (typeof bruto !== "number") return; // ausente ou null = ilimitado

  const usado = await usoAtual(userId, metrica, chaveJanela(janela));
  if (usado < bruto) return;

  const periodo =
    janela === "dia" ? "hoje" : janela === "mes" ? "neste mês" : "no seu plano";

  throw new AppError(
    `Você atingiu o limite de ${bruto} ${rotulo} ${periodo}. Mude de plano para continuar.`,
    429
  );
}

/** Incrementa depois do sucesso. Falha aqui não desfaz o que já foi entregue. */
export async function registrarUso(
  userId: number,
  metrica: Metrica
): Promise<void> {
  const janela = chaveJanela(CONFIG[metrica].janela);

  try {
    await prisma.$executeRaw`
      INSERT INTO usage_counter (user_id, metric, window_key, count, updated_at)
      VALUES (${userId}, ${metrica}, ${janela}, 1, now())
      ON CONFLICT (user_id, metric, window_key)
      DO UPDATE SET count = usage_counter.count + 1, updated_at = now();
    `;
  } catch (err) {
    console.warn(`[limits] falha ao contar ${metrica}: ${(err as Error).message}`);
  }
}
