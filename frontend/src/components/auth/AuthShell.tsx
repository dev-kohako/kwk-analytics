"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Moldura das telas de conta.
 *
 * Fica fora do grupo com barra lateral: quem ainda não entrou não tem para
 * onde navegar, e mostrar um menu inacessível só confunde.
 */
export function AuthShell({
  titulo,
  descricao,
  children,
  rodape,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  rodape: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        KWK Analytics
      </Link>

      <Card>
        <CardContent className="space-y-6 px-6 py-8">
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
            <p className="text-sm text-muted-foreground">{descricao}</p>
          </div>

          {children}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">{rodape}</p>
    </main>
  );
}
