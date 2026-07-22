import fs from "fs";
import path from "path";

const root = process.cwd();

function write(file, content) {
  const fullPath = path.join(root, file);

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, fullPath + ".bak");
  }

  fs.writeFileSync(fullPath, content);
  console.log("WROTE: " + file);
}

const files = {};

files["../docs/REAL-MODULES.md"] = `
# Real Feature Modules

Added modules:

1. Evolution QR connect real flow
2. IndiaMART / TradeIndia lead import connector
3. Poster PNG rendering
4. Broadcast queue with rate limiting
5. Drip scheduler
6. Automation trigger listener

Environment variables to add in .env:

WHATSAPP_PROVIDER=EVOLUTION
EVOLUTION_API_URL=http://your-evolution-server:8080
EVOLUTION_API_KEY=your-evolution-api-key
EVOLUTION_INSTANCE=flowpilot

LEAD_WEBHOOK_TOKEN=create_a_secret_token

For Meta WhatsApp:

WHATSAPP_PROVIDER=META
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

Pages:

/leads
/leads/import
/posters
/broadcast-advanced
/drip
/settings/whatsapp-evolution

Webhook endpoints:

/api/v1/connectors/indiamart?organizationId=ORG_ID&token=YOUR_TOKEN
/api/v1/connectors/tradeindia?organizationId=ORG_ID&token=YOUR_TOKEN
/api/v1/connectors/apify?organizationId=ORG_ID&token=YOUR_TOKEN
/api/v1/evolution/webhook

Poster PNG:

/api/v1/posters/POSTER_ID/png
`;

files["lib/queue.ts"] = `
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const messageQueue = new Queue("messages", { connection });
export const campaignQueue = new Queue("campaigns", { connection });
export const automationQueue = new Queue("automations", { connection });
export const emailQueue = new Queue("emails", { connection });
export const broadcastAdvancedQueue = new Queue("broadcasts-advanced", { connection });
export const dripQueue = new Queue("drip", { connection });
export const leadSyncQueue = new Queue("lead-sync", { connection });
export const posterQueue = new Queue("posters", { connection });
`;

files["lib/whatsapp/provider.ts"] = `
export type WhatsAppProviderName = "META" | "EVOLUTION";

export interface SendTextPayload {
  to: string;
  text: string;
  instanceId?: string;
}

export interface SendImagePayload {
  to: string;
  imageUrl: string;
  caption?: string;
  instanceId?: string;
}

export interface WhatsAppProvider {
  name: WhatsAppProviderName;
  sendText(payload: SendTextPayload): Promise<any>;
  sendImage(payload: SendImagePayload): Promise<any>;
}
`;

files["lib/whatsapp/evolution-provider.ts"] = `
import { WhatsAppProvider, SendTextPayload, SendImagePayload } from "./provider";

export class EvolutionProvider implements WhatsAppProvider {
  name = "EVOLUTION" as const;

  baseUrl: string;
  apiKey: string;
  instance: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || "http://localhost:8080";
    this.apiKey = process.env.EVOLUTION_API_KEY || "";
    this.instance = process.env.EVOLUTION_INSTANCE || "flowpilot";
  }

  headers() {
    return {
      "Content-Type": "application/json",
      apikey: this.apiKey,
    };
  }

  async createInstance(name: string) {
    const response = await fetch(this.baseUrl + "/instance/create", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        instanceName: name,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    return response.json();
  }

  async connect(instance: string) {
    const response = await fetch(this.baseUrl + "/instance/connect/" + instance, {
      method: "GET",
      headers: this.headers(),
    });

    return response.json();
  }

  async state(instance: string) {
    const response = await fetch(this.baseUrl + "/instance/connectionState/" + instance, {
      method: "GET",
      headers: this.headers(),
    });

    return response.json();
  }

  async logout(instance: string) {
    const response = await fetch(this.baseUrl + "/instance/logout/" + instance, {
      method: "DELETE",
      headers: this.headers(),
    });

    return response.json();
  }

  async sendText(payload: SendTextPayload) {
    const instance = payload.instanceId || this.instance;

    const response = await fetch(this.baseUrl + "/message/sendText/" + instance, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        number: payload.to,
        text: payload.text,
      }),
    });

    return response.json();
  }

  async sendImage(payload: SendImagePayload) {
    const instance = payload.instanceId || this.instance;

    const response = await fetch(this.baseUrl + "/message/sendMedia/" + instance, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        number: payload.to,
        mediatype: "image",
        media: payload.imageUrl,
        caption: payload.caption || "",
      }),
    });

    return response.json();
  }
}
`;

files["lib/whatsapp/meta-provider.ts"] = `
import { WhatsAppProvider, SendTextPayload, SendImagePayload } from "./provider";

export class MetaProvider implements WhatsAppProvider {
  name = "META" as const;

  phoneNumberId: string;
  accessToken: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
  }

  async sendText(payload: SendTextPayload) {
    const url = "https://graph.facebook.com/v19.0/" + this.phoneNumberId + "/messages";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: payload.to,
        type: "text",
        text: {
          body: payload.text,
        },
      }),
    });

    return response.json();
  }

  async sendImage(payload: SendImagePayload) {
    const url = "https://graph.facebook.com/v19.0/" + this.phoneNumberId + "/messages";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: payload.to,
        type: "image",
        image: {
          link: payload.imageUrl,
          caption: payload.caption || "",
        },
      }),
    });

    return response.json();
  }
}
`;

