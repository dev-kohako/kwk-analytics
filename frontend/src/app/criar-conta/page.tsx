"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const MIN_SENHA = 8;

export default function CriarContaPage() {
  const router = useRouter();
  const { registrar, enviando } = useAuth();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const senhaCurta = senha.length > 0 && senha.length < MIN_SENHA;

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < MIN_SENHA) {
      return setErro(`A senha precisa ter ao menos ${MIN_SENHA} caracteres.`);
    }

    try {
      const ok = await registrar({ name: nome, email, password: senha });
      if (!ok) return setErro("Não foi possível criar a conta.");

      toast.success("Conta criada. Bem-vindo.");
      router.push("/painel");
    } catch (err) {
      setErro((err as Error).message || "Não foi possível criar a conta.");
    }
  };

  return (
    <AuthShell
      titulo="Criar conta"
      descricao="Comece no plano gratuito. Sem cartão."
      rodape={
        <>
          Já tem conta?{" "}
          <Link href="/entrar" className="font-medium text-foreground underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            autoComplete="name"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como podemos te chamar"
          />
        </div>

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
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="ajuda-senha"
            aria-invalid={senhaCurta}
          />
          {/* Diz a regra antes de a pessoa errar, em vez de recusar depois. */}
          <p
            id="ajuda-senha"
            className={
              senhaCurta
                ? "text-sm text-red-600 dark:text-red-400"
                : "text-sm text-muted-foreground"
            }
          >
            Ao menos {MIN_SENHA} caracteres. Uma frase longa protege mais que
            símbolos.
          </p>
        </div>

        {erro && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {enviando ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
