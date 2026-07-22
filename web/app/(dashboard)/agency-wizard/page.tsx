"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function AgencyWizardPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    plan: "starter",
    logoUrl: "",
    primaryColor: "#6366f1",
    customDomain: "",
  });

  const createClient = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/v1/agency/clients", {
        method: "POST",
        headers: orgHeaders(),
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          plan: form.plan,
        }),
      });

      const client = await res.json();

      if (!res.ok) {
        alert(client.error?.message || "Failed to create client.");
        return;
      }

      if (form.logoUrl || form.primaryColor || form.customDomain) {
        await fetch("/api/v1/whitelabel", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-org-id": client.id,
          },
          body: JSON.stringify({
            logoUrl: form.logoUrl,
            primaryColor: form.primaryColor,
            customDomain: form.customDomain,
          }),
        });
      }

      setResult(client);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar title="Agency Client Onboarding" subtitle="Create a new client workspace" />

      <div className="card" style={{ maxWidth: 700 }}>
        <div className="card-title">Step {step} of 4</div>

        {step === 1 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Client Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  })
                }
                placeholder="Acme Marketing"
              />
            </div>

            <div>
              <label className="label">Client Slug</label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="acme-marketing"
              />
            </div>

            <button className="btn" onClick={() => setStep(2)} disabled={!form.name || !form.slug}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Plan</label>
              <select
                className="select"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="agency">Agency</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn" onClick={() => setStep(3)}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label className="label">Logo URL</label>
              <input
                className="input"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://clientdomain.com/logo.png"
              />
            </div>

            <div>
              <label className="label">Primary Color</label>
              <input
                className="input"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                placeholder="#6366f1"
              />
            </div>

            <div>
              <label className="label">Custom Domain</label>
              <input
                className="input"
                value={form.customDomain}
                onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                placeholder="app.clientdomain.com"
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn" onClick={createClient} disabled={loading}>
                {loading ? "Creating..." : "Create Client"}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="badge success">Client created successfully</div>

            <div>
              <strong>{result.name}</strong>
              <div className="muted">Slug: {result.slug}</div>
              <div className="muted">Plan: {result.plan}</div>
            </div>

            <div className="card">
              <div className="card-title">White-label Landing Preview</div>
              <a href={`/l/${result.slug}`} target="_blank" className="btn secondary">
                Open /l/{result.slug}
              </a>
            </div>

            <button className="btn" onClick={() => window.location.reload()}>
              Onboard Another Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}