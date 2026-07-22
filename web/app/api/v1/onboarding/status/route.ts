import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "analytics.read");
  await rateLimit(`onboarding:${ctx.session.user.id}`, 60, 60);

  let dbOk = true;
  let redisOk = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  try {
    await redis.ping();
  } catch {
    redisOk = false;
  }

  let contacts = 0;
  let apiKeys = 0;

  try {
    [contacts, apiKeys] = await Promise.all([
      prisma.contact.count({
        where: { organizationId: ctx.organizationId },
      }),
      prisma.apiKey.count({
        where: {
          organizationId: ctx.organizationId,
          revokedAt: null,
        },
      }),
    ]);
  } catch {}

  const tasks = [
    {
      label: "Database connected",
      done: dbOk,
    },
    {
      label: "Redis connected",
      done: redisOk,
    },
    {
      label: "NextAuth secret set",
      done: Boolean(process.env.NEXTAUTH_SECRET),
    },
    {
      label: "WhatsApp configured",
      done: Boolean(
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
          process.env.WHATSAPP_ACCESS_TOKEN
      ),
    },
    {
      label: "Stripe configured",
      done: Boolean(
        process.env.STRIPE_SECRET_KEY &&
          process.env.STRIPE_WEBHOOK_SECRET
      ),
    },
    {
      label: "n8n webhook configured",
      done: Boolean(process.env.N8N_EVENT_WEBHOOK_URL),
    },
    {
      label: "At least one contact created",
      done: contacts > 0,
    },
    {
      label: "At least one API key created",
      done: apiKeys > 0,
    },
  ];

  const completed = tasks.filter((task) => task.done).length;

  return NextResponse.json({
    completed,
    total: tasks.length,
    tasks,
  });
});