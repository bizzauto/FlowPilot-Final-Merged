import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const createSchema = z.object({
  subject: z.string().min(1).max(180),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  contactId: z.string().optional(),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.read");
  await rateLimit(`tickets:list:${ctx.session.user.id}`, 120, 60);

  const items = await (prisma as any).ticket.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit(`tickets:create:${ctx.session.user.id}`, 30, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const ticket = await (prisma as any).ticket.create({
    data: {
      organizationId: ctx.organizationId,
      subject: parsed.data.subject,
      priority: parsed.data.priority || "MEDIUM",
      contactId: parsed.data.contactId,
      messages: parsed.data.description
        ? {
            create: {
              body: parsed.data.description,
              authorType: "USER",
            },
          }
        : undefined,
    },
  });

  return NextResponse.json(ticket, { status: 201 });
});