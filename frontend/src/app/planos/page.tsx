"use client";

import Link from "next/link";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const PLANOS = gql`
  query Planos {
    plans {
      code
      name
      priceCents
      currency
      trialDays
      limits
    }
  }
`;

const CHECKOUT = gql`
  mutation CreateCheckout($planCode: String!) {
    createCheckout(planCode: $planCode)
  }
`;

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Cada limite vira uma frase, na ordem em que importa para decidir. */
const LINHAS: Array<{ chave: string; texto: (v: number | null) => string }> = [
  {
    chave: "dashboards",
    texto: (v) => (v === null ? "Dashboards ilimitados" : `${v} dashboards`),
  },
  {
    chave: "analysesPerDay",
    texto: (v) =>
      v === null ? "Análises ilimitadas" : `${v} análises por dia`,
  },
  {
    chave: "aiInsightsPerMonth",
    texto: (v) =>
      v === null ? "Insights de IA ilimitados" : `${v} insights de IA por mês`,
  },
  {
    chave: "exportsPerMonth",
    texto: (v) =>
      v === null ? "Exportações ilimitadas" : `${v} exportações por mês`,
  },
];

export default function PlanosPage() {
  const { autenticado } = useAuth();
  const { data, loading } = useQuery<any>(PLANOS);
  const [checkout, { loading: abrindo }] = useMutation(CHECKOUT);

  const assinar = async (code: string) => {
    try {
      const res = await checkout({ variables: { planCode: code } });
      const url = (res.data as any)?.createCheckout;

      // A ida ao Stripe é o próprio checkout; não há tela intermediária aqui.
      if (url) window.location.href = url;
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar
      </Link>

      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Planos
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Comece no gratuito, sem cartão. O limite existe para conter abuso, não
          para atrapalhar quem está começando.
        </p>
      </header>

      {loading ? (
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </section>
      ) : (
        <section className="mt-12 grid gap-4 sm:grid-cols-3">
          {(data?.plans ?? []).map((p: any) => {
            const gratuito = p.priceCents === 0;
            const destaque = p.code === "pro";
            const limites = (p.limits ?? {}) as Record<string, number | null>;

            return (
              <Card
                key={p.code}
                className={cn(
                  "flex h-full flex-col",
                  destaque && "border-primary shadow-md"
                )}
              >
                <CardContent className="flex flex-1 flex-col gap-5 px-6 py-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{p.name}</h2>
                      {destaque && <Badge>Mais escolhido</Badge>}
                    </div>

                    <p className="text-3xl font-bold tracking-tight tabular-nums">
                      {gratuito ? "Grátis" : brl.format(p.priceCents / 100)}
                      {!gratuito && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /mês
                        </span>
                      )}
                    </p>

                    {p.trialDays > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {p.trialDays} dias grátis para testar
                      </p>
                    )}
                  </div>

                  <ul className="flex-1 space-y-2">
                    {LINHAS.map(({ chave, texto }) => (
                      <li key={chave} className="flex items-start gap-2 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        {texto(limites[chave] ?? null)}
                      </li>
                    ))}
                  </ul>

                  {gratuito ? (
                    <Link href={autenticado ? "/painel" : "/criar-conta"}>
                      <Button variant="outline" className="w-full">
                        {autenticado ? "Seu plano atual" : "Começar de graça"}
                      </Button>
                    </Link>
                  ) : autenticado ? (
                    <Button
                      className="w-full"
                      variant={destaque ? "default" : "outline"}
                      onClick={() => assinar(p.code)}
                      disabled={abrindo}
                    >
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      {abrindo ? "Abrindo..." : "Assinar"}
                    </Button>
                  ) : (
                    // Sem conta não há o que cobrar: criar vem antes de assinar.
                    <Link href="/criar-conta">
                      <Button
                        className="w-full"
                        variant={destaque ? "default" : "outline"}
                      >
                        Criar conta
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Cancele quando quiser. Ao cancelar, a conta volta para o plano gratuito
        e os dados continuam acessíveis.
      </p>
    </main>
  );
}
