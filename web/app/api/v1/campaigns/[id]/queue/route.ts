import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { campaignQueue } from "@/lib/queue";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit(`campaigns:queue:${ctx.session.user.id}`, 30, 60);

  const campaignId = context.params.id;

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      organizationId: ctx.organizationId,
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "NOT_FOUND");
  }

  await campaignQueue.add(
    "send-campaign",
    {
      campaignId: campaign.id,
      organizationId: ctx.organizationId,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ success: true, campaignId: campaign.id });
});