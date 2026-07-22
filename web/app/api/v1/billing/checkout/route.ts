import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.enum(["growth", "agency"]),
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit(`billing:checkout:${ctx.session.user.id}`, 10, 60);

  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new ApiError(400, "Stripe is not configured", "STRIPE_MISSING");
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const priceId =
    parsed.data.plan === "agency"
      ? process.env.STRIPE_PRICE_AGENCY
      : process.env.STRIPE_PRICE_GROWTH;

  if (!priceId) {
    throw new ApiError(400, "Stripe price ID missing", "PRICE_MISSING");
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2024-06-20",
  });

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings/billing?success=true`,
    cancel_url: `${appUrl}/settings/billing?canceled=true`,
    metadata: {
      organizationId: ctx.organizationId,
      plan: parsed.data.plan,
    },
  });

  return NextResponse.json({ url: session.url });
});