files["lib/whatsapp/index.ts"] = `
import { WhatsAppProvider } from "./provider";
import { EvolutionProvider } from "./evolution-provider";
import { MetaProvider } from "./meta-provider";

export function getWhatsAppProvider(): WhatsAppProvider {
  const preferred = (process.env.WHATSAPP_PROVIDER || "").toUpperCase();

  if (preferred === "META") {
    return new MetaProvider();
  }

  if (preferred === "EVOLUTION") {
    return new EvolutionProvider();
  }

  if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
    return new MetaProvider();
  }

  return new EvolutionProvider();
}
`;

files["lib/leads/connector.ts"] = `
export function normalizeLead(raw: any, source: string, organizationId: string) {
  const phone = String(raw.phone || raw.mobile || raw.contactNumber || raw.contact || "");

  return {
    organizationId,
    source,
    companyName: raw.companyName || raw.company || raw.name || "",
    personName: raw.personName || raw.contactPerson || raw.contact || raw.name || "",
    phone: phone.replace(/[^0-9]/g, ""),
    email: raw.email || raw.emailId || "",
    city: raw.city || raw.location || "",
    state: raw.state || raw.region || "",
    category: raw.category || raw.product || raw.service || "",
    requirement: raw.requirement || raw.message || raw.description || "",
    status: "NEW",
    consentStatus: "PENDING",
    rawPayload: raw,
  };
}

export function normalizeLeads(payload: any, source: string, organizationId: string) {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeLead(item, source, organizationId));
  }

  if (Array.isArray(payload.leads)) {
    return payload.leads.map((item: any) => normalizeLead(item, source, organizationId));
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map((item: any) => normalizeLead(item, source, organizationId));
  }

  return [normalizeLead(payload, source, organizationId)];
}
`;

files["lib/leads/webhook-handler.ts"] = `
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeLeads } from "@/lib/leads/connector";
import { scoreLead } from "@/lib/leads/scoring";
import { emitAutomationEvent } from "@/lib/automations/events";

export async function handleLeadWebhook(req: NextRequest, source: string) {
  const url = new URL(req.url);

  const organizationId =
    url.searchParams.get("organizationId") ||
    process.env.DEFAULT_ORGANIZATION_ID ||
    "";

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 }
    );
  }

  const token = process.env.LEAD_WEBHOOK_TOKEN || "";

  if (token) {
    const headerToken = req.headers.get("x-webhook-token") || "";
    const queryToken = url.searchParams.get("token") || "";

    if (headerToken !== token && queryToken !== token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  const body = await req.json();

  const leads = normalizeLeads(body, source, organizationId);

  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (!lead.phone && !lead.email) {
      skipped++;
      continue;
    }

    const existing = await (prisma as any).lead.findFirst({
      where: {
        organizationId,
        OR: [
          lead.phone ? { phone: lead.phone } : undefined,
          lead.email ? { email: lead.email } : undefined,
        ].filter(Boolean),
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const created = await (prisma as any).lead.create({
      data: {
        organizationId,
        source: lead.source,
        companyName: lead.companyName,
        personName: lead.personName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        state: lead.state,
        category: lead.category,
        requirement: lead.requirement,
        status: "NEW",
        consentStatus: "PENDING",
        score: scoreLead(lead),
        rawPayload: lead.rawPayload || {},
      },
    });

    await emitAutomationEvent("lead.created", {
      organizationId,
      leadId: created.id,
      phone: created.phone,
      email: created.email,
      source: created.source,
      city: created.city,
      category: created.category,
    });

    imported++;
  }

  return NextResponse.json({ imported, skipped });
}
`;

files["lib/automations/events.ts"] = `
import prisma from "@/lib/prisma";
import { automationQueue } from "@/lib/queue";

export async function emitAutomationEvent(event: string, payload: any) {
  if (!payload || !payload.organizationId) {
    return;
  }

  const workflows = await (prisma as any).workflow.findMany({
    where: {
      organizationId: payload.organizationId,
      trigger: event,
      active: true,
    },
  });

  for (const workflow of workflows) {
    const execution = await (prisma as any).workflowExecution.create({
      data: {
        organizationId: payload.organizationId,
        workflowId: workflow.id,
        contactId: payload.contactId || payload.leadId || null,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await automationQueue.add(
      "run-automation",
      {
        executionId: execution.id,
        stepIndex: 0,
        payload,
      },
      {
        attempts: 3,
      }
    );
  }
}
`;

