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

files["scripts/add-client-billing-models.mjs"] = `
import fs from "fs";
import path from "path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("ERROR: prisma/schema.prisma not found.");
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, "utf8");
let changed = false;

if (!schema.includes("logoUrl")) {
  schema = schema.replace(
    "model Organization {",
    "model Organization {\\n  logoUrl       String?"
  );
  changed = true;
}

if (!schema.includes("primaryColor")) {
  schema = schema.replace(
    "model Organization {",
    "model Organization {\\n  primaryColor  String?"
  );
  changed = true;
}

if (!schema.includes("customDomain")) {
  schema = schema.replace(
    "model Organization {",
    "model Organization {\\n  customDomain  String? @unique"
  );
  changed = true;
}

if (!schema.includes("plan ")) {
  schema = schema.replace(
    "model Organization {",
    'model Organization {\\n  plan          String @default("starter")'
  );
  changed = true;
}

if (!schema.includes("model Subscription")) {
  schema += [
    "",
    "model Subscription {",
    "  id             String    @id @default(cuid())",
    "  organizationId String",
    "  provider       String   @default(\"razorpay\")",
    "  customerId     String?",
    "  subscriptionId String?",
    "  priceId        String?",
    "  plan           String",
    "  status         String   @default(\"active\")",
    "  currentPeriodEnd DateTime?",
    "",
    "  createdAt DateTime @default(now())",
    "  updatedAt DateTime @updatedAt",
    "",
    "  @@index([organizationId, status])",
    "}",
    ""
  ].join("\\n");

  changed = true;
}

if (!schema.includes("model CustomDomain")) {
  schema += [
    "",
    "model CustomDomain {",
    "  id                String    @id @default(cuid())",
    "  organizationId    String",
    "  domain            String",
    "  status            String    @default(\"PENDING\")",
    "  verificationToken String",
    "  target            String?",
    "  verifiedAt        DateTime?",
    "",
    "  createdAt DateTime @default(now())",
    "  updatedAt DateTime @updatedAt",
    "",
    "  @@unique([organizationId, domain])",
    "  @@index([status])",
    "}",
    ""
  ].join("\\n");

  changed = true;
}

if (changed) {
  fs.writeFileSync(schemaPath, schema);
  console.log("Client platform models added.");
} else {
  console.log("Client platform models already exist.");
}
`;

files["web/lib/billing.ts"] = `
import crypto from "crypto";

export const billingPlans = {
  starter: {
    id: "starter",
    name: "Starter",
    amount: 0,
    envPlan: "",
  },
  growth: {
    id: "growth",
    name: "Growth",
    amount: 4999,
    envPlan: "RAZORPAY_PLAN_GROWTH",
  },
  agency: {
    id: "agency",
    name: "Agency",
    amount: 14999,
    envPlan: "RAZORPAY_PLAN_AGENCY",
  },
};

export function razorpayAuthHeader() {
  const key = process.env.RAZORPAY_KEY_ID || "";
  const secret = process.env.RAZORPAY_KEY_SECRET || "";

  return "Basic " + Buffer.from(key + ":" + secret).toString("base64");
}

export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string
) {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";

  const expected = crypto
    .createHmac("sha256", secret)
    .update(subscriptionId + "|" + paymentId)
    .digest("hex");

  return expected === signature;
}
`;

files["web/app/api/v1/whitelabel/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "settings.read");
  await rateLimit("whitelabel:read:" + ctx.session.user.id, 60, 60);

  const organization = await prisma.organization.findFirst({
    where: { id: ctx.organizationId },
    select: {
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      customDomain: true,
      plan: true,
    },
  });

  return NextResponse.json(organization);
});

