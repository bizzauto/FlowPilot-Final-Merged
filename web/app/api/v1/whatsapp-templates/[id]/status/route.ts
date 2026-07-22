import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]),
});

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "templates.write");
  await rateLimit(`templates:status:${ctx.session.user.id}`, 60, 60);

  const id = context.params.id;

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const template = await prisma.whatsAppTemplate.findFirst({
    where: {
      id,
      organizationId: ctx.organizationId,
    },
  });

  if (!template) {
    throw new ApiError(404, "Template not found", "NOT_FOUND");
  }

  const updated = await prisma.whatsAppTemplate.update({
    where: { id: template.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
});