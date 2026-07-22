import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, dashes"),
  plan: z.string().optional(),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "agency.read");
  await rateLimit(`agency:clients:${ctx.session.user.id}`, 60, 60);

  const clients = await prisma.organization.findMany({
    where: {
      parentId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items: clients });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "agency.write");
  await rateLimit(`agency:create:${ctx.session.user.id}`, 20, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (existing) {
    throw new ApiError(400, "Slug already exists", "SLUG_TAKEN");
  }

  const client = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      plan: parsed.data.plan || "starter",
      parentId: ctx.organizationId,
    },
  });

  await prisma.membership.create({
    data: {
      userId: ctx.session.user.id,
      organizationId: client.id,
      role: "OWNER",
      active: true,
    },
  });

  return NextResponse.json(client, { status: 201 });
});