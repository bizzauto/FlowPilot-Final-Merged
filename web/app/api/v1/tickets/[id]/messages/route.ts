import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  body: z.string().min(1).max(4000),
});

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit(`tickets:reply:${ctx.session.user.id}`, 60, 60);

  const ticket = await (prisma as any).ticket.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!ticket) {
    throw new ApiError(404, "Ticket not found", "NOT_FOUND");
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const message = await (prisma as any).ticketMessage.create({
    data: {
      ticketId: ticket.id,
      body: parsed.data.body,
      authorType: "AGENT",
    },
  });

  return NextResponse.json(message, { status: 201 });
});