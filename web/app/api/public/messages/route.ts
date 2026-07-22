import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";
import { handleApiError, ApiError } from "@/lib/api-error";
import { messageQueue } from "@/lib/queue";

const schema = z.object({
  contactPhone: z.string().min(7).max(20),
  message: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = await requireApiKey(req, "messages.write");
    await rateLimit(`public:messages:${apiKey.organizationId}`, 200, 60);

    const json = await req.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
    }

    const body = parsed.data;

    let contact = await prisma.contact.findFirst({
      where: {
        organizationId: apiKey.organizationId,
        phone: body.contactPhone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId: apiKey.organizationId,
          name: body.contactPhone,
          phone: body.contactPhone,
        },
      });
    }

    const consent = await prisma.consent.findFirst({
      where: {
        organizationId: apiKey.organizationId,
        contactId: contact.id,
        channel: "WHATSAPP",
      },
    });

    if (consent?.status === "OPTED_OUT") {
      throw new ApiError(400, "Contact opted out", "CONTACT_OPTED_OUT");
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId: apiKey.organizationId,
        contactId: contact.id,
        channel: "WHATSAPP",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: apiKey.organizationId,
          contactId: contact.id,
          channel: "WHATSAPP",
          status: "open",
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        organizationId: apiKey.organizationId,
        conversationId: conversation.id,
        direction: "OUTBOUND",
        body: body.message,
        status: "QUEUED",
        provider: "whatsapp",
      },
    });

    await messageQueue.add(
      "send-message",
      { messageId: message.id },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    );

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json(
      {
        success: true,
        messageId: message.id,
        contactId: contact.id,
        conversationId: conversation.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, req);
  }
}