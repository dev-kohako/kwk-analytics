import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { getAccessToken } from "@/lib/session";

/**
 * Cliente Apollo.
 *
 * O token entra por link de contexto, lido a cada requisição em vez de ser
 * fixado na criação do cliente — assim entrar ou sair passa a valer na
 * chamada seguinte, sem recriar o cliente nem recarregar a página.
 */
export function createApolloClient(token?: string | null) {
  const http = new HttpLink({
    uri: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/",
  });

  const auth = setContext((_, { headers }) => {
    const atual = getAccessToken() ?? token;

    return {
      headers: {
        ...headers,
        ...(atual ? { authorization: `Bearer ${atual}` } : {}),
      },
    };
  });

  return new ApolloClient({
    link: auth.concat(http),
    cache: new InMemoryCache(),
  });
}
