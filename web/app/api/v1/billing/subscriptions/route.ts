import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "billing.read");
  await rateLimit(`billing:subscriptions:${ctx.session.user.id}`, 60, 60);

  const organization = await prisma.organization.findFirst({
    where: {
      id: ctx.organizationId,
    },
    select: {
      name: true,
      slug: true,
      plan: true,
    },
  });

  const subscriptions = await prisma.subscription.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    organization,
    subscriptions,
  });
});