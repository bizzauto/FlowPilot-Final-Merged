import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "conversations.read");
  await rateLimit(`conversations:${ctx.session.user.id}`, 120, 60);

  const items = await prisma.conversation.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    include: {
      contact: true,
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    take: 100,
  });

  return NextResponse.json({ items });
});