files["app/api/v1/evolution/instances/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { EvolutionProvider } from "@/lib/whatsapp/evolution-provider";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.read");
  await rateLimit("evolution:instances:" + ctx.session.user.id, 60, 60);

  const items = await (prisma as any).whatsAppInstance.findMany({
    where: {
      organizationId: ctx.organizationId,
      provider: "EVOLUTION",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.write");
  await rateLimit("evolution:instances:create:" + ctx.session.user.id, 20, 60);

  const body = await req.json();

  const name = body.name || "flowpilot";

  const evolution = new EvolutionProvider();

  const result = await evolution.createInstance(name);

  const qr =
    result?.qrcode?.base64 ||
    result?.qrCode ||
    result?.qr ||
    null;

  const instance = await (prisma as any).whatsAppInstance.create({
    data: {
      organizationId: ctx.organizationId,
      provider: "EVOLUTION",
      name,
      status: "CREATED",
      qrCode: qr,
      webhookUrl: body.webhookUrl || "",
    },
  });

  return NextResponse.json({ instance, raw: result }, { status: 201 });
});
`;

files["app/api/v1/evolution/instances/[id]/qr/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { EvolutionProvider } from "@/lib/whatsapp/evolution-provider";
import { ApiError } from "@/lib/api-error";

export const GET = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "apikeys.read");
  await rateLimit("evolution:qr:" + ctx.session.user.id, 30, 60);

  const instance = await (prisma as any).whatsAppInstance.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!instance) {
    throw new ApiError(404, "Instance not found", "NOT_FOUND");
  }

  const evolution = new EvolutionProvider();

  const result = await evolution.connect(instance.name);

  const qr =
    result?.qrcode?.base64 ||
    result?.qrCode ||
    result?.qr ||
    instance.qrCode ||
    null;

  await (prisma as any).whatsAppInstance.update({
    where: { id: instance.id },
    data: {
      qrCode: qr,
      status: "WAITING_QR",
    },
  });

  return NextResponse.json({ qr, raw: result });
});
`;

files["app/api/v1/evolution/instances/[id]/status/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { EvolutionProvider } from "@/lib/whatsapp/evolution-provider";
import { ApiError } from "@/lib/api-error";

export const GET = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "apikeys.read");
  await rateLimit("evolution:status:" + ctx.session.user.id, 60, 60);

  const instance = await (prisma as any).whatsAppInstance.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!instance) {
    throw new ApiError(404, "Instance not found", "NOT_FOUND");
  }

  const evolution = new EvolutionProvider();

  const result = await evolution.state(instance.name);

  const stateRaw =
    result?.instance?.state ||
    result?.state ||
    "unknown";

  let status = "DISCONNECTED";

  if (String(stateRaw).toLowerCase() === "open") {
    status = "CONNECTED";
  }

  if (String(stateRaw).toLowerCase() === "connecting") {
    status = "CONNECTING";
  }

  await (prisma as any).whatsAppInstance.update({
    where: { id: instance.id },
    data: {
      status,
      lastConnectedAt: status === "CONNECTED" ? new Date() : instance.lastConnectedAt,
    },
  });

  return NextResponse.json({ status, raw: result });
});
`;

files["app/api/v1/evolution/instances/[id]/logout/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { EvolutionProvider } from "@/lib/whatsapp/evolution-provider";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "apikeys.write");
  await rateLimit("evolution:logout:" + ctx.session.user.id, 10, 60);

  const instance = await (prisma as any).whatsAppInstance.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!instance) {
    throw new ApiError(404, "Instance not found", "NOT_FOUND");
  }

  const evolution = new EvolutionProvider();

  const result = await evolution.logout(instance.name);

  await (prisma as any).whatsAppInstance.update({
    where: { id: instance.id },
    data: {
      status: "DISCONNECTED",
      qrCode: null,
    },
  });

  return NextResponse.json({ success: true, raw: result });
});
`;

files["app/api/v1/evolution/webhook/route.ts"] = `
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { emitAutomationEvent } from "@/lib/automations/events";

export async function POST(req: NextRequest) {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET || "";

  if (secret) {
    const token = req.headers.get("x-webhook-token") || "";

    if (token !== secret) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  }

  const body = await req.json();

  const instanceName = body.instance || "";

  let organizationId = process.env.DEFAULT_ORGANIZATION_ID || "";

  if (instanceName) {
    const instance = await (prisma as any).whatsAppInstance.findFirst({
      where: {
        name: instanceName,
        provider: "EVOLUTION",
      },
    });

    if (instance) {
      organizationId = instance.organizationId;

      const state = body?.data?.state || "";

      if (body.event === "connection.update" && state) {
        await (prisma as any).whatsAppInstance.update({
          where: { id: instance.id },
          data: {
            status: String(state).toLowerCase() === "open" ? "CONNECTED" : "DISCONNECTED",
            lastConnectedAt: String(state).toLowerCase() === "open" ? new Date() : instance.lastConnectedAt,
          },
        });
      }
    }
  }

  if (!organizationId) {
    return NextResponse.json({ received: true });
  }

  const event = body.event || "";

  if (event === "messages.upsert") {
    const data = body.data || {};

    const key = data.key || {};
    const remoteJid = key.remoteJid || "";
    const fromMe = key.fromMe || false;

    if (fromMe) {
      return NextResponse.json({ received: true });
    }

    if (String(remoteJid).includes("@broadcast")) {
      return NextResponse.json({ received: true });
    }

    const phone = String(remoteJid).split("@")[0];

    const text =
      data?.message?.conversation ||
      data?.message?.extendedTextMessage?.text ||
      data?.message?.imageMessage?.caption ||
      "[media]";

    let contact = await prisma.contact.findFirst({
      where: {
        organizationId,
        phone,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          organizationId,
          name: phone,
          phone,
          source: "EVOLUTION_WHATSAPP",
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        organizationId,
        contactId: contact.id,
        channel: "WHATSAPP",
      },
      orderBy: {
        updatedAt: "desc",
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

    await prisma.message.create({
      data: {
        organizationId,
        conversationId: conversation.id,
        direction: "INBOUND",
        body: text,
        status: "DELIVERED",
        provider: "evolution",
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
      },
    });

    await emitAutomationEvent("whatsapp.message.received", {
      organizationId,
      contactId: contact.id,
      phone,
      text,
      instanceName,
    });
  }

  return NextResponse.json({ received: true });
}
`;

