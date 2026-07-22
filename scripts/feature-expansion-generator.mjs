import fs from "fs";
import path from "path";

const root = process.cwd();

function write(file, content) {
  const fullPath = path.join(root, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });

  if (fs.existsSync(fullPath)) {
    console.log("EXISTS: " + file);
    return;
  }

  fs.writeFileSync(fullPath, content);
  console.log("CREATED: " + file);
}

const files = {};

files["../docs/feature-expansion/00-master-plan.md"] = `
# FlowPilot Feature Expansion Master Plan

Modules:

1. WhatsApp Provider Pack
   - Meta Cloud API
   - Evolution API
   - Instance management

2. Lead Generation Pack
   - Leads CRM
   - CSV import
   - Webhook import
   - Dedupe
   - Lead scoring
   - Consent status

3. Poster Studio Pack
   - Poster templates
   - Poster creation
   - Marketing assets

4. Advanced Broadcast Pack
   - Audience filters
   - Bulk queue
   - Rate limiting
   - Analytics

5. Drip Campaign Pack
   - Sequences
   - Steps
   - Enrollment
   - Exit conditions

6. Full Automation Pack
   - Event triggers
   - Actions
   - Conditions
   - Workers
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

  async sendText(payload: SendTextPayload) {
    const url = this.baseUrl + "/message/sendText/" + (payload.instanceId || this.instance);

    const response = await fetch(url, {
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
    const url = this.baseUrl + "/message/sendMedia/" + (payload.instanceId || this.instance);

    const response = await fetch(url, {
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

files["lib/leads/importer.ts"] = `
export function parseCsv(csv: string) {
  const lines = csv.split(/\\r?\\n/).filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");

    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim();
    });

    return row;
  });
}
`;

files["lib/leads/dedupe.ts"] = `
export function normalizePhone(phone: string) {
  return (phone || "").replace(/[^0-9]/g, "");
}

export function dedupeLeads(leads: any[]) {
  const map = new Map();

  for (const lead of leads) {
    const phone = normalizePhone(lead.phone || "");
    const email = (lead.email || "").toLowerCase();

    const key = phone || email || lead.companyName || JSON.stringify(lead);

    if (!map.has(key)) {
      map.set(key, lead);
    }
  }

  return Array.from(map.values());
}
`;

files["lib/leads/scoring.ts"] = `
export function scoreLead(lead: any) {
  let score = 0;

  if (lead.phone) score += 30;
  if (lead.email) score += 20;
  if (lead.companyName) score += 15;
  if (lead.city) score += 10;
  if (lead.requirement) score += 15;
  if (lead.category) score += 10;

  return Math.min(score, 100);
}
`;

files["lib/posters/renderer.ts"] = `
export function renderPosterHtml(data: any) {
  const title = data.title || "Marketing Offer";
  const subtitle = data.subtitle || "Limited time offer";
  const price = data.price || "";
  const color = data.color || "#4f46e5";

  return [
    "<div style='width:600px;padding:40px;font-family:Arial;background:" + color + ";color:white;'>",
    "<h1 style='font-size:42px;margin:0;'>" + title + "</h1>",
    "<p style='font-size:24px;'>" + subtitle + "</p>",
    price ? "<div style='font-size:32px;font-weight:bold;'>" + price + "</div>" : "",
    "</div>"
  ].join("");
}
`;

files["lib/automations/engine.ts"] = `
export function evaluateCondition(condition: any, context: any) {
  if (!condition) return true;

  if (condition.field && condition.value !== undefined) {
    return context[condition.field] === condition.value;
  }

  return true;
}

export async function executeAction(action: any, context: any) {
  console.log("Executing action:", action.type);
  console.log("Context:", context);

  return {
    success: true,
    action: action.type,
  };
}
`;

files["app/api/v1/leads/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { scoreLead } from "@/lib/leads/scoring";

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
    await (prisma as any).lead.create({
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

    imported++;
  }

  return NextResponse.json({ imported });
});
`;

files["app/api/v1/posters/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("posters:list:" + ctx.session.user.id, 120, 60);

  const items = await (prisma as any).poster.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("posters:create:" + ctx.session.user.id, 30, 60);

  const body = await req.json();

  const poster = await (prisma as any).poster.create({
    data: {
      organizationId: ctx.organizationId,
      title: body.title || "Untitled Poster",
      caption: body.caption,
      imageUrl: body.imageUrl,
      status: "DRAFT",
    },
  });

  return NextResponse.json(poster, { status: 201 });
});
`;

files["app/api/v1/broadcasts-advanced/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("broadcasts:list:" + ctx.session.user.id, 120, 60);

  const items = await (prisma as any).broadcastAdvanced.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("broadcasts:create:" + ctx.session.user.id, 30, 60);

  const body = await req.json();

  const broadcast = await (prisma as any).broadcastAdvanced.create({
    data: {
      organizationId: ctx.organizationId,
      name: body.name || "Untitled Broadcast",
      audience: body.audience || {},
      content: body.content || {},
      ratePerMinute: body.ratePerMinute || 30,
      status: "DRAFT",
    },
  });

  return NextResponse.json(broadcast, { status: 201 });
});
`;

