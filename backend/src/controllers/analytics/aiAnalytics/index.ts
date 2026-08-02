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

const TIPOS = [
  "sales",
  "channel",
  "product",
  "delivery",
  "customer",
  "seasonality",
  "concentration",
  "anomaly",
] as const;

const SEVERIDADES = ["positive", "info", "warning", "critical"] as const;

/**
 * Tolerante de propósito.
 *
 * Modelo de linguagem erra rótulo: devolve "revenue" onde o enum espera
 * "sales", ou "medium" onde espera "warning". Rejeitar o lote inteiro por
 * causa disso desperdiça a chamada e some com insights bons. O que precisa ser
 * rígido é o essencial — título e mensagem — e o resto cai num padrão.
 */
const AIInsightSchema = z.object({
  title: z.string().min(3).max(120),
  message: z.string().min(10).max(400),
  type: z.string().optional(),
  severity: z.string().optional(),
  suggestion: z.string().max(300).optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

/** O envelope é permissivo; a validação real acontece item a item. */
const AIResponseSchema = z.object({
  insights: z.array(z.unknown()).default([]),
});

const asType = (v: unknown) =>
  (TIPOS as readonly string[]).includes(String(v))
    ? (v as (typeof TIPOS)[number])
    : ("sales" as const);

const asSeverity = (v: unknown) =>
  (SEVERIDADES as readonly string[]).includes(String(v))
    ? (v as (typeof SEVERIDADES)[number])
    : ("info" as const);

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

  // Item a item: um insight malformado não derruba os outros. Rótulo fora do
  // esperado — "revenue" no lugar de "sales" — cai no padrão em vez de
  // invalidar a resposta inteira.
  const validos: AutoInsight[] = [];

  for (const item of result.insights ?? []) {
    const parsed = AIInsightSchema.safeParse(item);
    if (!parsed.success) continue;

    const { title, message, suggestion, confidence, type, severity } =
      parsed.data;

    validos.push({
      id: `ai-${validos.length + 1}`,
      title: stripHTML(title),
      message: stripHTML(message),
      type: asType(type),
      severity: asSeverity(severity),
      suggestion: suggestion ? stripHTML(suggestion) : undefined,
      confidence,
      generatedBy: "ai",
    });

    if (validos.length === MAX_AI_INSIGHTS) break;
  }

  return validos;
}
