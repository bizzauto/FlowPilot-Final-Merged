import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "apikeys.write");
  await rateLimit(`apikeys:revoke:${ctx.session.user.id}`, 20, 60);

  const id = context.params.id;

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      organizationId: ctx.organizationId,
    },
  });

  if (!apiKey) {
    throw new ApiError(404, "API key not found", "NOT_FOUND");
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
});