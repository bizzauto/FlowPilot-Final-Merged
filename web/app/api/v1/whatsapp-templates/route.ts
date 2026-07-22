import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  language: z.string().default("en_US"),
  category: z.string().default("MARKETING"),
  body: z.string().min(1).max(2000),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "templates.read");
  await rateLimit(`templates:${ctx.session.user.id}`, 120, 60);

  const items = await prisma.whatsAppTemplate.findMany({
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
  requirePermission(ctx.role, "templates.write");
  await rateLimit(`templates:create:${ctx.session.user.id}`, 60, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const template = await prisma.whatsAppTemplate.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      language: parsed.data.language,
      category: parsed.data.category,
      body: parsed.data.body,
      status: "DRAFT",
    },
  });

  return NextResponse.json(template, { status: 201 });
});