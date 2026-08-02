import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Compass,
  Lightbulb,
  ShieldCheck,
  Table2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Página de entrada.
 *
 * Explica para que serve a plataforma antes de pedir qualquer coisa de quem
 * chega. Fica fora do grupo (dashboard) de propósito: sem barra lateral, sem
 * consulta ao banco, sem estado — é conteúdo estático e por isso carrega
 * instantâneo.
 */

export const metadata = {
  title: "KWK Analytics — analytics para quem toca restaurante",
  description:
    "Monte análises, acompanhe indicadores e receba leituras automáticas da sua operação, sem escrever SQL.",
};

const RECURSOS = [
  {
    icon: Lightbulb,
    titulo: "Leituras automáticas",
    texto:
      "A plataforma compara os últimos 30 dias com os 30 anteriores e aponta o que mudou: canal em queda, dia fora do padrão, receita concentrada em poucos produtos.",
  },
  {
    icon: Table2,
    titulo: "Análise sem SQL",
    texto:
      "Escolha o que quer medir e como separar. A consulta é montada para você — e fica visível, se quiser conferir de onde veio cada número.",
  },
  {
    icon: BarChart3,
    titulo: "Dashboards salvos",
    texto:
      "Guarde a análise que importa e reabra quando precisar, com gráficos, indicadores e comparação de período.",
  },
];

const PRINCIPIOS = [
  {
    icon: ShieldCheck,
    titulo: "Número com origem",
    texto:
      "Indicador sem lastro no dado não aparece na tela. Nada é estimado para preencher espaço.",
  },
  {
    icon: Clock,
    titulo: "Resposta rápida",
    texto:
      "As consultas leem uma tabela pré-agregada, então o resultado chega sem espera mesmo com anos de histórico.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <section className="space-y-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          KWK Analytics
        </span>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Seus dados de venda respondendo o que você precisa decidir
        </h1>

        <p className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground">
          Você já tem os números — em cada canal, cada loja, cada pedido. O que
          falta é a leitura. Esta plataforma junta tudo e mostra o que mudou na
          sua operação, sem depender de planilha nem de quem escreva SQL.
        </p>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link href="/painel">
            <Button size="lg" className="w-full sm:w-auto">
              Ver minha operação
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/explorar">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              <Compass className="h-4 w-4" aria-hidden="true" />
              Montar uma análise
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:mt-24 sm:grid-cols-3">
        {RECURSOS.map(({ icon: Icon, titulo, texto }) => (
          <Card key={titulo} className="h-full">
            <CardContent className="space-y-3 px-6 py-6">
              <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 className="font-semibold">{titulo}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {texto}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        {PRINCIPIOS.map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="flex gap-3 rounded-lg border p-5">
            <Icon
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">{titulo}</h2>
              <p className="text-sm text-muted-foreground">{texto}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-16 border-t pt-6 text-center text-sm text-muted-foreground">
        KWK Analytics — analytics para operações de food service.
      </footer>
    </main>
  );
}