export const PUT = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "settings.write");
  await rateLimit("whitelabel:write:" + ctx.session.user.id, 30, 60);

  const body = await req.json();

  const organization = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: {
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || null,
      customDomain: body.customDomain || null,
    },
  });

  return NextResponse.json(organization);
});
`;

files["web/app/api/v1/whitelabel/domain/route.ts"] = `
import { NextResponse } from "next/server";
import crypto from "crypto";
import { promises as dns } from "dns";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "settings.read");
  await rateLimit("domain:status:" + ctx.session.user.id, 60, 60);

  const domainRecord = await (prisma as any).customDomain.findFirst({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (!domainRecord) {
    return NextResponse.json({ status: "NONE" });
  }

  let verified = false;

  try {
    const txtRecords = await dns.resolveTxt(domainRecord.domain);
    const flatTxt = txtRecords.flat().join(" ");

    if (flatTxt.includes(domainRecord.verificationToken)) {
      verified = true;
    }
  } catch {}

  if (!verified && domainRecord.target) {
    try {
      const cnameRecords = await dns.resolveCname(domainRecord.domain);

      if (cnameRecords.includes(domainRecord.target)) {
        verified = true;
      }
    } catch {}
  }

  if (verified) {
    await (prisma as any).customDomain.update({
      where: { id: domainRecord.id },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    await prisma.organization.update({
      where: { id: ctx.organizationId },
      data: {
        customDomain: domainRecord.domain,
      },
    });
  } else {
    await (prisma as any).customDomain.update({
      where: { id: domainRecord.id },
      data: {
        status: "PENDING",
      },
    });
  }

  return NextResponse.json({
    status: verified ? "VERIFIED" : "PENDING",
    domain: domainRecord.domain,
    verificationToken: domainRecord.verificationToken,
    target: domainRecord.target,
  });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "settings.write");
  await rateLimit("domain:request:" + ctx.session.user.id, 20, 60);

  const body = await req.json();

  const domain = String(body.domain || "").toLowerCase().trim();

  if (!domain) {
    return NextResponse.json({ error: "Domain required" }, { status: 400 });
  }

  const token = "flowpilot-verification=" + crypto.randomBytes(24).toString("hex");
  const target = process.env.CUSTOM_DOMAIN_TARGET || "flowpilot.app";

  const domainRecord = await (prisma as any).customDomain.upsert({
    where: {
      organizationId_domain: {
        organizationId: ctx.organizationId,
        domain,
      },
    },
    update: {
      verificationToken: token,
      target,
      status: "PENDING",
    },
    create: {
      organizationId: ctx.organizationId,
      domain,
      verificationToken: token,
      target,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    domain: domainRecord.domain,
    verificationToken: token,
    target,
    dnsInstructions: {
      TXT: token,
      CNAME: target,
    },
  });
});
`;

files["web/app/api/v1/billing/subscriptions/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "billing.read");
  await rateLimit("billing:subscriptions:" + ctx.session.user.id, 60, 60);

  const organization = await prisma.organization.findFirst({
    where: { id: ctx.organizationId },
    select: {
      name: true,
      slug: true,
      plan: true,
    },
  });

  const subscriptions = await (prisma as any).subscription.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ organization, subscriptions });
});
`;

files["web/app/api/v1/billing/razorpay/subscription/create/route.ts"] = `
import { NextResponse } from "next/server";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { razorpayAuthHeader, billingPlans } from "@/lib/billing";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit("razorpay:subscription:create:" + ctx.session.user.id, 10, 60);

  const body = await req.json();

  const plan = billingPlans[body.plan as keyof typeof billingPlans];

  if (!plan) {
    throw new ApiError(400, "Invalid plan", "INVALID_PLAN");
  }

  if (plan.id === "starter") {
    throw new ApiError(400, "Starter plan is free", "FREE_PLAN");
  }

  const planId = process.env[plan.envPlan];

  if (!planId) {
    throw new ApiError(400, "Razorpay plan ID missing", "PLAN_ID_MISSING");
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(400, "Razorpay not configured", "RAZORPAY_MISSING");
  }

  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: {
      Authorization: razorpayAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
      notes: {
        organizationId: ctx.organizationId,
        plan: plan.id,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(400, data?.error?.description || "Razorpay error", "RAZORPAY_ERROR");
  }

  return NextResponse.json({
    keyId: process.env.RAZORPAY_KEY_ID,
    subscription: data,
  });
});
`;

files["web/app/api/v1/billing/razorpay/subscription/verify/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { verifySubscriptionSignature } from "@/lib/billing";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit("razorpay:subscription:verify:" + ctx.session.user.id, 10, 60);

  const body = await req.json();

  const subscriptionId = body.subscriptionId || body.razorpay_subscription_id || "";
  const paymentId = body.paymentId || body.razorpay_payment_id || "";
  const signature = body.signature || body.razorpay_signature || "";
  const plan = body.plan || "growth";

  if (!subscriptionId || !paymentId || !signature) {
    throw new ApiError(400, "Missing payment fields", "MISSING_FIELDS");
  }

  const valid = verifySubscriptionSignature(subscriptionId, paymentId, signature);

  if (!valid) {
    throw new ApiError(400, "Invalid signature", "INVALID_SIGNATURE");
  }

  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { plan },
  });

  await (prisma as any).subscription.create({
    data: {
      organizationId: ctx.organizationId,
      provider: "razorpay",
      subscriptionId,
      plan,
      status: "active",
    },
  });

  return NextResponse.json({ success: true });
});
`;

files["web/app/api/v1/billing/razorpay/subscription/cancel/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { razorpayAuthHeader } from "@/lib/billing";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "billing.write");
  await rateLimit("razorpay:subscription:cancel:" + ctx.session.user.id, 10, 60);

  const subscription = await (prisma as any).subscription.findFirst({
    where: {
      organizationId: ctx.organizationId,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    throw new ApiError(404, "No active subscription", "NOT_FOUND");
  }

  if (subscription.subscriptionId) {
    await fetch(
      "https://api.razorpay.com/v1/subscriptions/" + subscription.subscriptionId + "/cancel",
      {
        method: "PATCH",
        headers: {
          Authorization: razorpayAuthHeader(),
        },
      }
    );
  }

  await (prisma as any).subscription.update({
    where: { id: subscription.id },
    data: { status: "canceled" },
  });

  await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: { plan: "starter" },
  });

  return NextResponse.json({ success: true });
});
`;

