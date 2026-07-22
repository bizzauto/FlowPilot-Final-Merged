import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  trigger: z.string().min(1).max(120),
  steps: z.array(z.any()).default([]),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "workflows.read");
  await rateLimit(`workflows:${ctx.session.user.id}`, 120, 60);

  const items = await prisma.workflow.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "workflows.write");
  await rateLimit(`workflows:create:${ctx.session.user.id}`, 60, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const workflow = await prisma.workflow.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      trigger: parsed.data.trigger,
      steps: parsed.data.steps || [],
      active: true,
    },
  });

  return NextResponse.json(workflow, { status: 201 });
});