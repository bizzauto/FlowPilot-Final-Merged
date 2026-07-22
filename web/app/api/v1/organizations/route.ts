import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "organizations.read");
  await rateLimit(`organizations:${ctx.session.user.id}`, 60, 60);

  const memberships = await prisma.membership.findMany({
    where: {
      userId: ctx.session.user.id,
      active: true,
    },
    include: {
      organization: true,
    },
  });

  const items = memberships.map((m) => ({
    id: m.organizationId,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    active: m.active,
  }));

  return NextResponse.json({
    items,
    current: ctx.organizationId,
  });
});