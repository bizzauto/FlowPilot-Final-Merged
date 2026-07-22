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

files["scripts/add-advanced-models.mjs"] = `
import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("ERROR: prisma/schema.prisma not found.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");
let changed = false;

if (!schema.includes("variant        String?")) {
  schema = schema.replace(
    "model BroadcastMessage {",
    'model BroadcastMessage {\\n  variant        String?'
  );
  changed = true;
}

if (!schema.includes('type           String @default("send_whatsapp")')) {
  schema = schema.replace(
    "model DripStep {",
    'model DripStep {\\n  type           String @default("send_whatsapp")'
  );
  changed = true;
}

if (!schema.includes("model PosterTemplateLibrary")) {
  const modelLines = [
    "",
    "model PosterTemplateLibrary {",
    "  id             String @id @default(cuid())",
    "  organizationId String",
    "  name           String",
    "  category       String?",
    "  elements       Json",
    "  active         Boolean @default(true)",
    "",
    "  createdAt DateTime @default(now())",
    "  updatedAt DateTime @updatedAt",
    "",
    "  @@index([organizationId])",
    "}",
    ""
  ];

  schema += modelLines.join("\\n");
  changed = true;
}

if (changed) {
  fs.writeFileSync(schemaPath, schema);
  console.log("Advanced models added.");
} else {
  console.log("Advanced models already exist.");
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
  const [pollingId, setPollingId] = useState("");

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

  useEffect(() => {
    if (!pollingId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          "/api/v1/evolution/instances/" + pollingId + "/status",
          { headers: orgHeaders() }
        );

        const data = await res.json();

        setStatus(data.status || "");

        if (data.status === "CONNECTED") {
          setPollingId("");
          load();
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingId]);

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

    if (data.instance?.id) {
      await autoConnect(data.instance);
    }
  };

  const autoConnect = async (instance: any) => {
    setSelected(instance);
    setStatus("CONNECTING");

    const qrRes = await fetch(
      "/api/v1/evolution/instances/" + instance.id + "/qr",
      { headers: orgHeaders() }
    );

    const qrData = await qrRes.json();

    if (qrData.qr) {
      setQr(qrData.qr);
    }

    setPollingId(instance.id);
  };

  const logout = async (instance: any) => {
    const ok = confirm("Logout this instance?");

    if (!ok) return;

    await fetch("/api/v1/evolution/instances/" + instance.id + "/logout", {
      method: "POST",
      headers: orgHeaders(),
    });

    setQr("");
    setStatus("");
    setPollingId("");
    load();
  };

  return (
    <div>
      <Topbar title="Evolution WhatsApp" subtitle="Auto QR polling and connect" />

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
            Create + Auto Connect
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
                        <button
                          className="btn secondary small"
                          onClick={() => autoConnect(instance)}
                        >
                          Auto Connect
                        </button>

                        <button
                          className="btn danger small"
                          onClick={() => logout(instance)}
                        >
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
          <div className="card-title">QR + Status</div>

          {status ? (
            <div style={{ marginBottom: 12 }}>
              <span className="badge info">{status}</span>
            </div>
          ) : null}

          {qr ? (
            <img
              alt="WhatsApp QR"
              style={{
                width: 280,
                height: 280,
                borderRadius: 12,
                background: "white",
                padding: 8,
              }}
              src={qr.startsWith("data:") ? qr : "data:image/png;base64," + qr}
            />
          ) : (
            <div className="muted">QR will appear here.</div>
          )}

          {pollingId ? (
            <div className="muted" style={{ marginTop: 12 }}>
              Auto polling every 5 seconds...
            </div>
          ) : null}
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
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ratePerMinute, setRatePerMinute] = useState(30);

  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [allowPending, setAllowPending] = useState(false);
  const [count, setCount] = useState(0);

  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [messageA, setMessageA] = useState("");
  const [messageB, setMessageB] = useState("");
  const [abPercentage, setAbPercentage] = useState(50);

  const audience = {
    city,
    category,
    status,
    minScore,
    allowPending,
  };

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

  const checkAudience = async () => {
    const res = await fetch("/api/v1/broadcasts-advanced/audience/count", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ audience }),
    });

    const data = await res.json();
    setCount(data.count || 0);
  };

  const create = async () => {
    await fetch("/api/v1/broadcasts-advanced", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name,
        ratePerMinute,
        audience,
        content: {
          message,
          imageUrl,
          abTestEnabled,
          messageA,
          messageB,
          abPercentage,
        },
      }),
    });

    setName("");
    setMessage("");
    setImageUrl("");
    setMessageA("");
    setMessageB("");
    setAbTestEnabled(false);
    setAbPercentage(50);
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
      <Topbar title="Advanced Broadcast" subtitle="Audience builder + A/B testing" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Audience Builder</div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div>
              <label className="label">Category</label>
              <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            <div>
              <label className="label">Lead Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option>
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="INTERESTED">INTERESTED</option>
                <option value="CONVERTED">CONVERTED</option>
              </select>
            </div>

            <div>
              <label className="label">Minimum Score</label>
              <input
                className="input"
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={allowPending}
                onChange={(e) => setAllowPending(e.target.checked)}
              />
              Include PENDING consent
            </label>

            <button className="btn secondary" onClick={checkAudience}>
              Check Audience Count
            </button>

            <div className="badge info">Audience Count: {count}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Message + A/B Test</div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label className="label">Broadcast Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={abTestEnabled}
                onChange={(e) => setAbTestEnabled(e.target.checked)}
              />
              Enable A/B Test
            </label>

            {abTestEnabled ? (
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <label className="label">Variant A</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={messageA}
                    onChange={(e) => setMessageA(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Variant B</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={messageB}
                    onChange={(e) => setMessageB(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Variant A Percentage</label>
                  <input
                    className="input"
                    type="number"
                    value={abPercentage}
                    onChange={(e) => setAbPercentage(Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="label">Message</label>
                <textarea
                  className="textarea"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label">Image URL</label>
              <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
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

            <button className="btn" onClick={create}>
              Create Broadcast
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
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
  const content = broadcast.content || {};

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

  where.consentStatus = audience.allowPending
    ? { in: ["OPTED_IN", "PENDING"] }
    : "OPTED_IN";

  const leads = await (prisma as any).lead.findMany({ where });

  const recipients = leads.filter((lead: any) => lead.phone);

  const rate = broadcast.ratePerMinute > 0 ? broadcast.ratePerMinute : 30;
  const interval = Math.floor(60000 / rate);

  const abEnabled = Boolean(content.abTestEnabled && content.messageA && content.messageB);
  const abPercentage = Number(content.abPercentage || 50);

  let queued = 0;

  for (const lead of recipients) {
    let variant = "";

    if (abEnabled) {
      variant = Math.random() * 100 <= abPercentage ? "A" : "B";
    }

    const message = await (prisma as any).broadcastMessage.create({
      data: {
        broadcastId: broadcast.id,
        contactId: lead.id,
        phone: lead.phone,
        status: "QUEUED",
        variant,
      },
    });

    await broadcastAdvancedQueue.add(
      "send-broadcast",
      {
        broadcastId: broadcast.id,
        messageId: message.id,
        variant,
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

    if (!message) return;

    const broadcast = await (prisma as any).broadcastAdvanced.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) return;

    const content = broadcast.content || {};
    const provider = getWhatsAppProvider();

    const variant = job.data.variant || message.variant || "";

    let text = content.message || "";

    if (variant === "A" && content.messageA) {
      text = content.messageA;
    }

    if (variant === "B" && content.messageB) {
      text = content.messageB;
    }

    try {
      if (content.imageUrl) {
        await provider.sendImage({
          to: message.phone,
          imageUrl: content.imageUrl,
          caption: text,
          instanceId: content.instanceName,
        });
      } else {
        await provider.sendText({
          to: message.phone,
          text,
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
          sentCount: { increment: 1 },
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
          failedCount: { increment: 1 },
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

files["app/api/v1/drip/[id]/steps/save/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "campaigns.write");
  await rateLimit("drip:steps:save:" + ctx.session.user.id, 30, 60);

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
  const steps = Array.isArray(body.steps) ? body.steps : [];

  await (prisma as any).dripStep.deleteMany({
    where: {
      sequenceId: sequence.id,
    },
  });

  let order = 1;

  for (const step of steps) {
    await (prisma as any).dripStep.create({
      data: {
        sequenceId: sequence.id,
        stepOrder: order,
        type: step.type || "send_whatsapp",
        delayValue: Number(step.delayValue || 0),
        delayUnit: step.delayUnit || "minutes",
        channel: step.channel || "WHATSAPP",
        content: step.content || {},
      },
    });

    order++;
  }

  return NextResponse.json({ success: true });
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

function evaluateCondition(condition: any, data: any) {
  if (!condition || !condition.field) return true;

  const value = data[condition.field];
  const target = condition.value;

  if (condition.operator === "equals") {
    return String(value) === String(target);
  }

  if (condition.operator === "contains") {
    return String(value || "")
      .toLowerCase()
      .includes(String(target || "").toLowerCase());
  }

  if (condition.operator === "gte") {
    return Number(value || 0) >= Number(target || 0);
  }

  return true;
}

function getDelay(step: any) {
  if (!step || !(step.delayValue > 0)) return 1000;

  return step.delayUnit === "hours"
    ? step.delayValue * 3600000
    : step.delayValue * 60000;
}

new Worker(
  "drip",
  async (job) => {
    const { enrollmentId } = job.data;

    const enrollment = await (prisma as any).dripEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.status !== "ACTIVE") return;

    const steps = await (prisma as any).dripStep.findMany({
      where: { sequenceId: enrollment.sequenceId },
      orderBy: { stepOrder: "asc" },
    });

    const step = steps[enrollment.currentStep];

    const complete = async () => {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    };

    const exit = async (reason: string) => {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "EXITED",
          exitReason: reason,
        },
      });
    };

    const scheduleIndex = async (index: number) => {
      await (prisma as any).dripEnrollment.update({
        where: { id: enrollment.id },
        data: { currentStep: index },
      });

      const nextStep = steps[index];

      if (!nextStep) {
        await complete();
        return;
      }

      await dripQueue.add(
        "run-drip",
        { enrollmentId: enrollment.id },
        { delay: getDelay(nextStep), attempts: 3 }
      );
    };

    if (!step) {
      await complete();
      return;
    }

    const lead = await (prisma as any).lead.findFirst({
      where: { id: enrollment.contactId },
    });

    if (!lead || !lead.phone) {
      await exit("No phone");
      return;
    }

    if (lead.consentStatus === "OPTED_OUT") {
      await exit("Opted out");
      return;
    }

    if (step.type === "condition") {
      const passed = evaluateCondition(step.content?.condition, lead);

      if (!passed) {
        if (step.content?.onFailure === "skip") {
          await scheduleIndex(enrollment.currentStep + 2);
          return;
        }

        await exit("Condition failed");
        return;
      }

      await scheduleIndex(enrollment.currentStep + 1);
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

    await scheduleIndex(enrollment.currentStep + 1);
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
  const [phone, setPhone] = useState("");
  const [selectedStep, setSelectedStep] = useState<number>(-1);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/drip", { headers: orgHeaders() });
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

    const mapped = (data.steps || []).map((step: any) => ({
      type: step.type || "send_whatsapp",
      delayValue: step.delayValue || 0,
      delayUnit: step.delayUnit || "minutes",
      channel: step.channel || "WHATSAPP",
      content: step.content || {},
    }));

    setSteps(mapped);
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
      setSteps([]);
    }
  };

  const addStep = (type: string) => {
    setSteps([
      ...steps,
      {
        type,
        delayValue: type === "wait" ? 5 : 0,
        delayUnit: "minutes",
        channel: "WHATSAPP",
        content:
          type === "condition"
            ? {
                condition: {
                  field: "status",
                  operator: "equals",
                  value: "INTERESTED",
                },
                onFailure: "exit",
              }
            : { message: "" },
      },
    ]);
  };

  const updateStep = (index: number, patch: any) => {
    setSteps(
      steps.map((step, i) =>
        i === index ? Object.assign({}, step, patch) : step
      )
    );
  };

  const updateStepContent = (index: number, patch: any) => {
    setSteps(
      steps.map((step, i) =>
        i === index
          ? Object.assign({}, step, {
              content: Object.assign({}, step.content, patch),
            })
          : step
      )
    );
  };

  const updateCondition = (index: number, patch: any) => {
    const step = steps[index];

    updateStepContent(index, {
      condition: Object.assign({}, step.content?.condition, patch),
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;

    const copy = [...steps];
    const item = copy[from];

    copy.splice(from, 1);
    copy.splice(to, 0, item);

    setSteps(copy);
  };

  const saveSteps = async () => {
    if (!selected) return;

    await fetch("/api/v1/drip/" + selected.id + "/steps/save", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ steps }),
    });

    alert("Steps saved.");
  };

  const activate = async () => {
    if (!selected) return;

    await fetch("/api/v1/drip/" + selected.id + "/activate", {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
    alert("Drip activated.");
  };

  const enroll = async () => {
    if (!selected) return;

    const res = await fetch("/api/v1/drip/" + selected.id + "/enroll", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();

    alert(data.error?.message || "Enrolled.");
  };

  return (
    <div>
      <Topbar title="Drip Builder" subtitle="Visual sequence + condition branches" />

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

            <button className="btn" onClick={create}>Create</button>
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
              <div className="grid grid-2" style={{ marginBottom: 16 }}>
                <div
                  className="palette-item"
                  draggable
                  onDragStart={(e: any) => e.dataTransfer.setData("step-type", "wait")}
                  onClick={() => addStep("wait")}
                >
                  Wait
                </div>

                <div
                  className="palette-item"
                  draggable
                  onDragStart={(e: any) => e.dataTransfer.setData("step-type", "send_whatsapp")}
                  onClick={() => addStep("send_whatsapp")}
                >
                  Send WhatsApp
                </div>

                <div
                  className="palette-item"
                  draggable
                  onDragStart={(e: any) => e.dataTransfer.setData("step-type", "condition")}
                  onClick={() => addStep("condition")}
                >
                  Condition
                </div>
              </div>

              <div
                className="dropzone"
                onDragOver={(e: any) => e.preventDefault()}
                onDrop={(e: any) => {
                  e.preventDefault();

                  const type = e.dataTransfer.getData("step-type");

                  if (type) addStep(type);
                }}
              >
                {steps.length === 0 ? (
                  <div className="muted">Drag steps here.</div>
                ) : (
                  steps.map((step: any, index: number) => (
                    <div
                      key={index}
                      className="step-item"
                      draggable
                      onDragStart={(e: any) => e.dataTransfer.setData("step-index", String(index))}
                      onDragOver={(e: any) => e.preventDefault()}
                      onDrop={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const from = Number(e.dataTransfer.getData("step-index"));

                        if (!isNaN(from)) reorder(from, index);
                      }}
                      onClick={() => setSelectedStep(index)}
                    >
                      <div className="step-header">
                        <div>
                          <strong>Step {index + 1}</strong>
                          <div className="muted">{step.type}</div>
                        </div>

                        <button
                          className="btn danger small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSteps(steps.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      {selectedStep === index ? (
                        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="input"
                              type="number"
                              value={step.delayValue}
                              onChange={(e) =>
                                updateStep(index, { delayValue: Number(e.target.value) })
                              }
                            />

                            <select
                              className="select"
                              value={step.delayUnit}
                              onChange={(e) => updateStep(index, { delayUnit: e.target.value })}
                            >
                              <option value="minutes">Minutes</option>
                              <option value="hours">Hours</option>
                            </select>
                          </div>

                          {step.type === "send_whatsapp" ? (
                            <textarea
                              className="textarea"
                              rows={3}
                              placeholder="WhatsApp message"
                              value={step.content.message || ""}
                              onChange={(e) =>
                                updateStepContent(index, { message: e.target.value })
                              }
                            />
                          ) : null}

                          {step.type === "condition" ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <select
                                className="select"
                                value={step.content?.condition?.field || "status"}
                                onChange={(e) => updateCondition(index, { field: e.target.value })}
                              >
                                <option value="status">Status</option>
                                <option value="consentStatus">Consent Status</option>
                                <option value="score">Score</option>
                                <option value="city">City</option>
                                <option value="source">Source</option>
                              </select>

                              <select
                                className="select"
                                value={step.content?.condition?.operator || "equals"}
                                onChange={(e) => updateCondition(index, { operator: e.target.value })}
                              >
                                <option value="equals">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="gte">Greater or Equal</option>
                              </select>

                              <input
                                className="input"
                                placeholder="Value"
                                value={step.content?.condition?.value || ""}
                                onChange={(e) => updateCondition(index, { value: e.target.value })}
                              />

                              <select
                                className="select"
                                value={step.content?.onFailure || "exit"}
                                onChange={(e) => updateStepContent(index, { onFailure: e.target.value })}
                              >
                                <option value="exit">Exit drip if false</option>
                                <option value="skip">Skip next step if false</option>
                              </select>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <button className="btn" onClick={saveSteps}>Save Steps</button>
                <button className="btn secondary" onClick={activate}>Activate</button>

                <input
                  className="input"
                  placeholder="Test phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <button className="btn" onClick={enroll}>Enroll Test Phone</button>
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

function evaluateCondition(condition: any, data: any) {
  if (!condition || !condition.field) return true;

  const value = data[condition.field];
  const target = condition.value;

  if (condition.operator === "equals") {
    return String(value) === String(target);
  }

  if (condition.operator === "contains") {
    return String(value || "")
      .toLowerCase()
      .includes(String(target || "").toLowerCase());
  }

  if (condition.operator === "gte") {
    return Number(value || 0) >= Number(target || 0);
  }

  return true;
}

new Worker(
  "automations",
  async (job) => {
    const { executionId, stepIndex = 0, payload = {} } = job.data;

    const execution = await (prisma as any).workflowExecution.findUnique({
      where: { id: executionId },
      include: { workflow: true },
    });

    if (!execution || execution.status !== "RUNNING") return;

    const steps = execution.workflow.steps || [];

    const complete = async () => {
      await (prisma as any).workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    };

    const fail = async (message: string) => {
      await (prisma as any).workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: "FAILED",
          error: message,
        },
      });
    };

    const scheduleNext = async (index: number, delay: number) => {
      await automationQueue.add(
        "run-automation",
        { executionId, stepIndex: index, payload },
        { delay, attempts: 3 }
      );
    };

    if (stepIndex >= steps.length) {
      await complete();
      return;
    }

    const step = steps[stepIndex];

    try {
      if (step.type === "wait") {
        const value = Number(step.value || 1);
        const unit = step.unit || "minutes";

        const delay = unit === "hours" ? value * 3600000 : value * 60000;

        await scheduleNext(stepIndex + 1, delay);
        return;
      }

      if (step.type === "condition") {
        let data = payload;

        if (payload.leadId) {
          const lead = await (prisma as any).lead.findUnique({
            where: { id: payload.leadId },
          });

          if (lead) data = lead;
        }

        const passed = evaluateCondition(step.condition, data);

        if (!passed) {
          if (step.onFailure === "skip") {
            await scheduleNext(stepIndex + 2, 1000);
            return;
          }

          await complete();
          return;
        }

        await scheduleNext(stepIndex + 1, 1000);
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
          headers: { "Content-Type": "application/json" },
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

      await scheduleNext(stepIndex + 1, 1000);
    } catch (error: any) {
      logger.error({ error }, "Automation step failed");
      await fail(error?.message || "Step failed");
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

logger.info("Automation worker started");
`;

