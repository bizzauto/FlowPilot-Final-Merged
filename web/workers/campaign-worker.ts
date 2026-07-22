import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { messageQueue, emailQueue } from "../lib/queue";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "campaigns",
  async (job) => {
    const { campaignId, organizationId } = job.data;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return;

    const audience = (campaign.audience as any) || {};
    const content = (campaign.content as any) || {};

    const where: any = { organizationId };

    if (audience.tags?.length) {
      where.tags = { hasSome: audience.tags };
    }

    if (audience.stages?.length) {
      where.stage = { in: audience.stages };
    }

    const contacts = await prisma.contact.findMany({ where });

    let queued = 0;

    for (const contact of contacts) {
      if (campaign.channel === "WHATSAPP" && contact.phone) {
        let conversation = await prisma.conversation.findFirst({
          where: {
            organizationId,
            contactId: contact.id,
            channel: "WHATSAPP",
          },
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

        const body = (content.message || "").replace(
          "{{name}}",
          contact.name || "there"
        );

        const message = await prisma.message.create({
          data: {
            organizationId,
            conversationId: conversation.id,
            direction: "OUTBOUND",
            body,
            status: "QUEUED",
            provider: "whatsapp",
          },
        });

        await messageQueue.add("send-message", { messageId: message.id }, { attempts: 3 });
        queued++;
      }

      if (campaign.channel === "EMAIL" && contact.email) {
        await emailQueue.add(
          "send-email",
          {
            organizationId,
            to: contact.email,
            subject: content.subject || campaign.name,
            body: (content.message || "").replace("{{name}}", contact.name || "there"),
          },
          { attempts: 3 }
        );

        queued++;
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "COMPLETED",
        metrics: {
          queued,
          contacts: contacts.length,
        },
      },
    });

    logger.info({ campaignId, queued }, "Campaign worker completed");
  },
  {
    connection,
    concurrency: 2,
  }
);

logger.info("Campaign worker started");