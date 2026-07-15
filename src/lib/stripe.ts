import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const stripe = new Stripe(STRIPE_SECRET_KEY ?? "sk_test_missing", {
  apiVersion: "2026-06-24.dahlia",
});
