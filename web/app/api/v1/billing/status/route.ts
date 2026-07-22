import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "billing.read");
  await rateLimit(`billing:status:${ctx.session.user.id}`, 60, 60);

  const organization = await prisma.organization.findFirst({
    where: {
      id: ctx.organizationId,
    },
    select: {
      plan: true,
      name: true,
      slug: true,
    },
  });

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    organization,
    subscription,
  });
});