import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "analytics.read");
  await rateLimit(`analytics:${ctx.session.user.id}`, 120, 60);

  const where = {
    organizationId: ctx.organizationId,
  };

  const [
    contacts,
    conversations,
    messages,
    campaigns,
    workflows,
    recentContacts,
  ] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.conversation.count({ where }),
    prisma.message.count({ where }),
    prisma.campaign.count({ where }),
    prisma.workflow.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    stats: [
      { label: "Contacts", value: String(contacts) },
      { label: "Conversations", value: String(conversations) },
      { label: "Messages", value: String(messages) },
      { label: "Campaigns", value: String(campaigns) },
      { label: "Automations", value: String(workflows) },
    ],
    recentContacts,
  });
});