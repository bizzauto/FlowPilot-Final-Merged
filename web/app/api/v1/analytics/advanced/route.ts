import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "analytics.read");
  await rateLimit(`analytics:advanced:${ctx.session.user.id}`, 60, 60);

  const where = {
    organizationId: ctx.organizationId,
  };

  const [stageFunnel, messageStatus, channelSplit, contactsByDay] = await Promise.all([
    prisma.contact.groupBy({
      by: ["stage"],
      where,
      _count: true,
    }),
    prisma.message.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.conversation.groupBy({
      by: ["channel"],
      where,
      _count: true,
    }),
    prisma.$queryRaw`
      SELECT DATE("createdAt")::text as date, COUNT(*)::int as count
      FROM "Contact"
      WHERE "organizationId" = ${ctx.organizationId}
        AND "createdAt" >= NOW() - INTERVAL '14 days'
      GROUP BY DATE("createdAt")
      ORDER BY date
    `,
  ]);

  return NextResponse.json({
    stageFunnel,
    messageStatus,
    channelSplit,
    contactsByDay,
  });
});