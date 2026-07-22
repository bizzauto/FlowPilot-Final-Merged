import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "messages",
  async (job) => {
    const { messageId } = job.data;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { contact: true },
        },
      },
    });

    if (!message) {
      logger.warn({ messageId }, "Message not found");
      return;
    }

    if (!message.conversation.contact.phone) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          errorMessage: "Contact has no phone number",
        },
      });
      return;
    }

    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          errorMessage: "WhatsApp credentials missing",
        },
      });
      return;
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.conversation.contact.phone,
          type: "text",
          text: { body: message.body },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          errorMessage: JSON.stringify(data),
        },
      });
      throw new Error("WhatsApp send failed");
    }

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        externalId: data.messages?.[0]?.id,
      },
    });
  },
  {
    connection,
    concurrency: 5,
  }
);

logger.info("Message worker started");