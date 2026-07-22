"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/whatsapp-templates", { headers: orgHeaders() });
      const data = await res.json();
      setTemplates(data.items || []);
    } catch {
      setTemplates([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim() || !body.trim()) return;

    await fetch("/api/v1/whatsapp-templates", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ name, body }),
    });

    setName("");
    setBody("");
    load();
  };

  const setStatus = async (id: string, status: string) => {
    await fetch(`/api/v1/whatsapp-templates/${id}/status`, {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ status }),
    });

    load();
  };

  return (
    <div>
      <Topbar title="WhatsApp Templates" subtitle="Approval workflow" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Template</div>

        <div style={{ display: "grid", gap: 10 }}>
          <input
            className="input"
            placeholder="Template name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            className="textarea"
            rows={5}
            placeholder="Hello {{name}}, thanks for contacting us."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <button className="btn" onClick={create}>
            Create Template
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="card-title">{template.name}</div>
              <span className="badge">{template.status}</span>
            </div>

            <div className="muted" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
              {template.body}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn secondary" onClick={() => setStatus(template.id, "PENDING")}>
                Submit
              </button>
              <button className="btn secondary" onClick={() => setStatus(template.id, "APPROVED")}>
                Approve
              </button>
              <button className="btn secondary" onClick={() => setStatus(template.id, "REJECTED")}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}