"use client";

import { useCallback, useEffect, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  onSessionChange,
  renovarSessao,
  setSession,
} from "@/lib/session";

/**
 * Sessão do usuário na interface.
 *
 * Ao montar, tenta renovar a partir do refresh guardado: sem isso a pessoa
 * seria deslogada a cada recarga, já que o token de acesso vive só em memória.
 */

const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        name
        email
      }
    }
  }
`;

const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        name
        email
      }
    }
  }
`;

const LOGOUT = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

type Sessao = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
};

export function useAuth() {
  const client = useApolloClient();
  const [autenticado, setAutenticado] = useState<boolean>(() =>
    Boolean(getAccessToken())
  );
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const parar = onSessionChange(() => setAutenticado(Boolean(getAccessToken())));

    renovarSessao().finally(() => {
      setAutenticado(Boolean(getAccessToken()));
      setCarregando(false);
    });

    return parar;
  }, []);

  const [registerMutation, registerState] = useMutation<{ register: Sessao }>(
    REGISTER
  );
  const [loginMutation, loginState] = useMutation<{ login: Sessao }>(LOGIN);
  const [logoutMutation] = useMutation(LOGOUT);

  const aplicar = useCallback(
    async (s: Sessao) => {
      setSession(s.accessToken, s.refreshToken);
      // O cache guarda respostas da sessão anterior; trocar de conta sem
      // limpar mostraria dados de quem saiu para quem entrou.
      await client.resetStore().catch(() => undefined);
    },
    [client]
  );

  const registrar = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const { data } = await registerMutation({ variables: { input } });
      if (data?.register) await aplicar(data.register);
      return Boolean(data?.register);
    },
    [registerMutation, aplicar]
  );

  const entrar = useCallback(
    async (input: { email: string; password: string }) => {
      const { data } = await loginMutation({ variables: { input } });
      if (data?.login) await aplicar(data.login);
      return Boolean(data?.login);
    },
    [loginMutation, aplicar]
  );

  const sair = useCallback(async () => {
    const refreshToken = getRefreshToken();

    // Revoga no servidor antes de limpar aqui; se a chamada falhar, a sessão
    // local some do mesmo jeito — ficar logado após pedir para sair é pior.
    if (refreshToken) {
      await logoutMutation({ variables: { refreshToken } }).catch(
        () => undefined
      );
    }

    clearSession();
    await client.resetStore().catch(() => undefined);
  }, [logoutMutation, client]);

  return {
    autenticado,
    carregando,
    registrar,
    entrar,
    sair,
    enviando: registerState.loading || loginState.loading,
  };
}
