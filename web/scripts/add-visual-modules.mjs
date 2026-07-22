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

files["scripts/add-poster-design-model.mjs"] = `
import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("ERROR: prisma/schema.prisma not found.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");

if (schema.includes("model PosterDesign")) {
  console.log("PosterDesign model already exists.");
  process.exit(0);
}

const modelLines = [
  "",
  "model PosterDesign {",
  "  id             String @id @default(cuid())",
  "  organizationId String",
  "  name           String",
  "  elements       Json",
  "  width          Int    @default(600)",
  "  height         Int    @default(800)",
  "",
  "  createdAt DateTime @default(now())",
  "  updatedAt DateTime @updatedAt",
  "",
  "  @@index([organizationId])",
  "}",
  ""
];

schema += modelLines.join("\\n");

fs.writeFileSync(schemaPath, schema);

console.log("PosterDesign model added.");
`;

files["app/api/v1/poster-designs/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("poster-designs:list:" + ctx.session.user.id, 120, 60);

  const items = await (prisma as any).posterDesign.findMany({
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
  await rateLimit("poster-designs:create:" + ctx.session.user.id, 30, 60);

  const body = await req.json();

  const design = await (prisma as any).posterDesign.create({
    data: {
      organizationId: ctx.organizationId,
      name: body.name || "Untitled Design",
      elements: body.elements || [],
      width: Number(body.width || 600),
      height: Number(body.height || 800),
    },
  });

  return NextResponse.json(design, { status: 201 });
});
`;

files["app/api/v1/poster-designs/[id]/png/route.tsx"] = `
import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: Request, context: any) {
  const design = await (prisma as any).posterDesign.findFirst({
    where: {
      id: context.params.id,
    },
  });

  if (!design) {
    return new Response("Design not found", { status: 404 });
  }

  const elements = design.elements || [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#0f172a",
        }}
      >
        {elements.map((el: any) => {
          if (el.type === "text") {
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  display: "flex",
                  left: el.x + "px",
                  top: el.y + "px",
                  fontSize: el.fontSize + "px",
                  color: el.color || "#ffffff",
                }}
              >
                {el.text}
              </div>
            );
          }

          if (el.type === "image") {
            return (
              <img
                key={el.id}
                src={el.src}
                width={el.width || 200}
                height={el.height || 200}
                style={{
                  position: "absolute",
                  display: "flex",
                  left: el.x + "px",
                  top: el.y + "px",
                  objectFit: "cover",
                }}
              />
            );
          }

          if (el.type === "rect") {
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  display: "flex",
                  left: el.x + "px",
                  top: el.y + "px",
                  width: el.width + "px",
                  height: el.height + "px",
                  background: el.color || "#4f46e5",
                }}
              />
            );
          }

          return null;
        })}
      </div>
    ),
    {
      width: design.width || 600,
      height: design.height || 800,
    }
  );
}
`;

files["app/api/v1/broadcasts-advanced/audience/count/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "campaigns.read");
  await rateLimit("broadcast:audience:" + ctx.session.user.id, 60, 60);

  const body = await req.json();
  const audience = body.audience || {};

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

  const count = await (prisma as any).lead.count({ where });

  return NextResponse.json({ count });
});
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

files["app/(dashboard)/posters/editor/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function PosterEditorPage() {
  const [elements, setElements] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [name, setName] = useState("");
  const [designs, setDesigns] = useState<any[]>([]);

  const loadDesigns = async () => {
    try {
      const res = await fetch("/api/v1/poster-designs", {
        headers: orgHeaders(),
      });

      const data = await res.json();
      setDesigns(data.items || []);
    } catch {
      setDesigns([]);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const selected = elements.find((item) => item.id === selectedId) || null;

  const addText = () => {
    const id = "text_" + Date.now();

    setElements([
      ...elements,
      {
        id,
        type: "text",
        x: 60,
        y: 60,
        text: "Your Offer",
        fontSize: 42,
        color: "#ffffff",
      },
    ]);

    setSelectedId(id);
  };

  const addImage = () => {
    const id = "image_" + Date.now();

    setElements([
      ...elements,
      {
        id,
        type: "image",
        x: 80,
        y: 220,
        src: "https://picsum.photos/300/300",
        width: 300,
        height: 300,
      },
    ]);

    setSelectedId(id);
  };

  const addRect = () => {
    const id = "rect_" + Date.now();

    setElements([
      ...elements,
      {
        id,
        type: "rect",
        x: 40,
        y: 400,
        width: 520,
        height: 120,
        color: "#4f46e5",
      },
    ]);

    setSelectedId(id);
  };

  const updateSelected = (patch: any) => {
    if (!selectedId) return;

    setElements(
      elements.map((el) =>
        el.id === selectedId ? Object.assign({}, el, patch) : el
      )
    );
  };

  const onMouseDown = (e: any, el: any) => {
    const rect = e.currentTarget.getBoundingClientRect();

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    setSelectedId(el.id);
  };

  const onMouseMove = (e: any) => {
    if (!selectedId) return;

    const canvas = document.getElementById("poster-canvas");

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setElements(
      elements.map((el) =>
        el.id === selectedId
          ? Object.assign({}, el, {
              x: Math.max(0, x),
              y: Math.max(0, y),
            })
          : el
      )
    );
  };

  const onMouseUp = () => {
    setSelectedId("");
  };

  const save = async () => {
    await fetch("/api/v1/poster-designs", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name: name || "Untitled Design",
        elements,
        width: 600,
        height: 800,
      }),
    });

    setName("");
    loadDesigns();
    alert("Design saved.");
  };

  return (
    <div>
      <Topbar title="Poster Editor" subtitle="Drag and drop marketing poster builder" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Tools</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <button className="btn" onClick={addText}>Add Text</button>
            <button className="btn" onClick={addImage}>Add Image</button>
            <button className="btn" onClick={addRect}>Add Box</button>
          </div>

          {selected ? (
            <div style={{ display: "grid", gap: 10 }}>
              {selected.type === "text" ? (
                <div>
                  <label className="label">Text</label>
                  <input
                    className="input"
                    value={selected.text}
                    onChange={(e) => updateSelected({ text: e.target.value })}
                  />

                  <label className="label">Font Size</label>
                  <input
                    className="input"
                    type="number"
                    value={selected.fontSize}
                    onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                  />

                  <label className="label">Color</label>
                  <input
                    className="input"
                    value={selected.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                  />
                </div>
              ) : null}

              {selected.type === "image" ? (
                <div>
                  <label className="label">Image URL</label>
                  <input
                    className="input"
                    value={selected.src}
                    onChange={(e) => updateSelected({ src: e.target.value })}
                  />

                  <label className="label">Width</label>
                  <input
                    className="input"
                    type="number"
                    value={selected.width}
                    onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                  />

                  <label className="label">Height</label>
                  <input
                    className="input"
                    type="number"
                    value={selected.height}
                    onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                  />
                </div>
              ) : null}

              {selected.type === "rect" ? (
                <div>
                  <label className="label">Width</label>
                  <input
                    className="input"
                    type="number"
                    value={selected.width}
                    onChange={(e) => updateSelected({ width: Number(e.target.value) })}
                  />

                  <label className="label">Height</label>
                  <input
                    className="input"
                    type="number"
                    value={selected.height}
                    onChange={(e) => updateSelected({ height: Number(e.target.value) })}
                  />

                  <label className="label">Color</label>
                  <input
                    className="input"
                    value={selected.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="muted">Select an element to edit.</div>
          )}

          <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
            <label className="label">Design Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

            <button className="btn" onClick={save}>Save Design</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Canvas</div>

          <div
            id="poster-canvas"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              position: "relative",
              width: 600,
              height: 800,
              background: "#0f172a",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {elements.map((el) => (
              <div
                key={el.id}
                onMouseDown={(e) => onMouseDown(e, el)}
                style={{
                  position: "absolute",
                  left: el.x + "px",
                  top: el.y + "px",
                  cursor: "move",
                  outline: el.id === selectedId ? "2px solid #22d3ee" : "none",
                }}
              >
                {el.type === "text" ? (
                  <div
                    style={{
                      fontSize: el.fontSize + "px",
                      color: el.color,
                    }}
                  >
                    {el.text}
                  </div>
                ) : null}

                {el.type === "image" ? (
                  <img
                    src={el.src}
                    width={el.width}
                    height={el.height}
                    alt="poster"
                    style={{ display: "block" }}
                  />
                ) : null}

                {el.type === "rect" ? (
                  <div
                    style={{
                      width: el.width + "px",
                      height: el.height + "px",
                      background: el.color,
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">Saved Designs</div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>PNG</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design: any) => (
                <tr key={design.id}>
                  <td>{design.name}</td>
                  <td>
                    <a
                      className="btn secondary small"
                      href={"/api/v1/poster-designs/" + design.id + "/png"}
                      target="_blank"
                    >
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

files["app/(dashboard)/posters/page.tsx"] = `
"use client";

