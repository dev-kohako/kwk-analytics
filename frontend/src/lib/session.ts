"use client";

/**
 * Sessão no cliente.
 *
 * O token de acesso fica em memória e o refresh no localStorage. Guardar o de
 * acesso só na memória reduz a janela de exposição: ele dura 15 minutos e é
 * recriado a partir do refresh quando a página recarrega.
 */

const CHAVE_REFRESH = "kwk.refresh";

let accessToken: string | null = null;
const ouvintes = new Set<() => void>();

const avisar = () => ouvintes.forEach((fn) => fn());

export const getAccessToken = (): string | null => accessToken;

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE_REFRESH);
}

export function setSession(access: string, refresh?: string): void {
  accessToken = access;
  if (refresh && typeof window !== "undefined") {
    window.localStorage.setItem(CHAVE_REFRESH, refresh);
  }
  avisar();
}

export function clearSession(): void {
  accessToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CHAVE_REFRESH);
  }
  avisar();
}

/** Permite a interface reagir a entrar e sair sem recarregar a página. */
export function onSessionChange(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

const endpoint = (): string =>
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/";

/**
 * Troca o refresh por um novo token de acesso.
 *
 * Chamado no carregamento da página e quando o servidor responde
 * UNAUTHENTICATED — é o que mantém a pessoa logada entre visitas sem deixar
 * um token de longa duração circulando em cada requisição.
 */
export async function renovarSessao(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;

  try {
    const resposta = await fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `mutation($t:String!){ refreshSession(refreshToken:$t) }`,
        variables: { t: refresh },
      }),
    });

    const json = await resposta.json();
    const novo = json?.data?.refreshSession;

    if (typeof novo !== "string") {
      clearSession();
      return false;
    }

    setSession(novo);
    return true;
  } catch {
    return false;
  }
}
