import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  plan: z.enum(["growth", "agency"]),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit(`razorpay:verify:${ctx.session.user.id}`, 10, 60);

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new ApiError(400, "Razorpay is not configured", "RAZORPAY_MISSING");
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parsed.data.razorpay_order_id}|${parsed.data.razorpay_payment_id}`)
    .digest("hex");

  if (expected !== parsed.data.razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature", "INVALID_SIGNATURE");
  }

  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { plan: parsed.data.plan },
  });

  await prisma.subscription.create({
    data: {
      organizationId: ctx.organizationId,
      provider: "razorpay",
      subscriptionId: parsed.data.razorpay_payment_id,
      plan: parsed.data.plan,
      status: "active",
    },
  });

  return NextResponse.json({ success: true });
});