files["web/app/api/v1/agency/clients/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "agency.read");
  await rateLimit("agency:clients:" + ctx.session.user.id, 60, 60);

  const items = await prisma.organization.findMany({
    where: { parentId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
});

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "agency.write");
  await rateLimit("agency:clients:create:" + ctx.session.user.id, 20, 60);

  const body = await req.json();

  const client = await prisma.organization.create({
    data: {
      name: body.name || "New Client",
      slug: body.slug || "client-" + Date.now(),
      plan: body.plan || "starter",
      parentId: ctx.organizationId,
    },
  });

  await prisma.membership.create({
    data: {
      userId: ctx.session.user.id,
      organizationId: client.id,
      role: "OWNER",
      active: true,
    },
  });

  return NextResponse.json(client, { status: 201 });
});
`;

files["web/app/api/v1/agency/clients/[id]/billing/route.ts"] = `
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

export const POST = secureApi(async (req, context, ctx) => {
  requirePermission(ctx.role, "agency.write");
  await rateLimit("agency:client:billing:" + ctx.session.user.id, 20, 60);

  const client = await prisma.organization.findFirst({
    where: {
      id: context.params.id,
      parentId: ctx.organizationId,
    },
  });

  if (!client) {
    throw new ApiError(404, "Client not found", "NOT_FOUND");
  }

  const body = await req.json();

  await prisma.organization.update({
    where: { id: client.id },
    data: {
      plan: body.plan || client.plan,
    },
  });

  const subscription = await (prisma as any).subscription.create({
    data: {
      organizationId: client.id,
      provider: body.provider || "agency",
      plan: body.plan || client.plan,
      status: body.status || "active",
    },
  });

  return NextResponse.json({ success: true, subscription });
});
`;

files["web/app/(dashboard)/settings/custom-domain/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function CustomDomainPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [status, setStatus] = useState<any | null>(null);

  const loadStatus = async () => {
    const res = await fetch("/api/v1/whitelabel/domain", {
      headers: orgHeaders(),
    });

    const data = await res.json();
    setStatus(data);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const requestDomain = async () => {
    const res = await fetch("/api/v1/whitelabel/domain", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ domain }),
    });

    const data = await res.json();
    setResult(data);
    loadStatus();
  };

  return (
    <div>
      <Topbar title="Custom Domain" subtitle="White-label domain automation" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Add Domain</div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="app.clientdomain.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />

          <button className="btn" onClick={requestDomain}>
            Request Domain
          </button>
        </div>
      </div>

      {result ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">DNS Setup</div>

          <div className="muted">Add these DNS records at your domain provider.</div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div>
              <div className="label">TXT Record</div>
              <input className="input" readOnly value={result.verificationToken || ""} />
            </div>

            <div>
              <div className="label">CNAME Target</div>
              <input className="input" readOnly value={result.target || ""} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="card-title">Verification Status</div>

        {status ? (
          <div>
            <div className="badge info">{status.status}</div>

            {status.domain ? (
              <div className="muted" style={{ marginTop: 10 }}>
                Domain: {status.domain}
              </div>
            ) : null}

            <div style={{ marginTop: 12 }}>
              <button className="btn secondary" onClick={loadStatus}>
                Verify Again
              </button>
            </div>
          </div>
        ) : (
          <div className="muted">No domain requested yet.</div>
        )}
      </div>
    </div>
  );
}
`;