import Link from "next/link";
import Topbar from "@/components/Topbar";

export default function PostersPage() {
  return (
    <div>
      <Topbar
        title="Poster Studio"
        subtitle="Create marketing posters"
        action={
          <Link className="btn" href="/posters/editor">
            Open Editor
          </Link>
        }
      />

      <div className="card">
        <div className="card-title">Poster Tools</div>

        <p className="muted">
          Use the drag and drop editor to create posters and download PNG.
        </p>

        <div style={{ marginTop: 14 }}>
          <Link className="btn" href="/posters/editor">
            Go to Poster Editor
          </Link>
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
      <Topbar title="Advanced Broadcast" subtitle="Audience builder and bulk queue" />

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
          <div className="card-title">Message</div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <label className="label">Broadcast Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="label">Message</label>
              <textarea className="textarea" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

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

    const mapped = (data.steps || []).map((step: any) => ({
      type: "send_whatsapp",
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
        content: { message: "" },
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
      <Topbar title="Drip Builder" subtitle="Visual sequence builder" />

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
                  Wait / Delay
                </div>

                <div
                  className="palette-item"
                  draggable
                  onDragStart={(e: any) => e.dataTransfer.setData("step-type", "send_whatsapp")}
                  onClick={() => addStep("send_whatsapp")}
                >
                  Send WhatsApp
                </div>
              </div>

              <div
                className="dropzone"
                onDragOver={(e: any) => e.preventDefault()}
                onDrop={(e: any) => {
                  e.preventDefault();

                  const type = e.dataTransfer.getData("step-type");

                  if (type) {
                    addStep(type);
                  }
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

                        if (!isNaN(from)) {
                          reorder(from, index);
                        }
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
      <Topbar title="Automation Builder" subtitle="Visual trigger and action builder" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Trigger</div>

          <div style={{ display: "grid", gap: 10 }}>
            <input className="input" placeholder="Automation name" value={name} onChange={(e) => setName(e.target.value)} />

            <select className="select" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="lead.created">Lead Created</option>
              <option value="lead.imported">Lead Imported</option>
              <option value="whatsapp.message.received">WhatsApp Message Received</option>
              <option value="contact.created">Contact Created</option>
            </select>
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>Actions</div>

          <div className="grid grid-2">
            <div className="palette-item" draggable onDragStart={(e: any) => e.dataTransfer.setData("action-type", "wait")} onClick={() => addAction("wait")}>
              Wait
            </div>

            <div className="palette-item" draggable onDragStart={(e: any) => e.dataTransfer.setData("action-type", "send_whatsapp")} onClick={() => addAction("send_whatsapp")}>
              Send WhatsApp
            </div>

            <div className="palette-item" draggable onDragStart={(e: any) => e.dataTransfer.setData("action-type", "add_tag")} onClick={() => addAction("add_tag")}>
              Add Tag
            </div>

            <div className="palette-item" draggable onDragStart={(e: any) => e.dataTransfer.setData("action-type", "webhook")} onClick={() => addAction("webhook")}>
              Webhook
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

              if (type) {
                addAction(type);
              }
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

                  if (!isNaN(from)) {
                    reorder(from, index);
                  }
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
                          type="number"
                          value={step.value}
                          onChange={(e) => updateStep(index, { value: Number(e.target.value) })}
                        />

                        <select
                          className="select"
                          value={step.unit}
                          onChange={(e) => updateStep(index, { unit: e.target.value })}
                        >
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                        </select>
                      </div>
                    ) : null}

                    {step.type === "send_whatsapp" ? (
                      <textarea
                        className="textarea"
                        rows={3}
                        placeholder="WhatsApp message"
                        value={step.body}
                        onChange={(e) => updateStep(index, { body: e.target.value })}
                      />
                    ) : null}

                    {step.type === "add_tag" ? (
                      <input
                        className="input"
                        placeholder="Tag name"
                        value={step.tag}
                        onChange={(e) => updateStep(index, { tag: e.target.value })}
                      />
                    ) : null}

                    {step.type === "webhook" ? (
                      <input
                        className="input"
                        placeholder="https://"
                        value={step.url}
                        onChange={(e) => updateStep(index, { url: e.target.value })}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn" onClick={save}>Save Automation</button>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  { href: "/posters/editor", label: "Poster Editor", icon: "🎨" },
  { href: "/broadcast-advanced", label: "Broadcast", icon: "📣" },
  { href: "/drip", label: "Drip Builder", icon: "💧" },
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

for (const [file, content] of Object.entries(files)) {
  write(file, content);
}

console.log("Visual modules added.");