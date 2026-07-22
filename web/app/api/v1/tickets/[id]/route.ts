import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const GET = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "contacts.read");
  await rateLimit(`tickets:read:${ctx.session.user.id}`, 120, 60);

  const ticket = await (prisma as any).ticket.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found", "NOT_FOUND");
  }

  return NextResponse.json(ticket);
});