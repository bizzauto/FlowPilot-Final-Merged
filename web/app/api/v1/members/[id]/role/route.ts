import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  role: z.enum(["OWNER", "ADMIN", "AGENT", "VIEWER"]),
});

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "members.write");
  await rateLimit(`members:role:${ctx.session.user.id}`, 30, 60);

  const membershipId = context.params.id;

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: ctx.organizationId,
    },
  });

  if (!membership) {
    throw new ApiError(404, "Member not found", "NOT_FOUND");
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ success: true });
});