files["web/app/(dashboard)/billing-portal/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function BillingPortalPage() {
  const [data, setData] = useState<any | null>(null);

  const load = async () => {
    const res = await fetch("/api/v1/billing/subscriptions", {
      headers: orgHeaders(),
    });

    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    load();
  }, []);

  const upgrade = async (plan: string) => {
    const res = await fetch("/api/v1/billing/razorpay/subscription/create", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ plan }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error?.message || "Razorpay not configured.");
      return;
    }

    await loadRazorpay();

    const options = {
      key: json.keyId,
      subscription_id: json.subscription.id,
      name: "FlowPilot Pro",
      description: plan + " subscription",
      handler: async (response: any) => {
        const verifyRes = await fetch("/api/v1/billing/razorpay/subscription/verify", {
          method: "POST",
          headers: orgHeaders(),
          body: JSON.stringify({
            plan,
            subscriptionId: response.razorpay_subscription_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        });

        const verifyJson = await verifyRes.json();

        if (verifyJson.success) {
          alert("Subscription activated.");
          load();
        } else {
          alert(verifyJson.error?.message || "Verification failed.");
        }
      },
      theme: {
        color: "#6366f1",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const cancel = async () => {
    const ok = confirm("Cancel subscription?");

    if (!ok) return;

    await fetch("/api/v1/billing/razorpay/subscription/cancel", {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  return (
    <div>
      <Topbar title="Billing Portal" subtitle="Razorpay subscription management" />

      <div className="card hero" style={{ marginBottom: 16 }}>
        <div className="card-title">Current Plan</div>

        {data ? (
          <div>
            <div className="stat-value">{data.organization?.plan || "starter"}</div>
            <div className="muted">{data.organization?.name}</div>
          </div>
        ) : (
          <div className="muted">Loading...</div>
        )}
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Starter</div>
          <div className="stat-value">Free</div>
          <div className="muted">Basic CRM</div>
        </div>

        <div className="card">
          <div className="card-title">Growth</div>
          <div className="stat-value">₹4,999</div>
          <div className="muted">Campaigns + automations</div>

          <button className="btn" style={{ marginTop: 12 }} onClick={() => upgrade("growth")}>
            Upgrade
          </button>
        </div>

        <div className="card">
          <div className="card-title">Agency</div>
          <div className="stat-value">₹14,999</div>
          <div className="muted">Multi-client + white-label</div>

          <button className="btn" style={{ marginTop: 12 }} onClick={() => upgrade("agency")}>
            Upgrade
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Subscription History</div>

        {data && (data.subscriptions || []).length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {(data.subscriptions || []).map((sub: any) => (
                  <tr key={sub.id}>
                    <td>{sub.provider}</td>
                    <td>{sub.plan}</td>
                    <td>{sub.status}</td>
                    <td>{new Date(sub.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="muted">No subscriptions yet.</div>
        )}

        <div style={{ marginTop: 14 }}>
          <button className="btn danger" onClick={cancel}>
            Cancel Active Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
`;

files["web/app/(dashboard)/agency-billing/page.tsx"] = `
"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function AgencyBillingPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [plan, setPlan] = useState("growth");
  const [status, setStatus] = useState("active");

  const load = async () => {
    const res = await fetch("/api/v1/agency/clients", {
      headers: orgHeaders(),
    });

    const data = await res.json();
    setClients(data.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const updateBilling = async () => {
    if (!selected) return;

    await fetch("/api/v1/agency/clients/" + selected.id + "/billing", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ plan, status, provider: "agency" }),
    });

    alert("Client billing updated.");
    load();
  };

  return (
    <div>
      <Topbar title="Agency Client Billing" subtitle="Manage client plans and billing" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Clients</div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Plan</th>
                  <th>Select</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client: any) => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.slug}</td>
                    <td>{client.plan}</td>
                    <td>
                      <button
                        className="btn secondary small"
                        onClick={() => setSelected(client)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            {selected ? selected.name : "Select a client"}
          </div>

          {selected ? (
            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label className="label">Plan</label>

                <select className="select" value={plan} onChange={(e) => setPlan(e.target.value)}>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="agency">Agency</option>
                </select>
              </div>

              <div>
                <label className="label">Billing Status</label>

                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="canceled">Canceled</option>
                  <option value="trial">Trial</option>
                </select>
              </div>

              <button className="btn" onClick={updateBilling}>
                Update Billing
              </button>
            </div>
          ) : (
            <div className="muted">Select a client to update billing.</div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

files["web/components/PWARegister.tsx"] = `
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
`;

files["web/components/PWAInstall.tsx"] = `
"use client";

import { useEffect, useState } from "react";

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (!deferredPrompt) return null;

  const install = async () => {
    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <button
      onClick={install}
      className="btn"
      style={{
        position: "fixed",
        bottom: 18,
        right: 18,
        zIndex: 100,
      }}
    >
      Install App
    </button>
  );
}
`;

files["web/app/layout.tsx"] = `
import type { ReactNode } from "react";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import PWAInstall from "@/components/PWAInstall";

export const metadata = {
  title: "FlowPilot Pro",
  description: "GoHighLevel-style SaaS automation platform",
};

export const viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PWARegister />
        <PWAInstall />
      </body>
    </html>
  );
}
`;

files["web/app/manifest.ts"] = `
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowPilot Pro",
    short_name: "FlowPilot",
    description: "GoHighLevel-style SaaS automation platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#070b14",
    theme_color: "#070b14",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
`;

files["web/public/sw.js"] = `
const CACHE_NAME = "flowpilot-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

files["web/components/Sidebar.tsx"] = `
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
  { href: "/posters/templates", label: "Poster Templates", icon: "📚" },
  { href: "/broadcast-advanced", label: "Broadcast", icon: "📣" },
  { href: "/drip", label: "Drip Builder", icon: "💧" },
  { href: "/automation-builder", label: "Automation Builder", icon: "⚡" },
  { href: "/support", label: "Support", icon: "🎫" },
  { href: "/billing-portal", label: "Billing Portal", icon: "💳" },
  { href: "/agency-billing", label: "Agency Billing", icon: "🏢" },
  { href: "/settings/custom-domain", label: "Custom Domain", icon: "🌐" },
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

files["scripts/vps-audit.sh"] = `
#!/usr/bin/env bash
set -euo pipefail

REPORT="VPS-AUDIT-REPORT.txt"

echo "FlowPilot VPS Audit" > "$REPORT"
echo "Date: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

echo "Docker check" >> "$REPORT"
if command -v docker >/dev/null 2>&1; then
  echo "OK: docker installed" >> "$REPORT"
else
  echo "FAIL: docker not installed" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "Docker Compose services" >> "$REPORT"
docker compose ps >> "$REPORT" || true

echo "" >> "$REPORT"
echo "Disk usage" >> "$REPORT"
df -h >> "$REPORT" || true

echo "" >> "$REPORT"
echo "Memory usage" >> "$REPORT"
free -m >> "$REPORT" || true

echo "" >> "$REPORT"
echo "Environment check" >> "$REPORT"
if [ -f .env ]; then
  echo "OK: .env found" >> "$REPORT"

  if grep -q CHANGE_ME .env; then
    echo "WARNING: CHANGE_ME values found in .env" >> "$REPORT"
  else
    echo "OK: no CHANGE_ME values" >> "$REPORT"
  fi
else
  echo "FAIL: .env missing" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "Health check" >> "$REPORT"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || true)
echo "App health status: $STATUS" >> "$REPORT"

echo "" >> "$REPORT"
echo "Recent error logs" >> "$REPORT"
{ docker compose logs --tail=200 | grep -i error || true; } >> "$REPORT"

echo "" >> "$REPORT"
echo "Backups folder" >> "$REPORT"
if [ -d backups ]; then
  echo "OK: backups folder exists" >> "$REPORT"
  ls -lh backups >> "$REPORT" || true
else
  echo "WARNING: backups folder missing" >> "$REPORT"
fi

echo "Audit complete. See $REPORT"
cat "$REPORT"
`;

files["docs/VPS-BUGFIX-AUDIT.md"] = `
# VPS Bug-Fix Audit

Run audit:

bash scripts/vps-audit.sh

Report file:

VPS-AUDIT-REPORT.txt

## Common Errors and Fixes

### 1. Port already in use

Error:
bind: address already in use

Fix:
Find process using port 3000, 5432, 6379, 5678 or 8080.

Change port in .env:
WEB_PORT
N8N_PORT_HOST
EVOLUTION_PORT

### 2. Database connection refused

Fix:
- Check Postgres container is healthy.
- Check DATABASE_URL.
- Restart Postgres.

Command:
bash scripts/logs.sh postgres

### 3. Prisma table does not exist

Fix:
docker compose exec web node scripts/add-client-billing-models.mjs
docker compose exec web npx prisma db push --skip-generate
docker compose exec web npx prisma generate
docker compose restart

### 4. NextAuth redirect loop

Fix:
- Set NEXTAUTH_URL to exact production URL.
- Use HTTPS.
- Set NEXTAUTH_SECRET.
- Clear browser cookies.

### 5. Evolution API not connecting

Fix:
- Check EVOLUTION_API_URL is http://evolution:8080 inside Docker.
- Check EVOLUTION_API_KEY matches Evolution service.
- Check Evolution logs.

Command:
bash scripts/logs.sh evolution

### 6. Razorpay signature failed

Fix:
- Verify RAZORPAY_KEY_SECRET.
- Use correct subscription signature format.
- Check Razorpay test/live mode keys match.

### 7. PWA install button not showing

Fix:
- Open in Chrome/Edge.
- Use HTTPS.
- Check manifest loads.
- Check service worker registered.
- Open DevTools → Application → Manifest.

### 8. Custom domain not verifying

Fix:
- Add TXT record exactly.
- Add CNAME record.
- Wait for DNS propagation.
- Click Verify Again.

### 9. Disk full

Fix:
- Remove old Docker images.
- Rotate logs.
- Delete old backups carefully.

Commands:
docker system prune
df -h

### 10. Worker not sending messages

Fix:
- Check worker logs.
- Check WhatsApp instance connected.
- Check contacts have phone numbers.
- Check consent status is OPTED_IN.

Commands:
bash scripts/logs.sh broadcast-worker
bash scripts/logs.sh drip-worker
bash scripts/logs.sh automation-worker
`;

for (const [file, content] of Object.entries(files)) {
  write(file, content);
}

console.log("Client platform pack added.");