files["app/(dashboard)/settings/whatsapp-evolution/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function WhatsAppEvolutionPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/evolution/instances", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setInstances(data.items || []);
    } catch {
      setInstances([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createInstance = async () => {
    if (!name.trim()) {
      alert("Instance name required");
      return;
    }

    const res = await fetch("/api/v1/evolution/instances", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error?.message || "Failed to create instance");
      return;
    }

    setName("");
    load();
  };

  const getQr = async (instance: any) => {
    setSelected(instance);

    const res = await fetch("/api/v1/evolution/instances/" + instance.id + "/qr", {
      headers: orgHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error?.message || "Failed to fetch QR");
      return;
    }

    setQr(data.qr || "");
  };

  const refreshStatus = async (instance: any) => {
    setSelected(instance);

    const res = await fetch("/api/v1/evolution/instances/" + instance.id + "/status", {
      headers: orgHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error?.message || "Failed to refresh status");
      return;
    }

    setStatus(data.status || "");
    load();
  };

  const logout = async (instance: any) => {
    const ok = confirm("Logout this instance?");

    if (!ok) return;

    await fetch("/api/v1/evolution/instances/" + instance.id + "/logout", {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  return (
    <div>
      <Topbar title="Evolution WhatsApp" subtitle="QR connect and instance management" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Instance</div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="Instance name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button className="btn" onClick={createInstance}>
            Create
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Instances</div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((instance: any) => (
                  <tr key={instance.id}>
                    <td>{instance.name}</td>
                    <td>{instance.status}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="btn secondary small" onClick={() => getQr(instance)}>
                          QR
                        </button>

                        <button className="btn secondary small" onClick={() => refreshStatus(instance)}>
                          Status
                        </button>

                        <button className="btn danger small" onClick={() => logout(instance)}>
                          Logout
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">QR Code</div>

          {qr ? (
            <img
              alt="WhatsApp QR"
              style={{ width: 280, height: 280, borderRadius: 12, background: "white", padding: 8 }}
              src={qr.startsWith("data:") ? qr : "data:image/png;base64," + qr}
            />
          ) : (
            <div className="muted">Click QR on an instance.</div>
          )}

          {status ? (
            <div style={{ marginTop: 12 }}>
              <span className="badge info">{status}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
`;

files["app/api/v1/connectors/indiamart/route.ts"] = `
import { NextRequest } from "next/server";
import { handleLeadWebhook } from "@/lib/leads/webhook-handler";

export async function POST(req: NextRequest) {
  return handleLeadWebhook(req, "INDIAMART");
}
`;

files["app/api/v1/connectors/tradeindia/route.ts"] = `
import { NextRequest } from "next/server";
import { handleLeadWebhook } from "@/lib/leads/webhook-handler";

export async function POST(req: NextRequest) {
  return handleLeadWebhook(req, "TRADEINDIA");
}
`;

files["app/api/v1/connectors/apify/route.ts"] = `
import { NextRequest } from "next/server";
import { handleLeadWebhook } from "@/lib/leads/webhook-handler";

export async function POST(req: NextRequest) {
  return handleLeadWebhook(req, "APIFY");
}
`;

files["app/(dashboard)/leads/import/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function LeadImportPage() {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [currentOrg, setCurrentOrg] = useState("");

  const loadOrg = async () => {
    try {
      const res = await fetch("/api/v1/organizations", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setCurrentOrg(data.current || "");
    } catch {
      setCurrentOrg("");
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const importCsv = async () => {
    setMessage("");

    const res = await fetch("/api/v1/leads/import", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ csv }),
    });

    const data = await res.json();

    if (data.imported !== undefined) {
      setMessage("Imported " + data.imported + " leads.");
      setCsv("");
    } else {
      setMessage(data.error?.message || "Import failed.");
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const indiamartUrl = baseUrl + "/api/v1/connectors/indiamart?organizationId=" + currentOrg;
  const tradeindiaUrl = baseUrl + "/api/v1/connectors/tradeindia?organizationId=" + currentOrg;
  const apifyUrl = baseUrl + "/api/v1/connectors/apify?organizationId=" + currentOrg;

  return (
    <div>
      <Topbar title="Lead Import" subtitle="CSV and external connectors" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">CSV Import</div>

          <textarea
            className="textarea"
            rows={8}
            placeholder={"companyName,personName,phone,email,city,category,requirement"}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />

          <div style={{ marginTop: 10 }}>
            <button className="btn" onClick={importCsv}>
              Import CSV
            </button>
          </div>

          {message ? <div className="muted" style={{ marginTop: 10 }}>{message}</div> : null}
        </div>

        <div className="card">
          <div className="card-title">Webhook Connectors</div>

          <div className="muted" style={{ marginBottom: 10 }}>
            Add token manually if LEAD_WEBHOOK_TOKEN is set.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div className="label">IndiaMART Webhook</div>
              <input className="input" readOnly value={indiamartUrl} />
            </div>

            <div>
              <div className="label">TradeIndia Webhook</div>
              <input className="input" readOnly value={tradeindiaUrl} />
            </div>

            <div>
              <div className="label">Apify / Custom Webhook</div>
              <input className="input" readOnly value={apifyUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

files["app/api/v1/posters/[id]/png/route.tsx"] = `
import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, context: any) {
  const poster = await (prisma as any).poster.findFirst({
    where: {
      id: context.params.id,
    },
  });

  if (!poster) {
    return new Response("Poster not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0f172a",
          color: "white",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 52, fontWeight: 700, marginBottom: 20 }}>
          {poster.title}
        </div>

        {poster.caption ? (
          <div style={{ fontSize: 28, color: "#cbd5e1", marginBottom: 30 }}>
            {poster.caption}
          </div>
        ) : null}

        {poster.imageUrl ? (
          <img
            src={poster.imageUrl}
            width={320}
            height={320}
            style={{ borderRadius: 20, objectFit: "cover" }}
          />
        ) : null}

        <div style={{ marginTop: 40, fontSize: 24, color: "#22d3ee" }}>
          Powered by FlowPilot
        </div>
      </div>
    ),
    {
      width: 600,
      height: 800,
    }
  );
}
`;

files["app/(dashboard)/posters/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function PostersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/posters", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await fetch("/api/v1/posters", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ title, caption, imageUrl }),
    });

    setTitle("");
    setCaption("");
    setImageUrl("");
    load();
  };

  return (
    <div>
      <Topbar title="Poster Studio" subtitle="Create marketing posters" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Poster</div>

        <div className="grid grid-2">
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="label">Caption</label>
            <input className="input" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </div>

          <div>
            <label className="label">Image URL</label>
            <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>

          <div style={{ display: "flex", alignItems: "end" }}>
            <button className="btn" onClick={create}>
              Create Poster
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Posters</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Caption</th>
                <th>PNG</th>
              </tr>
            </thead>
            <tbody>
              {items.map((poster: any) => (
                <tr key={poster.id}>
                  <td>{poster.title}</td>
                  <td>{poster.caption || "-"}</td>
                  <td>
                    <a className="btn secondary small" href={"/api/v1/posters/" + poster.id + "/png"} target="_blank">
                      Download PNG
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

files["app/api/v1/broadcasts-advanced/[id]/queue/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { broadcastAdvancedQueue } from "@/lib/queue";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("broadcast:queue:" + ctx.session.user.id, 20, 60);

  const broadcast = await (prisma as any).broadcastAdvanced.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!broadcast) {
    throw new ApiError(404, "Broadcast not found", "NOT_FOUND");
  }

  const audience = broadcast.audience || {};

  const where: any = {
    organizationId: ctx.organizationId,
  };

  if (audience.city) {
    where.city = audience.city;
  }

  if (audience.category) {
    where.category = audience.category;
  }

  if (audience.status) {
    where.status = audience.status;
  }

  if (audience.minScore) {
    where.score = {
      gte: Number(audience.minScore),
    };
  }

  where.consentStatus = audience.allowPending ? { in: ["OPTED_IN", "PENDING"] } : "OPTED_IN";

  const leads = await (prisma as any).lead.findMany({
    where,
  });

  const recipients = leads.filter((lead: any) => lead.phone);

  const rate = broadcast.ratePerMinute > 0 ? broadcast.ratePerMinute : 30;
  const interval = Math.floor(60000 / rate);

  let queued = 0;

  for (const lead of recipients) {
    const message = await (prisma as any).broadcastMessage.create({
      data: {
        broadcastId: broadcast.id,
        contactId: lead.id,
        phone: lead.phone,
        status: "QUEUED",
      },
    });

    await broadcastAdvancedQueue.add(
      "send-broadcast",
      {
        broadcastId: broadcast.id,
        messageId: message.id,
      },
      {
        attempts: 3,
        delay: queued * interval,
      }
    );

    queued++;
  }

  await (prisma as any).broadcastAdvanced.update({
    where: { id: broadcast.id },
    data: {
      status: "ACTIVE",
      totalRecipients: queued,
    },
  });

  return NextResponse.json({ queued });
});
`;

files["workers/broadcast-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { logger } from "../lib/logger";
import { getWhatsAppProvider } from "../lib/whatsapp";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "broadcasts-advanced",
  async (job) => {
    const { broadcastId, messageId } = job.data;

    const message = await (prisma as any).broadcastMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return;
    }

    const broadcast = await (prisma as any).broadcastAdvanced.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      return;
    }

    const content = broadcast.content || {};
    const provider = getWhatsAppProvider();

    try {
      if (content.imageUrl) {
        await provider.sendImage({
          to: message.phone,
          imageUrl: content.imageUrl,
          caption: content.message || "",
          instanceId: content.instanceName,
        });
      } else {
        await provider.sendText({
          to: message.phone,
          text: content.message || "",
          instanceId: content.instanceName,
        });
      }

      await (prisma as any).broadcastMessage.update({
        where: { id: message.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      await (prisma as any).broadcastAdvanced.update({
        where: { id: broadcast.id },
        data: {
          sentCount: {
            increment: 1,
          },
        },
      });
    } catch (error: any) {
      await (prisma as any).broadcastMessage.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          error: error?.message || "Send failed",
        },
      });

      await (prisma as any).broadcastAdvanced.update({
        where: { id: broadcast.id },
        data: {
          failedCount: {
            increment: 1,
          },
        },
      });
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 30,
      duration: 60000,
    },
  }
);

logger.info("Advanced broadcast worker started");
`;

files["app/(dashboard)/broadcast-advanced/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function BroadcastAdvancedPage() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ratePerMinute, setRatePerMinute] = useState(30);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/broadcasts-advanced", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await fetch("/api/v1/broadcasts-advanced", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name,
        ratePerMinute,
        audience: {},
        content: {
          message,
          imageUrl,
        },
      }),
    });

    setName("");
    setMessage("");
    setImageUrl("");
    setRatePerMinute(30);
    load();
  };

  const queue = async (id: string) => {
    const res = await fetch("/api/v1/broadcasts-advanced/" + id + "/queue", {
      method: "POST",
      headers: orgHeaders(),
    });

    const data = await res.json();

    alert("Queued: " + (data.queued || 0));
    load();
  };

  return (
    <div>
      <Topbar title="Advanced Broadcast" subtitle="Bulk WhatsApp with rate limiting" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Broadcast</div>

        <div className="grid grid-2">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="label">Rate per minute</label>
            <input
              className="input"
              type="number"
              value={ratePerMinute}
              onChange={(e) => setRatePerMinute(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="label">Message</label>
            <textarea className="textarea" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <div>
            <label className="label">Image URL</label>
            <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={create}>
            Create Broadcast
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Broadcasts</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Rate</th>
                <th>Sent</th>
                <th>Failed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.status}</td>
                  <td>{item.ratePerMinute}</td>
                  <td>{item.sentCount}</td>
                  <td>{item.failedCount}</td>
                  <td>
                    <button className="btn secondary small" onClick={() => queue(item.id)}>
                      Queue
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

files["app/api/v1/drip/[id]/steps/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const GET = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("drip:steps:" + ctx.session.user.id, 120, 60);

  const sequence = await (prisma as any).dripSequence.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!sequence) {
    throw new ApiError(404, "Drip not found", "NOT_FOUND");
  }

  const steps = await (prisma as any).dripStep.findMany({
    where: {
      sequenceId: sequence.id,
    },
    orderBy: {
      stepOrder: "asc",
    },
  });

  return NextResponse.json({ steps });
});

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("drip:steps:add:" + ctx.session.user.id, 30, 60);

  const sequence = await (prisma as any).dripSequence.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!sequence) {
    throw new ApiError(404, "Drip not found", "NOT_FOUND");
  }

  const body = await req.json();

  const existing = await (prisma as any).dripStep.count({
    where: {
      sequenceId: sequence.id,
    },
  });

  const step = await (prisma as any).dripStep.create({
    data: {
      sequenceId: sequence.id,
      stepOrder: existing + 1,
      delayValue: Number(body.delayValue || 0),
      delayUnit: body.delayUnit || "minutes",
      channel: body.channel || "WHATSAPP",
      content: body.content || {},
    },
  });

  return NextResponse.json(step, { status: 201 });
});
`;

files["app/api/v1/drip/[id]/activate/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("drip:activate:" + ctx.session.user.id, 20, 60);

  const sequence = await (prisma as any).dripSequence.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!sequence) {
    throw new ApiError(404, "Drip not found", "NOT_FOUND");
  }

  await (prisma as any).dripSequence.update({
    where: { id: sequence.id },
    data: {
      status: "ACTIVE",
    },
  });

  return NextResponse.json({ success: true });
});
`;

files["app/api/v1/drip/[id]/enroll/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { dripQueue } from "@/lib/queue";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("drip:enroll:" + ctx.session.user.id, 20, 60);

  const sequence = await (prisma as any).dripSequence.findFirst({
    where: {
      id: context.params.id,
      organizationId: ctx.organizationId,
    },
  });

  if (!sequence) {
    throw new ApiError(404, "Drip not found", "NOT_FOUND");
  }

  const body = await req.json();

  let lead = null;

  if (body.leadId) {
    lead = await (prisma as any).lead.findFirst({
      where: {
        id: body.leadId,
        organizationId: ctx.organizationId,
      },
    });
  }

  if (!lead && body.phone) {
    lead = await (prisma as any).lead.findFirst({
      where: {
        organizationId: ctx.organizationId,
        phone: String(body.phone).replace(/[^0-9]/g, ""),
      },
    });

    if (!lead) {
      lead = await (prisma as any).lead.create({
        data: {
          organizationId: ctx.organizationId,
          source: "DRIP_ENROLL",
          phone: String(body.phone).replace(/[^0-9]/g, ""),
          status: "NEW",
          consentStatus: "OPTED_IN",
          score: 50,
        },
      });
    }
  }

  if (!lead) {
    throw new ApiError(400, "leadId or phone required", "LEAD_REQUIRED");
  }

  const steps = await (prisma as any).dripStep.findMany({
    where: {
      sequenceId: sequence.id,
    },
    orderBy: {
      stepOrder: "asc",
    },
  });

  if (!steps.length) {
    throw new ApiError(400, "No drip steps found", "NO_STEPS");
  }

  const enrollment = await (prisma as any).dripEnrollment.create({
    data: {
      sequenceId: sequence.id,
      contactId: lead.id,
      status: "ACTIVE",
      currentStep: 0,
    },
  });

  const firstStep = steps[0];

  let delay = 0;

  if (firstStep.delayValue > 0) {
    delay = firstStep.delayUnit === "hours" ? firstStep.delayValue * 3600000 : firstStep.delayValue * 60000;
  }

  await dripQueue.add(
    "run-drip",
    {
      enrollmentId: enrollment.id,
    },
    {
      delay,
      attempts: 3,
    }
  );

  return NextResponse.json({ enrollmentId: enrollment.id, delay });
});
`;

files["workers/drip-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { logger } from "../lib/logger";
import { dripQueue } from "../lib/queue";
import { getWhatsAppProvider } from "../lib/whatsapp";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "drip",
  async (job) => {
    const { enrollmentId } = job.data;

    const enrollment = await (prisma as any).dripEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") {
      return;
    }

    const steps = await (prisma as any).dripStep.findMany({
      where: {
        sequenceId: enrollment.sequenceId,
      },
      orderBy: {
        stepOrder: "asc",
      },
    });

    const step = steps[enrollment.currentStep];

    if (!step) {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return;
    }

    const lead = await (prisma as any).lead.findFirst({
      where: {
        id: enrollment.contactId,
      },
    });

    if (!lead || !lead.phone) {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "EXITED",
          exitReason: "No phone",
        },
      });

      return;
    }

    if (lead.consentStatus === "OPTED_OUT") {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "EXITED",
          exitReason: "Opted out",
        },
      });

      return;
    }

    const content = step.content || {};
    const provider = getWhatsAppProvider();

    try {
      if (content.imageUrl) {
        await provider.sendImage({
          to: lead.phone,
          imageUrl: content.imageUrl,
          caption: content.message || "",
        });
      } else {
        await provider.sendText({
          to: lead.phone,
          text: content.message || "",
        });
      }
    } catch (error: any) {
      logger.error({ error }, "Drip send failed");
    }

    const nextStepIndex = enrollment.currentStep + 1;

    await (prisma as any).dripEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: nextStepIndex,
      },
    });

    const nextStep = steps[nextStepIndex];

    if (!nextStep) {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return;
    }

    let delay = 1000;

    if (nextStep.delayValue > 0) {
      delay = nextStep.delayUnit === "hours" ? nextStep.delayValue * 3600000 : nextStep.delayValue * 60000;
    }

    await dripQueue.add(
      "run-drip",
      {
        enrollmentId: enrollment.id,
      },
      {
        delay,
        attempts: 3,
      }
    );
  },
  {
    connection,
    concurrency: 3,
  }
);

