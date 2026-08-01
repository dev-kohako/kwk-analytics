import { z } from "zod";

/**
 * Camada de IA provider-agnóstica.
 *
 * Fala o dialeto OpenAI `/chat/completions`, que é o mesmo exposto pelas opções
 * gratuitas. Basta uma chave: o provedor é inferido dela, e `AI_BASE_URL` /
 * `AI_MODEL` sobrescrevem qualquer preset.
 *
 * Contrato: nenhuma função daqui lança. Falha de rede, timeout, cota estourada
 * ou resposta fora do formato devolvem `null`, e quem chama cai no caminho
 * determinístico.
 */

export type AIProvider =
  | "groq"
  | "gemini"
  | "openrouter"
  | "ollama"
  | "deepseek";

interface Preset {
  baseUrl: string;
  model: string;
  /** Provedores locais não exigem chave. */
  keyless?: boolean;
}

/** `baseUrl` já inclui o segmento de versão — só falta `/chat/completions`. */
const PRESETS: Record<AIProvider, Preset> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    keyless: true,
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
};

/** Cada provedor aceita a sua própria variável de chave, além de AI_API_KEY. */
const KEY_BY_PROVIDER: Record<AIProvider, string[]> = {
  groq: ["GROQ_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  ollama: ["OLLAMA_API_KEY"],
  deepseek: ["DEEPSEEK_API_KEY"],
};

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_TOKENS = 900;

export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
}

const env = (name: string): string | undefined =>
  process.env[name]?.trim() || undefined;

/** Provedor explícito, ou inferido pela chave que estiver presente. */
function resolveProvider(): AIProvider {
  const explicit = env("AI_PROVIDER")?.toLowerCase();
  if (explicit && explicit in PRESETS) return explicit as AIProvider;

  for (const provider of Object.keys(PRESETS) as AIProvider[]) {
    if (KEY_BY_PROVIDER[provider].some((name) => env(name))) return provider;
  }

  return "groq";
}

function resolveKey(provider: AIProvider): string | undefined {
  const specific = KEY_BY_PROVIDER[provider]
    .map((name) => env(name))
    .find(Boolean);

  return env("AI_API_KEY") || specific;
}

export function getAIConfig(): AIConfig {
  const provider = resolveProvider();
  const preset = PRESETS[provider];
  const key = resolveKey(provider);
  const turnedOff = env("AI_ENABLED") === "false";

  return {
    enabled: (Boolean(key) || Boolean(preset.keyless)) && !turnedOff,
    provider,
    baseUrl: (env("AI_BASE_URL") || preset.baseUrl).replace(/\/+$/, ""),
    model: env("AI_MODEL") || preset.model,
    timeoutMs: Number(env("AI_TIMEOUT_MS") || DEFAULT_TIMEOUT_MS),
    maxTokens: Number(env("AI_MAX_TOKENS") || DEFAULT_MAX_TOKENS),
  };
}

export const isAIEnabled = (): boolean => getAIConfig().enabled;

/** Lista legível para o log de boot e para a documentação. */
export const listProviders = (): string[] => Object.keys(PRESETS);

/** Modelos gostam de embrulhar JSON em ```json — desembrulha antes de parsear. */
function extractJSON(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Última tentativa: recorta do primeiro { ou [ até o fechamento correspondente.
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

interface CompleteArgs<T> {
  system: string;
  user: string;
  /** A saída do modelo é validada antes de sair daqui — resposta de LLM é input não confiável. */
  schema: z.ZodType<T>;
  temperature?: number;
}

export async function completeJSON<T>({
  system,
  user,
  schema,
  temperature = 0.2,
}: CompleteArgs<T>): Promise<T | null> {
  const config = getAIConfig();
  if (!config.enabled) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${resolveKey(config.provider) ?? "local"}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature,
        max_tokens: config.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(
        `[ai] ${config.provider} respondeu ${response.status} — usando fallback determinístico.`
      );
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = schema.safeParse(extractJSON(content));
    if (!parsed.success) {
      console.warn("[ai] resposta fora do schema esperado — usando fallback.");
      return null;
    }

    return parsed.data;
  } catch (err) {
    const reason =
      (err as Error)?.name === "AbortError" ? "timeout" : "erro de rede";
    console.warn(`[ai] ${reason} ao consultar ${config.provider} — usando fallback.`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
