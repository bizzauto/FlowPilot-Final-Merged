import { NextResponse } from "next/server";
import { z } from "zod";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.enum(["growth", "agency"]),
});

const plans: Record<string, { amount: number; name: string }> = {
  growth: {
    amount: 4999,
    name: "Growth",
  },
  agency: {
    amount: 14999,
    name: "Agency",
  },
};

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit(`razorpay:order:${ctx.session.user.id}`, 10, 60);

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new ApiError(400, "Razorpay is not configured", "RAZORPAY_MISSING");
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const plan = plans[parsed.data.plan];

  const receipt = `receipt_${ctx.organizationId.slice(0, 8)}_${Date.now()}`;

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: plan.amount * 100,
      currency: "INR",
      receipt,
      notes: {
        organizationId: ctx.organizationId,
        plan: parsed.data.plan,
      },
    }),
  });

  const order = await response.json();

  if (!response.ok) {
    throw new ApiError(400, order?.error?.description || "Razorpay order failed", "RAZORPAY_ORDER_FAILED");
  }

  return NextResponse.json({
    order,
    keyId,
    plan: parsed.data.plan,
  });
});