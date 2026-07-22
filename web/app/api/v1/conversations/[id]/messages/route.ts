import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";
import { messageQueue } from "@/lib/queue";

const sendSchema = z.object({
  message: z.string().min(1).max(4000),
});

export const GET = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "conversations.read");
  await rateLimit(`messages:${ctx.session.user.id}`, 120, 60);

  const conversationId = context.params.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId: ctx.organizationId,
    },
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found", "NOT_FOUND");
  }

  const items = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "conversations.write");
  await rateLimit(`messages:send:${ctx.session.user.id}`, 120, 60);

  const conversationId = context.params.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId: ctx.organizationId,
    },
    include: {
      contact: true,
    },
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found", "NOT_FOUND");
  }

  const json = await req.json();
  const parsed = sendSchema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  const consent = await prisma.consent.findFirst({
    where: {
      organizationId: ctx.organizationId,
      contactId: conversation.contactId,
      channel: "WHATSAPP",
    },
  });

  if (consent?.status === "OPTED_OUT") {
    throw new ApiError(400, "Contact opted out", "OPTED_OUT");
  }

  const message = await prisma.message.create({
    data: {
      organizationId: ctx.organizationId,
      conversationId: conversation.id,
      direction: "OUTBOUND",
      body: parsed.data.message,
      status: "QUEUED",
      provider: "whatsapp",
    },
  });

  await messageQueue.add(
    "send-message",
    { messageId: message.id },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
});