files["app/(dashboard)/automation-builder/page.tsx"] = `
"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function AutomationBuilderPage() {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("lead.created");
  const [steps, setSteps] = useState<any[]>([]);
  const [selectedStep, setSelectedStep] = useState<number>(-1);

  const addAction = (type: string) => {
    setSteps([
      ...steps,
      {
        type,
        label: type,
        value: 1,
        unit: "minutes",
        body: "",
        tag: "",
        url: "",
        condition: {
          field: "status",
          operator: "equals",
          value: "INTERESTED",
        },
        onFailure: "skip",
      },
    ]);
  };

  const updateStep = (index: number, patch: any) => {
    setSteps(
      steps.map((step, i) =>
        i === index ? Object.assign({}, step, patch) : step
      )
    );
  };

  const updateCondition = (index: number, patch: any) => {
    const step = steps[index];

    updateStep(index, {
      condition: Object.assign({}, step.condition, patch),
    });
  };

  const reorder = (from: number, to: number) => {
    if (from === to) return;

    const copy = [...steps];
    const item = copy[from];

    copy.splice(from, 1);
    copy.splice(to, 0, item);

    setSteps(copy);
  };

  const save = async () => {
    const cleanSteps = steps.map((step) => {
      if (step.type === "wait") {
        return {
          type: "wait",
          value: step.value,
          unit: step.unit,
        };
      }

      if (step.type === "send_whatsapp") {
        return {
          type: "send_whatsapp",
          body: step.body,
        };
      }

      if (step.type === "add_tag") {
        return {
          type: "add_tag",
          tag: step.tag,
        };
      }

      if (step.type === "webhook") {
        return {
          type: "webhook",
          url: step.url,
        };
      }

      if (step.type === "condition") {
        return {
          type: "condition",
          condition: step.condition,
          onFailure: step.onFailure,
        };
      }

      return step;
    });

    const res = await fetch("/api/v1/workflows", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name,
        trigger,
        steps: cleanSteps,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Automation saved.");
      setName("");
      setSteps([]);
    } else {
      alert(data.error?.message || "Failed to save.");
    }
  };

  return (
    <div>
      <Topbar title="Automation Builder" subtitle="Visual trigger + condition branches" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Trigger</div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              className="input"
              placeholder="Automation name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select className="select" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="lead.created">Lead Created</option>
              <option value="lead.imported">Lead Imported</option>
              <option value="whatsapp.message.received">WhatsApp Message Received</option>
              <option value="contact.created">Contact Created</option>
            </select>
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>Actions</div>

          <div className="grid grid-2">
            <div
              className="palette-item"
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData("action-type", "wait")}
              onClick={() => addAction("wait")}
            >
              Wait
            </div>

            <div
              className="palette-item"
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData("action-type", "send_whatsapp")}
              onClick={() => addAction("send_whatsapp")}
            >
              Send WhatsApp
            </div>

            <div
              className="palette-item"
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData("action-type", "add_tag")}
              onClick={() => addAction("add_tag")}
            >
              Add Tag
            </div>

            <div
              className="palette-item"
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData("action-type", "webhook")}
              onClick={() => addAction("webhook")}
            >
              Webhook
            </div>

            <div
              className="palette-item"
              draggable
              onDragStart={(e: any) => e.dataTransfer.setData("action-type", "condition")}
              onClick={() => addAction("condition")}
            >
              Condition
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Workflow</div>

          <div
            className="dropzone"
            onDragOver={(e: any) => e.preventDefault()}
            onDrop={(e: any) => {
              e.preventDefault();

              const type = e.dataTransfer.getData("action-type");

              if (type) addAction(type);
            }}
          >
            <div className="step-item">
              <strong>Trigger</strong>
              <div className="muted">{trigger}</div>
            </div>

            {steps.map((step: any, index: number) => (
              <div
                key={index}
                className="step-item"
                draggable
                onDragStart={(e: any) => e.dataTransfer.setData("step-index", String(index))}
                onDragOver={(e: any) => e.preventDefault()}
                onDrop={(e: any) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const from = Number(e.dataTransfer.getData("step-index"));

                  if (!isNaN(from)) reorder(from, index);
                }}
                onClick={() => setSelectedStep(index)}
              >
                <div className="step-header">
                  <div>
                    <strong>Action {index + 1}</strong>
                    <div className="muted">{step.type}</div>
                  </div>

                  <button
                    className="btn danger small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSteps(steps.filter((_, i) => i !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>

                {selectedStep === index ? (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {step.type === "wait" ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="input"
                          type="number