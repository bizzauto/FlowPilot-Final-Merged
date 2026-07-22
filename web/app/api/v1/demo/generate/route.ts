import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

const firstNames = ["Aarav", "Priya", "Rohan", "Sara", "Vikram", "Neha", "Arjun", "Ananya"];
const lastNames = ["Sharma", "Verma", "Mehta", "Khan", "Iyer", "Kapoor", "Singh", "Patel"];
const stages = ["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON"];
const tags = ["Hot", "Warm", "Cold"];

function randomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export const POST = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit(`demo:generate:${ctx.session.user.id}`, 5, 60);

  const contacts = [];

  for (let i = 0; i < 12; i++) {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;

    contacts.push({
      organizationId: ctx.organizationId,
      name,
      email: `contact${i + 1}@example.com`,
      phone: `+9198765${String(10000 + i).slice(0, 5)}`,
      stage: randomItem(stages),
      score: Math.floor(Math.random() * 100),
      tags: [randomItem(tags)],
    });
  }

  await prisma.contact.createMany({
    data: contacts,
  });

  await prisma.campaign.createMany({
    data: [
      {
        organizationId: ctx.organizationId,
        name: "Diwali Sale",
        channel: "WHATSAPP",
        status: "DRAFT",
        content: { message: "Hello {{name}}, Diwali offer is live." },
      },
      {
        organizationId: ctx.organizationId,
        name: "Newsletter",
        channel: "EMAIL",
        status: "DRAFT",
        content: { message: "Monthly newsletter content." },
      },
    ],
  });

  await prisma.workflow.createMany({
    data: [
      {
        organizationId: ctx.organizationId,
        name: "New Lead Follow-up",
        trigger: "contact.created",
        steps: [{ type: "send_whatsapp", body: "Hi {{name}}, thanks for connecting." }],
        active: true,
      },
      {
        organizationId: ctx.organizationId,
        name: "No Reply Reminder",
        trigger: "whatsapp.message.inbound",
        steps: [{ type: "wait", value: 1, unit: "hours" }],
        active: true,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    generated: {
      contacts: contacts.length,
      campaigns: 2,
      workflows: 2,
    },
  });
});