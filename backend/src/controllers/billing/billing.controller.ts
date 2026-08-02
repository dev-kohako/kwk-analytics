import prisma from "../../lib/prisma";
import { AppError } from "../../utils/errors";
import { getStripe, isStripeConfigured, priceIdDoPlano } from "../../lib/stripe";

/**
 * Assinaturas.
 *
 * O estado real da assinatura vem do webhook, nunca do retorno do checkout:
 * quem volta para a página de sucesso pode ter fechado o navegador antes, e
 * quem não voltou pode ter pago. Só o evento do Stripe é confiável.
 */

const appUrl = (): string =>
  (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

export async function listPlans() {
  const planos = await prisma.$queryRaw<
    Array<{
      code: string;
      name: string;
      price_cents: number;
      currency: string;
      trial_days: number;
      limits: unknown;
    }>
  >`
    SELECT code, name, price_cents, currency, trial_days, limits
    FROM plan WHERE is_public = true ORDER BY price_cents;
  `;

  return planos.map((p) => ({
    code: p.code,
    name: p.name,
    priceCents: p.price_cents,
    currency: p.currency,
    trialDays: p.trial_days,
    limits: p.limits ?? {},
  }));
}

/** Cria (ou reaproveita) o cliente no Stripe, para não duplicar cadastro. */
async function clienteStripe(userId: number): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new AppError("Cobrança não configurada.", 503);

  const [existente] = await prisma.$queryRaw<Array<{ id: string | null }>>`
    SELECT stripe_customer_id AS id FROM subscription
    WHERE user_id = ${userId} AND stripe_customer_id IS NOT NULL
    LIMIT 1;
  `;

  if (existente?.id) return existente.id;

  const user = await prisma.app_user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Conta não encontrada.", 404);

  const criado = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: String(userId) },
  });

  await prisma.$executeRaw`
    UPDATE subscription SET stripe_customer_id = ${criado.id}, updated_at = now()
    WHERE user_id = ${userId};
  `;

  return criado.id;
}

export async function createCheckout(
  userId: number,
  planCode: string
): Promise<string> {
  if (!isStripeConfigured()) {
    throw new AppError(
      "A cobrança ainda não está configurada nesta instalação.",
      503
    );
  }

  if (planCode === "free") {
    throw new AppError("O plano gratuito não precisa de checkout.", 400);
  }

  const price = priceIdDoPlano(planCode);
  if (!price) {
    throw new AppError(`Plano "${planCode}" sem preço configurado.`, 400);
  }

  const [plano] = await prisma.$queryRaw<Array<{ trial_days: number }>>`
    SELECT trial_days FROM plan WHERE code = ${planCode} LIMIT 1;
  `;

  const stripe = getStripe();
  const sessao = await stripe!.checkout.sessions.create({
    mode: "subscription",
    customer: await clienteStripe(userId),
    line_items: [{ price, quantity: 1 }],
    subscription_data:
      plano?.trial_days > 0 ? { trial_period_days: plano.trial_days } : undefined,
    success_url: `${appUrl()}/perfil?assinatura=ok`,
    cancel_url: `${appUrl()}/planos?assinatura=cancelada`,
    // Amarra a sessão à conta: o webhook chega sem contexto de quem pediu.
    metadata: { userId: String(userId), planCode },
  });

  if (!sessao.url) throw new AppError("Falha ao abrir o checkout.", 502);
  return sessao.url;
}

/** Portal do Stripe: trocar cartão, ver faturas e cancelar sem passar por aqui. */
export async function createBillingPortal(userId: number): Promise<string> {
  if (!isStripeConfigured()) {
    throw new AppError("A cobrança ainda não está configurada.", 503);
  }

  const stripe = getStripe();
  const sessao = await stripe!.billingPortal.sessions.create({
    customer: await clienteStripe(userId),
    return_url: `${appUrl()}/perfil`,
  });

  return sessao.url;
}

/**
 * Aplica o evento recebido do Stripe.
 *
 * Só o webhook muda plano ou status. Confiar no redirect de sucesso deixaria
 * a assinatura pendurada quando alguém fecha a aba depois de pagar.
 */
export async function aplicarEventoStripe(evento: {
  type: string;
  data: { object: any };
}): Promise<void> {
  const obj = evento.data.object;

  if (evento.type === "checkout.session.completed") {
    const userId = Number(obj.metadata?.userId);
    const planCode = obj.metadata?.planCode;
    if (!userId || !planCode) return;

    await prisma.$executeRaw`
      UPDATE subscription
      SET plan_code = ${planCode},
          status = 'active',
          stripe_subscription_id = ${obj.subscription ?? null},
          stripe_customer_id = ${obj.customer ?? null},
          updated_at = now()
      WHERE user_id = ${userId};
    `;
    return;
  }

  if (
    evento.type === "customer.subscription.updated" ||
    evento.type === "customer.subscription.deleted"
  ) {
    // Assinatura cancelada volta para o gratuito, não deixa a conta sem plano.
    const cancelada =
      evento.type === "customer.subscription.deleted" ||
      obj.status === "canceled";

    // Cancelada volta para o gratuito; caso contrário mantém o plano atual.
    await prisma.$executeRaw`
      UPDATE subscription
      SET status = ${cancelada ? "canceled" : (obj.status ?? "active")},
          plan_code = CASE WHEN ${cancelada} THEN 'free' ELSE plan_code END,
          current_period_end = CASE
            WHEN ${obj.current_period_end ?? null}::bigint IS NULL THEN current_period_end
            ELSE to_timestamp(${obj.current_period_end ?? 0}::bigint)
          END,
          cancel_at_period_end = ${Boolean(obj.cancel_at_period_end)},
          updated_at = now()
      WHERE stripe_subscription_id = ${obj.id};
    `;
  }
}
