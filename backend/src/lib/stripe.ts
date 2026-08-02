import Stripe from "stripe";

/**
 * Cliente do Stripe.
 *
 * Opcional como a IA e o Redis: sem chave configurada, a plataforma continua
 * funcionando no plano gratuito e as operações de cobrança recusam com uma
 * mensagem clara, em vez de quebrar no meio.
 */

let cliente: Stripe | null = null;

export const isStripeConfigured = (): boolean =>
  Boolean(process.env.STRIPE_SECRET_KEY);

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (cliente) return cliente;

  cliente = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    // Fixar a versão evita que uma mudança na API do Stripe altere o
    // comportamento sem nenhuma alteração deste repositório.
    apiVersion: "2025-10-29.clover" as Stripe.LatestApiVersion,
  });

  return cliente;
}

/** Preço configurado por plano. Sem isso não há o que enviar ao checkout. */
export const priceIdDoPlano = (code: string): string | undefined =>
  process.env[`STRIPE_PRICE_${code.toUpperCase()}`];
