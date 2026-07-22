import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit(`billing:cancel:${ctx.session.user.id}`, 10, 60);

  const subscription = await prisma.subscription.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found", "NOT_FOUND");
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled" },
  });

  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { plan: "starter" },
  });

  return NextResponse.json({ success: true });
});