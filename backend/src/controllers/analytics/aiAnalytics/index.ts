import { z } from "zod";
import { completeJSON, isAIEnabled } from "../../../lib/ai";
import type {
  AutoInsight,
  InsightSummary,
} from "../../../types/autoInsights.types";

/**
 * Camada de IA sobre os insights.
 *
 * O modelo recebe apenas o resumo agregado — nunca linhas cruas, nunca nome ou
 * id de cliente. O que ele devolve é validado com Zod e limpo de HTML antes de
 * entrar na resposta GraphQL: saída de LLM é input não confiável.
 */

const MAX_AI_INSIGHTS = 4;

const AIInsightSchema = z.object({
  title: z.string().min(3).max(80),
  message: z.string().min(10).max(320),
  type: z.enum([
    "sales",
    "channel",
    "product",
    "delivery",
    "customer",
    "seasonality",
    "concentration",
    "anomaly",
  ]),
  severity: z.enum(["positive", "info", "warning", "critical"]),
  suggestion: z.string().min(5).max(220).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const AIResponseSchema = z.object({
  insights: z.array(AIInsightSchema).max(8),
});

const SYSTEM_PROMPT = `Você é um analista de dados de food service. Recebe um resumo agregado de vendas de uma rede de restaurantes e escreve insights curtos e acionáveis para o dono do negócio.

Regras:
- Responda SEMPRE em JSON válido no formato {"insights": [...]}.
- No máximo ${MAX_AI_INSIGHTS} insights, em português do Brasil.
- Use apenas números presentes no resumo. Nunca invente valores, nomes ou períodos.
- Se um número não estiver no resumo, não fale sobre ele.
- Prefira relações entre métricas (ex.: receita subiu mas ticket médio caiu) a repetir um número isolado.
- "message" é texto puro, sem HTML e sem markdown.
- "suggestion" é uma ação concreta que o gestor pode executar nesta semana.
- "confidence" reflete o quanto o dado sustenta a afirmação (0 a 1).
- Não repita insights que já constam na lista de títulos determinísticos enviada.`;

const stripHTML = (text: string): string =>
  text
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function buildUserPrompt(
  summary: InsightSummary,
  existing: AutoInsight[]
): string {
  return [
    "RESUMO AGREGADO (valores em BRL, exceto onde indicado):",
    JSON.stringify(summary),
    "",
    "TÍTULOS JÁ GERADOS POR REGRA (não repita):",
    JSON.stringify(existing.map((insight) => insight.title)),
  ].join("\n");
}

/**
 * Enriquece a lista determinística com leituras do modelo.
 * Devolve `[]` quando a IA está desligada ou indisponível — nunca lança.
 */
export async function generateAIInsights(
  summary: InsightSummary,
  existing: AutoInsight[]
): Promise<AutoInsight[]> {
  if (!isAIEnabled()) return [];

  const result = await completeJSON({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(summary, existing),
    schema: AIResponseSchema,
  });

  if (!result) return [];

  return result.insights.slice(0, MAX_AI_INSIGHTS).map((insight, index) => ({
    id: `ai-${index + 1}`,
    title: stripHTML(insight.title),
    message: stripHTML(insight.message),
    type: insight.type,
    severity: insight.severity,
    suggestion: insight.suggestion ? stripHTML(insight.suggestion) : undefined,
    confidence: insight.confidence,
    generatedBy: "ai" as const,
  }));
}