logger.info("Drip worker started");
`;

files["app/(dashboard)/drip/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function DripPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("lead.created");
  const [message, setMessage] = useState("");
  const [delayValue, setDelayValue] = useState(0);
  const [delayUnit, setDelayUnit] = useState("minutes");
  const [phone, setPhone] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/drip", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  };

  const loadSteps = async (id: string) => {
    const res = await fetch("/api/v1/drip/" + id + "/steps", {
      headers: orgHeaders(),
    });

    const data = await res.json();
    setSteps(data.steps || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const res = await fetch("/api/v1/drip", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ name, trigger }),
    });

    const data = await res.json();

    setName("");
    load();

    if (data.id) {
      setSelected(data);
      loadSteps(data.id);
    }
  };

  const addStep = async () => {
    if (!selected) return;

    await fetch("/api/v1/drip/" + selected.id + "/steps", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        delayValue,
        delayUnit,
        channel: "WHATSAPP",
        content: { message },
      }),
    });

    setMessage("");
    loadSteps(selected.id);
  };

  const activate = async () => {
    if (!selected) return;

    await fetch("/api/v1/drip/" + selected.id + "/activate", {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  const enroll = async () => {
    if (!selected) return;

    const res = await fetch("/api/v1/drip/" + selected.id + "/enroll", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    alert(data.error?.message || "Enrolled");
  };

  return (
    <div>
      <Topbar title="Drip Campaigns" subtitle="Automated sequences" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Create Sequence</div>

          <div style={{ display: "grid", gap: 10 }}>
            <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

            <select className="select" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="lead.created">Lead Created</option>
              <option value="lead.imported">Lead Imported</option>
              <option value="whatsapp.message.received">WhatsApp Message Received</option>
            </select>

            <button className="btn" onClick={create}>
              Create
            </button>
          </div>

          <div style={{ marginTop: 20 }}>
            <div className="card-title">Sequences</div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.status}</td>
                      <td>
                        <button
                          className="btn secondary small"
                          onClick={() => {
                            setSelected(item);
                            loadSteps(item.id);
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            {selected ? selected.name : "Select a sequence"}
          </div>

          {selected ? (
            <div>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Step message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    className="input"
                    type="number"
                    value={delayValue}
                    onChange={(e) => setDelayValue(Number(e.target.value))}
                  />

                  <select className="select" value={delayUnit} onChange={(e) => setDelayUnit(e.target.value)}>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>

                  <button className="btn" onClick={addStep}>
                    Add Step
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Delay</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((step: any) => (
                      <tr key={step.id}>
                        <td>{step.stepOrder}</td>
                        <td>{step.delayValue} {step.delayUnit}</td>
                        <td>{step.content?.message || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                <button className="btn secondary" onClick={activate}>
                  Activate Sequence
                </button>

                <input
                  className="input"
                  placeholder="Test phone with country code"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <button className="btn" onClick={enroll}>
                  Enroll Test Phone
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
`;

