import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WhiteLabelLanding({
  params,
}: {
  params: { slug: string };
}) {
  const organization = await prisma.organization.findFirst({
    where: {
      slug: params.slug,
    },
  });

  if (!organization) {
    notFound();
  }

  const color = organization.primaryColor || "#6366f1";

  return (
    <main style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {organization.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name}
              style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
            >
              {organization.name.charAt(0)}
            </div>
          )}

          <div style={{ fontWeight: 800, fontSize: 22 }}>{organization.name}</div>
        </div>

        <Link
          href="/login"
          className="btn small"
          style={{
            background: color,
          }}
        >
          Login
        </Link>
      </header>

      <section
        style={{
          maxWidth: 850,
          margin: "70px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div
          className="badge"
          style={{
            borderColor: color,
            color: "white",
            background: `${color}22`,
            marginBottom: 16,
          }}
        >
          Powered by FlowPilot
        </div>

        <h1 style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 900 }}>
          {organization.name}
        </h1>

        <p
          className="muted"
          style={{
            fontSize: 18,
            maxWidth: 700,
            margin: "22px auto",
            lineHeight: 1.7,
          }}
        >
          Automate leads, conversations, campaigns and sales with a branded
          business automation workspace.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link
            href="/login"
            className="btn"
            style={{
              background: color,
            }}
          >
            Get Started
          </Link>

          <Link href="/pricing" className="btn secondary">
            View Pricing
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 70px" }}>
        <div className="grid grid-3">
          <div className="card">
            <div className="card-title">CRM</div>
            <p className="muted">Manage contacts, deals and pipeline.</p>
          </div>

          <div className="card">
            <div className="card-title">Inbox</div>
            <p className="muted">WhatsApp, email and support conversations.</p>
          </div>

          <div className="card">
            <div className="card-title">Automations</div>
            <p className="muted">Trigger-based workflows and follow-ups.</p>
          </div>
        </div>
      </section>
    </main>
  );
}