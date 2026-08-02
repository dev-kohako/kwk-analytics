"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { KeyRound, LogOut, Monitor, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateSmart } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const PERFIL = gql`
  query Perfil {
    me {
      id
      name
      email
      createdAt
      plan {
        code
        name
        status
        trialEndsAt
      }
      usage {
        metric
        used
        limit
        remaining
      }
    }
    activeSessions {
      id
      userAgent
      createdAt
      expiresAt
    }
  }
`;

const ATUALIZAR = gql`
  mutation UpdateProfile($name: String!) {
    updateProfile(name: $name)
  }
`;

const TROCAR_SENHA = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

const SAIR_DE_TUDO = gql`
  mutation LogoutAll {
    logoutAll
  }
`;

/** Nome de métrica em linguagem de quem usa, não a chave do banco. */
const ROTULO: Record<string, string> = {
  analyses: "Análises hoje",
  aiInsights: "Insights de IA no mês",
  exports: "Exportações no mês",
  dashboards: "Dashboards salvos",
};

const STATUS: Record<string, string> = {
  active: "Ativo",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
};

function Consumo({
  metric,
  used,
  limit,
}: {
  metric: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const perto = limit !== null && pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span>{ROTULO[metric] ?? metric}</span>
        <span className="tabular-nums text-muted-foreground">
          {used}
          {limit === null ? " (ilimitado)" : ` de ${limit}`}
        </span>
      </div>

      {limit !== null && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ROTULO[metric] ?? metric}
        >
          <div
            className={perto ? "h-full bg-amber-500" : "h-full bg-primary"}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const { sair } = useAuth();
  const { data, loading, refetch } = useQuery<any>(PERFIL, {
    fetchPolicy: "network-only",
  });

  const [nome, setNome] = useState("");
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");

  const [atualizar, { loading: salvando }] = useMutation(ATUALIZAR);
  const [trocarSenha, { loading: trocando }] = useMutation(TROCAR_SENHA);
  const [sairDeTudo] = useMutation(SAIR_DE_TUDO);

  useEffect(() => {
    if (data?.me?.name) setNome(data.me.name);
  }, [data?.me?.name]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-6 py-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </main>
    );
  }

  const me = data?.me;
  const sessoes = data?.activeSessions ?? [];

  const salvarNome = async () => {
    try {
      await atualizar({ variables: { name: nome } });
      toast.success("Nome atualizado.");
      refetch();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const salvarSenha = async () => {
    try {
      await trocarSenha({
        variables: { currentPassword: atual, newPassword: nova },
      });
      toast.success("Senha alterada.");
      setAtual("");
      setNova("");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const encerrarTudo = async () => {
    await sairDeTudo().catch(() => undefined);
    toast.success("Todas as sessões foram encerradas.");
    await sair();
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sua conta</h1>
        <p className="text-sm text-muted-foreground">
          Dados, plano, consumo e acessos.
        </p>
      </header>

      <Card>
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-base font-semibold">Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              {/* Trocar e-mail exigiria reverificação; é fluxo próprio. */}
              <Input id="email" value={me?.email ?? ""} disabled />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Conta criada em {formatDateSmart(me?.createdAt)}
            </p>
            <Button
              size="sm"
              onClick={salvarNome}
              disabled={salvando || !nome.trim() || nome === me?.name}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 px-6 py-5">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Plano {me?.plan?.name ?? "Gratuito"}
            </CardTitle>
            {me?.plan?.trialEndsAt && (
              <p className="text-sm text-muted-foreground">
                Teste até {formatDateSmart(me.plan.trialEndsAt)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">
              {STATUS[me?.plan?.status] ?? me?.plan?.status ?? "Ativo"}
            </Badge>
            <Link href="/planos">
              <Button size="sm" variant="outline">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Ver planos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-0">
          {(me?.usage ?? []).map((u: any) => (
            <Consumo
              key={u.metric}
              metric={u.metric}
              used={u.used}
              limit={u.limit}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-base font-semibold">Trocar senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="atual">Senha atual</Label>
              <Input
                id="atual"
                type="password"
                autoComplete="current-password"
                value={atual}
                onChange={(e) => setAtual(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nova">Nova senha</Label>
              <Input
                id="nova"
                type="password"
                autoComplete="new-password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={salvarSenha}
            disabled={trocando || !atual || nova.length < 8}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-6 py-5">
          <CardTitle className="text-base font-semibold">
            Acessos abertos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 pt-0">
          {sessoes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão registrada.
            </p>
          ) : (
            sessoes.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Monitor
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 text-sm">
                  <p className="truncate">{s.userAgent ?? "Dispositivo"}</p>
                  <p className="text-muted-foreground">
                    Desde {formatDateSmart(s.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Encerrar tudo também derruba esta sessão — é o ponto de usar. */}
          <Button variant="outline" size="sm" onClick={encerrarTudo}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Encerrar todas as sessões
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