files["app/api/v1/drip/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("drip:list:" + ctx.session.user.id, 120, 60);

  const items = await (prisma as any).dripSequence.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("drip:create:" + ctx.session.user.id, 30, 60);

  const body = await req.json();

  const drip = await (prisma as any).dripSequence.create({
    data: {
      organizationId: ctx.organizationId,
      name: body.name || "Untitled Drip",
      trigger: body.trigger || "lead.created",
      status: "DRAFT",
      exitConditions: body.exitConditions || {},
    },
  });

  return NextResponse.json(drip, { status: 201 });
});
`;

files["app/api/v1/whatsapp/instances/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.read");
  await rateLimit("whatsapp:instances:" + ctx.session.user.id, 60, 60);

  const items = await (prisma as any).whatsAppInstance.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "apikeys.write");
  await rateLimit("whatsapp:instances:create:" + ctx.session.user.id, 20, 60);

  const body = await req.json();

  const instance = await (prisma as any).whatsAppInstance.create({
    data: {
      organizationId: ctx.organizationId,
      provider: body.provider || "EVOLUTION",
      name: body.name || "WhatsApp Instance",
      phoneNumber: body.phoneNumber,
      apiKey: body.apiKey,
      webhookUrl: body.webhookUrl,
      status: "DISCONNECTED",
    },
  });

  return NextResponse.json(instance, { status: 201 });
});
`;

files["app/(dashboard)/leads/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function LeadsPage() {
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/leads", {
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

  return (
    <div>
      <Topbar title="Leads" subtitle="Lead generation CRM" />

      <div className="card">
        <div className="card-title">Leads</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Person</th>
                <th>Phone</th>
                <th>City</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((lead: any) => (
                <tr key={lead.id}>
                  <td>{lead.companyName || "-"}</td>
                  <td>{lead.personName || "-"}</td>
                  <td>{lead.phone || "-"}</td>
                  <td>{lead.city || "-"}</td>
                  <td>{lead.score}</td>
                  <td>{lead.status}</td>
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

files["app/(dashboard)/posters/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function PostersPage() {
  const [items, setItems] = useState<any[]>([]);

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

  return (
    <div>
      <Topbar title="Poster Studio" subtitle="Marketing poster generation" />

      <div className="card">
        <div className="card-title">Posters</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Caption</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((poster: any) => (
                <tr key={poster.id}>
                  <td>{poster.title}</td>
                  <td>{poster.caption || "-"}</td>
                  <td>{poster.status}</td>
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

files["app/(dashboard)/broadcast-advanced/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function BroadcastAdvancedPage() {
  const [items, setItems] = useState<any[]>([]);

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

  return (
    <div>
      <Topbar title="Advanced Broadcast" subtitle="Bulk WhatsApp campaign engine" />

      <div className="card">
        <div className="card-title">Broadcasts</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Rate/min</th>
                <th>Sent</th>
                <th>Failed</th>
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

files["app/(dashboard)/drip/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function DripPage() {
  const [items, setItems] = useState<any[]>([]);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar title="Drip Campaigns" subtitle="Automated follow-up sequences" />

      <div className="card">
        <div className="card-title">Drip Sequences</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trigger</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.trigger}</td>
                  <td>{item.status}</td>
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

files["workers/broadcast-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "broadcasts-advanced",
  async (job) => {
    logger.info({ job: job.data }, "Processing advanced broadcast");
  },
  {
    connection,
    concurrency: 2,
  }
);

logger.info("Advanced broadcast worker started");
`;

files["workers/drip-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "drip",
  async (job) => {
    logger.info({ job: job.data }, "Processing drip step");
  },
  {
    connection,
    concurrency: 3,
  }
);

logger.info("Drip worker started");
`;

files["workers/lead-sync-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "lead-sync",
  async (job) => {
    logger.info({ job: job.data }, "Processing lead sync");
  },
  {
    connection,
    concurrency: 2,
  }
);

logger.info("Lead sync worker started");
`;

files["workers/poster-worker.ts"] = `
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "../lib/logger";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

new Worker(
  "posters",
  async (job) => {
    logger.info({ job: job.data }, "Processing poster generation");
  },
  {
    connection,
    concurrency: 2,
  }
);

logger.info("Poster worker started");
`;

for (const [file, content] of Object.entries(files)) {
  write(file, content);
}

console.log("Feature expansion files created.");