files["workers/automation-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import prisma from "../lib/prisma";
import { logger } from "../lib/logger";
import { automationQueue } from "../lib/queue";
import { getWhatsAppProvider } from "../lib/whatsapp";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "automations",
  async (job) => {
    const { executionId, stepIndex = 0, payload = {} } = job.data;

    const execution = await (prisma as any).workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        workflow: true,
      },
    });

    if (!execution || execution.status !== "RUNNING") {
      return;
    }

    const steps = execution.workflow.steps || [];

    if (stepIndex >= steps.length) {
      await (prisma as any).workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return;
    }

    const step = steps[stepIndex];

    const scheduleNext = async (delay: number) => {
      await automationQueue.add(
        "run-automation",
        {
          executionId,
          stepIndex: stepIndex + 1,
          payload,
        },
        {
          delay,
          attempts: 3,
        }
      );
    };

    try {
      if (step.type === "wait") {
        const value = Number(step.value || 1);
        const unit = step.unit || "minutes";

        const delay = unit === "hours" ? value * 3600000 : value * 60000;

        await scheduleNext(delay);
        return;
      }

      if (step.type === "send_whatsapp") {
        let phone = payload.phone;

        if (!phone && payload.leadId) {
          const lead = await (prisma as any).lead.findUnique({
            where: { id: payload.leadId },
          });

          phone = lead?.phone;
        }

        if (phone) {
          const provider = getWhatsAppProvider();

          await provider.sendText({
            to: phone,
            text: step.body || step.label || "",
          });
        }
      }

      if (step.type === "webhook" && step.url) {
        await fetch(step.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (step.type === "add_tag" && payload.contactId) {
        const contact = await prisma.contact.findUnique({
          where: { id: payload.contactId },
        });

        if (contact) {
          const tag = step.tag || "Tagged";

          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              tags: Array.from(new Set([...contact.tags, tag])),
            },
          });
        }
      }

      await scheduleNext(1000);
    } catch (error: any) {
      logger.error({ error }, "Automation step failed");

      await (prisma as any).workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          error: error?.message || "Step failed",
        },
      });
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

