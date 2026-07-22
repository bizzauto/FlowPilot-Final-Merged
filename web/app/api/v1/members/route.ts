import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "members.read");
  await rateLimit(`members:${ctx.session.user.id}`, 60, 60);

  const items = await prisma.membership.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({
    items: items.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      active: m.active,
      createdAt: m.createdAt,
    })),
  });
});