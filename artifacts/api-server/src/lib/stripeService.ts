import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Lazily constructs the Stripe client so the server can still boot (and every other feature
 * keeps working) when STRIPE_SECRET_KEY isn't set yet — mirrors how emailService.ts treats a
 * missing RESEND_API_KEY as a configuration gap to surface to the caller, not a crash.
 */
export function getStripeClient(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cachedClient;
}
