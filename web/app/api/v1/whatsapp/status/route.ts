import { NextResponse } from "next/server";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "conversations.read");
  await rateLimit(`whatsapp:status:${ctx.session.user.id}`, 60, 60);

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  return NextResponse.json({
    connected: Boolean(phoneNumberId && accessToken),
    webhookUrl: `${process.env.NEXTAUTH_URL || ""}/api/whatsapp/webhook`,
    phoneNumberIdSet: Boolean(phoneNumberId),
    accessTokenSet: Boolean(accessToken),
    verifyTokenSet: Boolean(verifyToken),
    appSecretSet: Boolean(appSecret),
  });
});