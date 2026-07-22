import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "emails",
  async (job) => {
    const { to, subject, body } = job.data;

    if (!to) {
      return;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || "FlowPilot <hello@yourdomain.com>";

    if (!apiKey) {
      logger.info({ to, subject }, "Email worker: RESEND_API_KEY missing, email logged only");
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html: body,
      }),
    });

    if (!response.ok) {
      const data = await response.text();
      throw new Error(`Email send failed: ${data}`);
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

logger.info("Email worker started");