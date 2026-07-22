import Link from "next/link";

export default function LandingPage() {
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
        <div style={{ fontWeight: 800, fontSize: 22 }}>FlowPilot</div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link className="btn secondary small" href="/pricing">
            Pricing
          </Link>
          <Link className="btn small" href="/login">
            Login
          </Link>
        </div>
      </header>

      <section
        style={{
          maxWidth: 900,
          margin: "70px auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <div className="badge info" style={{ marginBottom: 16 }}>
          SaaS Automation Platform
        </div>

        <h1 style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 900 }}>
          Automate your business.
          <br />
          Close more deals.
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
          CRM, WhatsApp inbox, campaigns, automations, billing, support tickets,
          analytics aur n8n workflows — sab ek jagah.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link className="btn" href="/login">
            Start Free
          </Link>
          <Link className="btn secondary" href="/pricing">
            View Pricing
          </Link>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 70px" }}>
        <div className="grid grid-3">
          <div className="card">
            <div className="card-title">CRM + Pipeline</div>
            <p className="muted">
              Contacts, deals, stages, tags, scoring aur pipeline management.
            </p>
          </div>

          <div className="card">
            <div className="card-title">WhatsApp Inbox</div>
            <p className="muted">
              Two-way conversations, worker queue, templates aur inbox UI.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Campaigns</div>
            <p className="muted">
              WhatsApp, email aur SMS campaigns with queue workers.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Automations</div>
            <p className="muted">
              Trigger-based workflows, delays, actions aur execution engine.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Billing</div>
            <p className="muted">
              Razorpay checkout, subscriptions aur plan management.
            </p>
          </div>

          <div className="card">
            <div className="card-title">Support Tickets</div>
            <p className="muted">
              Customer support ticket system with replies and status.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}