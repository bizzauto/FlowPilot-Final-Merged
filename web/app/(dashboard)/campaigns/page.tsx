"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("WHATSAPP");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/campaigns", { headers: orgHeaders() });
      const data = await res.json();
      setCampaigns(data.items || []);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;

    await fetch("/api/v1/campaigns", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name,
        channel,
        audience: {},
        content: { message },
      }),
    });

    setName("");
    setMessage("");
    load();
  };

  const queue = async (id: string) => {
    await fetch(`/api/v1/campaigns/${id}/queue`, {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  return (
    <div>
      <Topbar title="Campaigns" subtitle="Create and queue campaigns" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Campaign</div>

        <div className="form-grid">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="label">Channel</label>
            <select className="select" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="label">Message</label>
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <button className="btn" onClick={create}>
            Create
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          subtitle="Create your first campaign."
        />
      ) : (
        <div className="grid grid-2">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div className="card-title">{campaign.name}</div>
                  <div className="muted">{campaign.channel}</div>
                </div>

                <span
                  className={
                    campaign.status === "COMPLETED"
                      ? "badge success"
                      : campaign.status === "ACTIVE"
                      ? "badge info"
                      : "badge warning"
                  }
                >
                  {campaign.status}
                </span>
              </div>

              <div style={{ marginTop: 14 }}>
                <button className="btn secondary small" onClick={() => queue(campaign.id)}>
                  Queue Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}