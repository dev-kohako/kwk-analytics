import { z } from "zod";
import { completeJSON, getAIConfig, isAIEnabled } from "../src/lib/ai";
import { generateAIInsights } from "../src/controllers/analytics/aiAnalytics";
import type { InsightSummary } from "../src/types/autoInsights.types";

const AI_ENV_KEYS = [
  "AI_API_KEY",
  "AI_PROVIDER",
  "DEEPSEEK_API_KEY",
  "GROQ_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "OPENROUTER_API_KEY",
  "OLLAMA_API_KEY",
  "AI_ENABLED",
  "AI_BASE_URL",
  "AI_MODEL",
];

const summary: InsightSummary = {
  window: { currentDays: 30, previousDays: 30 },
  revenue: { current: 1000, previous: 900, deltaPercent: 11.11 },
  orders: { current: 20, previous: 18, deltaPercent: 11.11 },
  averageTicket: { current: 50, previous: 50, deltaPercent: 0 },
  dailyRevenue: [],
  channels: [],
  products: [],
  weekdays: [],
  deliveryMinutes: { current: null, previous: null },
};

describe("camada de IA", () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of AI_ENV_KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of AI_ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
    jest.restoreAllMocks();
  });

  it("fica desligada quando não há chave configurada", () => {
    expect(isAIEnabled()).toBe(false);
    expect(getAIConfig().enabled).toBe(false);
  });

  it("liga ao encontrar qualquer uma das chaves aceitas", () => {
    process.env.GROQ_API_KEY = "chave-de-teste";
    expect(isAIEnabled()).toBe(true);
  });

  it("infere o provedor a partir da chave presente", () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    const config = getAIConfig();

    expect(config.provider).toBe("gemini");
    expect(config.model).toBe("gemini-2.0-flash");
    expect(config.baseUrl).toContain("generativelanguage.googleapis.com");
  });

  it("permite Ollama local sem chave nenhuma", () => {
    process.env.AI_PROVIDER = "ollama";
    const config = getAIConfig();

    expect(config.enabled).toBe(true);
    expect(config.baseUrl).toBe("http://localhost:11434/v1");
  });

  it("deixa AI_BASE_URL e AI_MODEL sobrescreverem o preset", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.AI_API_KEY = "chave-de-teste";
    process.env.AI_BASE_URL = "http://meu-proxy/v1";
    process.env.AI_MODEL = "modelo-custom";

    const config = getAIConfig();
    expect(config.baseUrl).toBe("http://meu-proxy/v1");
    expect(config.model).toBe("modelo-custom");
  });

  it("respeita AI_ENABLED=false mesmo com chave presente", () => {
    process.env.AI_API_KEY = "chave-de-teste";
    process.env.AI_ENABLED = "false";
    expect(isAIEnabled()).toBe(false);
  });

  it("não chama a rede quando está desligada", async () => {
    const fetchSpy = jest.spyOn(global, "fetch" as never);

    const result = await completeJSON({
      system: "s",
      user: "u",
      schema: z.object({ ok: z.boolean() }),
    });

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("devolve null quando o provedor responde erro", async () => {
    process.env.AI_API_KEY = "chave-de-teste";
    jest
      .spyOn(global, "fetch" as never)
      .mockResolvedValue({ ok: false, status: 429 } as never);

    const result = await completeJSON({
      system: "s",
      user: "u",
      schema: z.object({ ok: z.boolean() }),
    });

    expect(result).toBeNull();
  });

  it("rejeita resposta do modelo fora do schema", async () => {
    process.env.AI_API_KEY = "chave-de-teste";
    jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"insights":[{"title":"x"}]}' } }],
      }),
    } as never);

    expect(await generateAIInsights(summary, [])).toEqual([]);
  });

  it("aceita JSON embrulhado em bloco de código e limpa HTML", async () => {
    process.env.AI_API_KEY = "chave-de-teste";
    const payload = {
      insights: [
        {
          title: "<b>Receita em alta</b>",
          message: "A receita subiu 11,1% <script>alert(1)</script> no período.",
          type: "sales",
          severity: "positive",
          suggestion: "Reforce o estoque dos itens mais vendidos.",
          confidence: 0.8,
        },
      ],
    };

    jest.spyOn(global, "fetch" as never).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: "```json\n" + JSON.stringify(payload) + "\n```" } },
        ],
      }),
    } as never);

    const insights = await generateAIInsights(summary, []);

    expect(insights).toHaveLength(1);
    expect(insights[0].generatedBy).toBe("ai");
    expect(insights[0].title).toBe("Receita em alta");
    expect(insights[0].message).not.toMatch(/<[^>]+>/);
    expect(insights[0].message).not.toContain("script");
  });

  it("devolve lista vazia quando a chamada estoura o tempo", async () => {
    process.env.AI_API_KEY = "chave-de-teste";
    jest.spyOn(global, "fetch" as never).mockImplementation((() => {
      const err = new Error("aborted");
      err.name = "AbortError";
      return Promise.reject(err);
    }) as never);

    expect(await generateAIInsights(summary, [])).toEqual([]);
  });
});
