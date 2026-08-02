"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_SENHA = 8;

const REDEFINIR = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password)
  }
`;

function Formulario() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [redefinir, { loading }] = useMutation(REDEFINIR);

  const curta = senha.length > 0 && senha.length < MIN_SENHA;
  const divergem = confirmacao.length > 0 && senha !== confirmacao;

  // Sem token não há o que redefinir — chegar aqui direto é link truncado.
  if (!token) {
    return (
      <AuthShell
        titulo="Link inválido"
        descricao="Este endereço não traz um código de redefinição."
        rodape={
          <Link
            href="/esqueci-senha"
            className="font-medium text-foreground underline"
          >
            Pedir um novo link
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <ShieldAlert className="h-10 w-10 text-amber-500" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Abra o link direto do e-mail que recebeu. Se ele já passou de 30
            minutos, peça outro.
          </p>
        </div>
      </AuthShell>
    );
  }

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (senha.length < MIN_SENHA) {
      return setErro(`A senha precisa ter ao menos ${MIN_SENHA} caracteres.`);
    }

    if (senha !== confirmacao) {
      return setErro("As duas senhas não são iguais.");
    }

    try {
      await redefinir({ variables: { token, password: senha } });

      // Redefinir encerra as sessões abertas, então o caminho é entrar de novo.
      toast.success("Senha alterada. Entre com a nova.");
      router.push("/entrar");
    } catch (err) {
      setErro((err as Error).message || "Não foi possível redefinir a senha.");
    }
  };

  return (
    <AuthShell
      titulo="Nova senha"
      descricao="Escolha uma senha para voltar a acessar sua conta."
      rodape={
        <Link href="/entrar" className="font-medium text-foreground underline">
          Voltar para entrar
        </Link>
      }
    >
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="senha">Nova senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            aria-describedby="ajuda-senha"
            aria-invalid={curta}
          />
          <p
            id="ajuda-senha"
            className={
              curta
                ? "text-sm text-red-600 dark:text-red-400"
                : "text-sm text-muted-foreground"
            }
          >
            Ao menos {MIN_SENHA} caracteres.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmacao">Repita a senha</Label>
          <Input
            id="confirmacao"
            type="password"
            autoComplete="new-password"
            required
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            aria-invalid={divergem}
          />
          {divergem && (
            <p className="text-sm text-red-600 dark:text-red-400">
              As duas senhas não são iguais.
            </p>
          )}
        </div>

        {erro && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {erro}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || curta || divergem}
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </AuthShell>
  );
}

/** useSearchParams exige Suspense para não forçar a página inteira a dinâmica. */
export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <Formulario />
    </Suspense>
  );
}
