import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const updateSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use hex color like #4f46e5")
    .optional()
    .or(z.literal("")),
  customDomain: z.string().optional().or(z.literal("")),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "settings.read");
  await rateLimit(`whitelabel:read:${ctx.session.user.id}`, 60, 60);

  const organization = await prisma.organization.findFirst({
    where: { id: ctx.organizationId },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      customDomain: true,
    },
  });

  return NextResponse.json(organization);
});

export const PUT = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "settings.write");
  await rateLimit(`whitelabel:write:${ctx.session.user.id}`, 30, 60);

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const organization = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: {
      logoUrl: parsed.data.logoUrl || null,
      primaryColor: parsed.data.primaryColor || null,
      customDomain: parsed.data.customDomain || null,
    },
  });

  return NextResponse.json(organization);
});