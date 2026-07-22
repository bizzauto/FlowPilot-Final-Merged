import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyMetaSignature } from "@/lib/whatsapp/signature";
import { sendToN8n } from "@/lib/n8n";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (!verifyMetaSignature(rawBody, signature)) {
      logger.warn("Invalid WhatsApp webhook signature");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (value?.statuses?.length) {
      for (const status of value.statuses) {
        const statusMap: Record<string, string> = {
          sent: "SENT",
          delivered: "DELIVERED",
          read: "READ",
          failed: "FAILED",
        };

        const newStatus = statusMap[status.status];

        if (newStatus) {
          await prisma.message.updateMany({
            where: {
              externalId: status.id,
              provider: "whatsapp",
            },
            data: {
              status: newStatus,
              errorMessage: status.errors?.[0]?.message || null,
            },
          });
        }
      }

      return NextResponse.json({ received: true });
    }

    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ received: true });
    }

    const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

    if (!organizationId) {
      logger.warn("DEFAULT_ORGANIZATION_ID is not set");
      return NextResponse.json({ received: true });
    }

    const existing = await prisma.incomingEvent.findUnique({
      where: {
        provider_externalId: {
          provider: "whatsapp",
          externalId: message.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ received: true });
    }

    await prisma.incomingEvent.create({
      data: {
        provider: "whatsapp",
        externalId: message.id,
        raw: body,
      },
    });

    const fromPhone = message.from;

    let contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone: fromPhone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId,
          name: fromPhone,
          phone: fromPhone,
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId,
        contactId: contact.id,
        channel: "WHATSAPP",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId,
          contactId: contact.id,
          channel: "WHATSAPP",
          status: "open",
        },
      });
    }

    let text = "";

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "image") {
      text = message.image?.caption || "[Image received]";
    } else if (message.type === "audio") {
      text = "[Audio received]";
    } else if (message.type === "video") {
      text = message.video?.caption || "[Video received]";
    } else if (message.type === "document") {
      text = message.document?.caption || "[Document received]";
    } else if (message.type === "location") {
      text = "[Location received]";
    } else {
      text = `[${message.type} message]`;
    }

    const lower = text.toLowerCase();

    if (lower.includes("stop") || lower.includes("unsubscribe") || lower.includes("opt out")) {
      await prisma.consent.upsert({
        where: {
          organizationId_contactId_channel: {
            organizationId,
            contactId: contact.id,
            channel: "WHATSAPP",
          },
        },
        update: {
          status: "OPTED_OUT",
          optOutReason: "User requested stop",
        },
        create: {
          organizationId,
          contactId: contact.id,
          channel: "WHATSAPP",
          status: "OPTED_OUT",
          optOutReason: "User requested stop",
        },
      });

      await sendToN8n("whatsapp.contact.opted_out", {
        organizationId,
        contactId: contact.id,
        phone: fromPhone,
        message: text,
      });
    }

    const savedMessage = await prisma.message.create({
      data: {
        organizationId,
        conversationId: conversation.id,
        direction: "INBOUND",
        body: text,
        mediaUrl: message.image?.url || message.video?.url || null,
        status: "DELIVERED",
        externalId: message.id,
        provider: "whatsapp",
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    await sendToN8n("whatsapp.message.inbound", {
      organizationId,
      contactId: contact.id,
      conversationId: conversation.id,
      messageId: savedMessage.id,
      phone: fromPhone,
      name: contact.name,
      message: text,
      channel: "whatsapp",
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, "WhatsApp webhook failed");
    return NextResponse.json({ received: true });
  }
}