logger.info("Automation worker started");
`;

files["app/api/v1/leads/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { scoreLead } from "@/lib/leads/scoring";
import { emitAutomationEvent } from "@/lib/automations/events";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.read");
  await rateLimit("leads:list:" + ctx.session.user.id, 120, 60);

  const items = await (prisma as any).lead.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit("leads:create:" + ctx.session.user.id, 60, 60);

  const body = await req.json();

  const lead = await (prisma as any).lead.create({
    data: {
      organizationId: ctx.organizationId,
      source: body.source || "MANUAL",
      companyName: body.companyName,
      personName: body.personName,
      phone: body.phone,
      email: body.email,
      city: body.city,
      state: body.state,
      category: body.category,
      requirement: body.requirement,
      status: body.status || "NEW",
      consentStatus: body.consentStatus || "PENDING",
      score: scoreLead(body),
      rawPayload: body.rawPayload || {},
    },
  });

  await emitAutomationEvent("lead.created", {
    organizationId: ctx.organizationId,
    leadId: lead.id,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    city: lead.city,
    category: lead.category,
  });

  return NextResponse.json(lead, { status: 201 });
});
`;

files["app/api/v1/leads/import/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { parseCsv } from "@/lib/leads/importer";
import { dedupeLeads } from "@/lib/leads/dedupe";
import { scoreLead } from "@/lib/leads/scoring";
import { emitAutomationEvent } from "@/lib/automations/events";

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit("leads:import:" + ctx.session.user.id, 20, 60);

  const body = await req.json();

  let rows = [];

  if (body.csv) {
    rows = parseCsv(body.csv);
  }

  if (Array.isArray(body.leads)) {
    rows = body.leads;
  }

  rows = dedupeLeads(rows);

  let imported = 0;

  for (const row of rows) {
    const lead = await (prisma as any).lead.create({
      data: {
        organizationId: ctx.organizationId,
        source: row.source || "CSV",
        companyName: row.companyName,
        personName: row.personName || row.name,
        phone: row.phone,
        email: row.email,
        city: row.city,
        state: row.state,
        category: row.category,
        requirement: row.requirement,
        status: "NEW",
        consentStatus: "PENDING",
        score: scoreLead(row),
        rawPayload: row,
      },
    });

    await emitAutomationEvent("lead.created", {
      organizationId: ctx.organizationId,
      leadId: lead.id,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      city: lead.city,
      category: lead.category,
    });

    imported++;
  }

  return NextResponse.json({ imported });
});
`;

files["components/Sidebar.tsx"] = `
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/welcome", label: "Welcome", icon: "🚀" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/inbox", label: "Inbox", icon: "💬" },
  { href: "/leads", label: "Leads", icon: "🧲" },
  { href: "/leads/import", label: "Lead Import", icon: "📥" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/pipeline", label: "Pipeline", icon: "🧩" },
  { href: "/posters", label: "Posters", icon: "🖼️" },
  { href: "/broadcast-advanced", label: "Broadcast", icon: "📣" },
  { href: "/drip", label: "Drip", icon: "💧" },
  { href: "/automation-builder", label: "Automation Builder", icon: "⚡" },
  { href: "/support", label: "Support", icon: "🎫" },
  { href: "/billing-portal", label: "Billing Portal", icon: "💳" },
  { href: "/settings/whatsapp-evolution", label: "Evolution WA", icon: "📱" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const path = usePathname() || "";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">FlowPilot</div>
      <div className="sidebar-sub">Revenue Automation</div>

      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={path.startsWith(item.href) ? "nav-item active" : "nav-item"}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </aside>
  );
}
`;

files["middleware.ts"] = `
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) => {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/welcome/:path*",
    "/dashboard/:path*",
    "/analytics/:path*",
    "/contacts/:path*",
    "/pipeline/:path*",
    "/inbox/:path*",
    "/leads/:path*",
    "/posters/:path*",
    "/broadcast-advanced/:path*",
    "/drip/:path*",
    "/automation-builder/:path*",
    "/support/:path*",
    "/billing-portal/:path*",
    "/design/:path*",
    "/agency-wizard/:path*",
    "/settings/:path*",
  ],
};
`;

files["app/(dashboard)/settings/layout.tsx"] = `
import type { ReactNode } from "react";
import Link from "next/link";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="pill-nav">
        <Link className="btn secondary small" href="/settings">General</Link>
        <Link className="btn secondary small" href="/settings/whatsapp">WhatsApp</Link>
        <Link className="btn secondary small" href="/settings/whatsapp-evolution">Evolution</Link>
        <Link className="btn secondary small" href="/settings/whatsapp-templates">Templates</Link>
        <Link className="btn secondary small" href="/settings/api-keys">API Keys</Link>
        <Link className="btn secondary small" href="/settings/team">Team</Link>
        <Link className="btn secondary small" href="/settings/agency">Agency</Link>
        <Link className="btn secondary small" href="/settings/white-label">White-label</Link>
        <Link className="btn secondary small" href="/settings/billing">Billing</Link>
        <Link className="btn secondary small" href="/settings/deployment">Deployment</Link>
        <Link className="btn secondary small" href="/settings/production">Production</Link>
      </div>

      {children}
    </div>
  );
}
`;

for (const [file, content] of Object.entries(files)) {
  write(file, content);
}

console.log("Real feature modules added.");