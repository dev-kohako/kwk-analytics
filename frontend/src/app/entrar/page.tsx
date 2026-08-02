"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function EntrarPage() {
  const router = useRouter();
  const { entrar, enviando } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    try {
      const ok = await entrar({ email, password: senha });
      if (!ok) return setErro("Não foi possível entrar. Tente de novo.");

      toast.success("Bem-vindo de volta.");
      router.push("/painel");
    } catch (err) {
      // A mensagem do servidor já é feita para ser lida por quem usa.
      setErro((err as Error).message || "Não foi possível entrar.");
    }
  };

  return (
    <AuthShell
      titulo="Entrar"
      descricao="Acesse sua operação."
      rodape={
        <>
          Ainda não tem conta?{" "}
          <Link href="/criar-conta" className="font-medium text-foreground underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@restaurante.com.br"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-sm text-muted-foreground underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
