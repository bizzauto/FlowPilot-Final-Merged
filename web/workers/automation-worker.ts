import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { messageQueue, emailQueue, automationQueue } from "../lib/queue";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "automations",
  async (job) => {
    const { executionId, stepIndex = 0 } = job.data;

    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });

    if (!execution || execution.status !== "RUNNING") return;

    const steps = (execution.workflow.steps as any[]) || [];

    if (stepIndex >= steps.length) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
      return;
    }

    const step = steps[stepIndex];

    const contact = execution.contactId
      ? await prisma.contact.findUnique({
          where: { id: execution.contactId },
        })
      : null;

    if (step.type === "wait") {
      const value = Number(step.value || 1);
      const unit = step.unit || "minutes";

      const delay =
        unit === "hours"
          ? value * 60 * 60 * 1000
          : unit === "seconds"
          ? value * 1000
          : value * 60 * 1000;

      await automationQueue.add(
        "run-automation",
        {
          executionId,
          stepIndex: stepIndex + 1,
        },
        { delay }
      );

      return;
    }

    if (step.type === "add_tag" && contact) {
      const tag = step.tag || "Tagged";

      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          tags: Array.from(new Set([...contact.tags, tag])),
        },
      });
    }

    if (step.type === "send_whatsapp" && contact?.phone) {
      let conversation = await prisma.conversation.findFirst({
        where: {
          organizationId: execution.organizationId,
          contactId: contact.id,
          channel: "WHATSAPP",
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            organizationId: execution.organizationId,
            contactId: contact.id,
            channel: "WHATSAPP",
            status: "open",
          },
        });
      }

      const body = (step.body || "").replace("{{name}}", contact.name || "there");

      const message = await prisma.message.create({
        data: {
          organizationId: execution.organizationId,
          conversationId: conversation.id,
          direction: "OUTBOUND",
          body,
          status: "QUEUED",
          provider: "whatsapp",
        },
      });

      await messageQueue.add("send-message", { messageId: message.id }, { attempts: 3 });
    }

    if (step.type === "send_email" && contact?.email) {
      await emailQueue.add(
        "send-email",
        {
          organizationId: execution.organizationId,
          to: contact.email,
          subject: step.subject || "Message from FlowPilot",
          body: (step.body || "").replace("{{name}}", contact.name || "there"),
        },
        { attempts: 3 }
      );
    }

    await automationQueue.add(
      "run-automation",
      {
        executionId,
        stepIndex: stepIndex + 1,
      },
      { delay: 1000 }
    );
  },
  {
    connection,
    concurrency: 5,
  }
);

logger.info("Automation worker started");