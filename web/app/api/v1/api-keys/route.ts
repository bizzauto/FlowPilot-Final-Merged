import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";
import { hashApiKey } from "@/lib/api-key-auth";

const createSchema = z.object({
  name: z.string().min(1).max(80),
});

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.read");
  await rateLimit(`apikeys:${ctx.session.user.id}`, 60, 60);

  const items = await prisma.apiKey.findMany({
    where: {
      organizationId: ctx.organizationId,
      revokedAt: null,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.write");
  await rateLimit(`apikeys:create:${ctx.session.user.id}`, 20, 60);

  const json = await req.json();
  const parsed = createSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const rawKey = `fp_live_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = rawKey.slice(0, 12);
  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      prefix,
      keyHash,
      scopes: ["*"],
    },
  });

  return NextResponse.json(
    {
      id: apiKey.id,
      name: apiKey.name,
      prefix,
      key: rawKey,
      warning: "Store this key securely. It will not be shown again.",
    },
    { status: 201 }
  );
});