import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const messageQueue = new Queue("messages", { connection });
export const campaignQueue = new Queue("campaigns", { connection });
export const automationQueue = new Queue("automations", { connection });
export const emailQueue = new Queue("emails", { connection });