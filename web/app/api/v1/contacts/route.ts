import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(20).optional(),
  stage: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const GET = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.read");
  await rateLimit(`contacts:list:${ctx.session.user.id}`, 120, 60);

  const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const { page, limit, search } = parsed.data;
  const skip = (page - 1) * limit;

  const where: any = { organizationId: ctx.organizationId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit(`contacts:create:${ctx.session.user.id}`, 120, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const body = parsed.data;

  const contact = await prisma.contact.create({
    data: {
      organizationId: ctx.organizationId,
      name: body.name,
      email: body.email?.toLowerCase(),
      phone: body.phone,
      stage: body.stage || "NEW",
      score: body.score || 0,
      tags: body.tags || [],
    },
  });

  return NextResponse.json(contact, { status: 201 });
});