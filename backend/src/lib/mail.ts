import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envio de e-mail.
 *
 * Sem SMTP configurado o envio não falha: a mensagem vai para o console. Isso
 * mantém o fluxo de redefinição testável em desenvolvimento sem obrigar
 * ninguém a ter servidor de e-mail — e deixa claro no log que não saiu de
 * verdade, em vez de fingir que saiu.
 */

export interface Mensagem {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null = null;
let avisado = false;

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT || 587);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 é TLS implícito; as demais portas usam STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendMail(msg: Mensagem): Promise<boolean> {
  const client = getTransporter();

  if (!client) {
    if (!avisado) {
      console.warn(
        "[mail] SMTP não configurado — mensagens serão impressas no console."
      );
      avisado = true;
    }

    console.info(
      [
        "──────── e-mail não enviado (sem SMTP) ────────",
        `para:    ${msg.to}`,
        `assunto: ${msg.subject}`,
        "",
        msg.text,
        "───────────────────────────────────────────────",
      ].join("\n")
    );

    return false;
  }

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    });

    return true;
  } catch (err) {
    // Falha de envio não pode derrubar o cadastro nem a redefinição: quem
    // chamou já gravou o que precisava e a pessoa pode pedir de novo.
    console.error(`[mail] falha ao enviar: ${(err as Error).message}`);
    return false;
  }
}
