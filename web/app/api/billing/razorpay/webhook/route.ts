import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return new NextResponse("Webhook secret missing", { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return new NextResponse("Signature missing", { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;

      const organizationId = payment?.notes?.organizationId;
      const plan = payment?.notes?.plan || "growth";

      if (organizationId) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { plan },
        });

        await prisma.subscription.create({
          data: {
            organizationId,
            provider: "razorpay",
            subscriptionId: payment.id,
            plan,
            status: "active",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Razorpay webhook failed");
    return new NextResponse("Webhook failed", { status: 500 });
  }
}