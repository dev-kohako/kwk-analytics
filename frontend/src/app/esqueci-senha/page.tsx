"use client";

import { useState } from "react";
import Link from "next/link";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { MailCheck, Send } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PEDIR_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pedir, { loading }] = useMutation(PEDIR_RESET);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    try {
      await pedir({ variables: { email } });
      setEnviado(true);
    } catch (err) {
      setErro((err as Error).message || "Não foi possível enviar o link.");
    }
  };

  /**
   * A confirmação é a mesma exista ou não a conta.
   *
   * Dizer "e-mail não encontrado" transformaria esta tela num verificador de
   * quem tem cadastro na plataforma.
   */
  if (enviado) {
    return (
      <AuthShell
        titulo="Verifique seu e-mail"
        descricao="Se existir uma conta com esse endereço, o link chegou lá."
        rodape={
          <Link href="/entrar" className="font-medium text-foreground underline">
            Voltar para entrar
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <MailCheck className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            O link vale por 30 minutos. Não chegou? Confira a caixa de spam ou
            peça de novo em alguns instantes.
          </p>
          <Button variant="outline" size="sm" onClick={() => setEnviado(false)}>
            Usar outro e-mail
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo="Esqueci a senha"
      descricao="Enviamos um link para você criar uma nova."
      rodape={
        <>
          Lembrou?{" "}
          <Link href="/entrar" className="font-medium text-foreground underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submeter} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail da conta</Label>
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

        {erro && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {loading ? "Enviando..." : "Enviar link"}
        </Button>
      </form>
    </AuthShell>
  );
}
