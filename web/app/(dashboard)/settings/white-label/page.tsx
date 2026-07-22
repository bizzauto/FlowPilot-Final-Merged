"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function WhiteLabelPage() {
  const [form, setForm] = useState({
    logoUrl: "",
    primaryColor: "#4f46e5",
    customDomain: "",
  });

  const load = async () => {
    try {
      const res = await fetch("/api/v1/whitelabel", { headers: orgHeaders() });
      const data = await res.json();

      setForm({
        logoUrl: data.logoUrl || "",
        primaryColor: data.primaryColor || "#4f46e5",
        customDomain: data.customDomain || "",
      });
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const res = await fetch("/api/v1/whitelabel", {
      method: "PUT",
      headers: orgHeaders(),
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error?.message || "Failed to save");
      return;
    }

    alert("Saved.");
  };

  return (
    <div>
      <Topbar title="White-label" subtitle="Branding settings" />

      <div className="card">
        <div className="card-title">Branding</div>

        <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
          <div>
            <label className="label">Logo URL</label>
            <input
              className="input"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://yourdomain.com/logo.png"
            />
          </div>

          <div>
            <label className="label">Primary Color</label>
            <input
              className="input"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              placeholder="#4f46e5"
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

          <button className="btn" onClick={save}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}