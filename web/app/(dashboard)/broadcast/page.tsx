"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function BroadcastPage() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tags, setTags] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const send = async () => {
    if (!name.trim() || !message.trim()) {
      alert("Campaign name and message required.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const audience: any = {};

      if (tags.trim()) {
        audience.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
      }

      if (stage) {
        audience.stages = [stage];
      }

      const createRes = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: orgHeaders(),
        body: JSON.stringify({
          name,
          channel: "WHATSAPP",
          audience,
          content: { message },
        }),
      });

      const campaign = await createRes.json();

      if (!createRes.ok) {
        setResult(campaign.error?.message || "Failed to create campaign.");
        return;
      }

      const queueRes = await fetch(`/api/v1/campaigns/${campaign.id}/queue`, {
        method: "POST",
        headers: orgHeaders(),
      });

      const queueJson = await queueRes.json();

      if (queueRes.ok) {
        setResult("Broadcast created and queued.");
        setName("");
        setMessage("");
        setTags("");
        setStage("");
      } else {
        setResult(queueJson.error?.message || "Failed to queue campaign.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar title="WhatsApp Broadcast" subtitle="Compose and queue broadcast campaign" />

      <div className="card" style={{ maxWidth: 750 }}>
        <div className="card-title">Composer</div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="label">Campaign Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Diwali Offer Blast"
            />
          </div>

          <div>
            <label className="label">Message</label>
            <textarea
              className="textarea"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hello {{name}}, your offer is live."
            />
          </div>

          <div className="grid grid-2">
            <div>
              <label className="label">Audience Tags, comma separated</label>
              <input
                className="input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Hot, VIP"
              />
            </div>

            <div>
              <label className="label">Stage</label>
              <select className="select" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">All Stages</option>
                <option value="NEW">NEW</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="PROPOSAL">PROPOSAL</option>
                <option value="NEGOTIATION">NEGOTIATION</option>
                <option value="WON">WON</option>
              </select>
            </div>
          </div>

          <button className="btn" onClick={send} disabled={loading}>
            {loading ? "Queueing..." : "Create & Queue Broadcast"}
          </button>

          {result ? <div className="badge info">{result}</div> : null}
        </div>
      </div>
    </div>
  );
}