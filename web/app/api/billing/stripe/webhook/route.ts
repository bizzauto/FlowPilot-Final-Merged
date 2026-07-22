import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return new NextResponse("Stripe not configured", { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2024-06-20",
  });

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    logger.error({ error }, "Stripe webhook signature failed");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const organizationId = session.metadata?.organizationId;
      const plan = session.metadata?.plan || "growth";

      if (organizationId) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { plan },
        });

        await prisma.subscription.create({
          data: {
            organizationId,
            provider: "stripe",
            customerId:
              typeof session.customer === "string" ? session.customer : undefined,
            subscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : undefined,
            plan,
            status: "active",
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const existing = await prisma.subscription.findFirst({
        where: {
          subscriptionId: subscription.id,
        },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { status: "canceled" },
        });

        await prisma.organization.update({
          where: { id: existing.organizationId },
          data: { plan: "starter" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "Stripe webhook processing failed");
    return new NextResponse("Webhook failed", { status: 500 });
  }
}