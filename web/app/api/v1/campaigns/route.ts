import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  channel: z.enum(["WHATSAPP", "EMAIL", "SMS"]).default("WHATSAPP"),
  audience: z.record(z.any()).optional(),
  content: z.record(z.any()).optional(),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit(`campaigns:${ctx.session.user.id}`, 120, 60);

  const items = await prisma.campaign.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit(`campaigns:create:${ctx.session.user.id}`, 60, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const campaign = await prisma.campaign.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      channel: parsed.data.channel,
      status: "DRAFT",
      audience: parsed.data.audience || {},
      content: parsed.data.content || {},
      metrics: {
        queued: 0,
        sent: 0,
        failed: 0,
      },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
});