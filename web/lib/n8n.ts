import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function sendToN8n(event: string, payload: Record<string, unknown>) {
  const url = process.env.N8N_EVENT_WEBHOOK_URL;

  if (!url) return;

  const body = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-flowpilot-event": event,
  };

  const secret = process.env.N8N_SHARED_SECRET;

  if (secret) {
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["x-flowpilot-signature"] = `sha256=${signature}`;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    logger.warn({ error, event }, "Failed to send event to n8n");
  }
}