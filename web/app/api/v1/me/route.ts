import { NextResponse } from "next/server";
import { secureApi } from "@/lib/secure-api";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  await rateLimit(`me:${ctx.session.user.id}`, 60, 60);

  return NextResponse.json({
    user: ctx.session.user,
    organizationId: ctx.organizationId,
    role: ctx.role,
  });
});