"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("contact.created");
  const [action, setAction] = useState("Send WhatsApp welcome message");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/workflows", { headers: orgHeaders() });
      const data = await res.json();
      setWorkflows(data.items || []);
    } catch {
      setWorkflows([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;

    await fetch("/api/v1/workflows", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        name,
        trigger,
        steps: [
          {
            type: "send_whatsapp",
            body: action,
          },
        ],
      }),
    });

    setName("");
    load();
  };

  const runTest = async (id: string) => {
    await fetch(`/api/v1/workflows/${id}/run`, {
      method: "POST",
      headers: orgHeaders(),
    });

    alert("Automation test queued.");
  };

  return (
    <div>
      <Topbar title="Automations" subtitle="Workflow execution engine" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Automation</div>

        <div className="form-grid">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="label">Trigger</label>
            <select className="select" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
              <option value="contact.created">Contact Created</option>
              <option value="whatsapp.message.inbound">WhatsApp Message Received</option>
              <option value="deal.stage_changed">Deal Stage Changed</option>
            </select>
          </div>

          <div>
            <label className="label">WhatsApp Message</label>
            <input className="input" value={action} onChange={(e) => setAction(e.target.value)} />
          </div>

          <button className="btn" onClick={create}>
            Create
          </button>
        </div>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No automations yet"
          subtitle="Create your first workflow."
        />
      ) : (
        <div className="grid grid-2">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div className="card-title">{workflow.name}</div>
                  <div className="muted">Trigger: {workflow.trigger}</div>
                </div>

                <span className={workflow.active ? "badge success" : "badge warning"}>
                  {workflow.active ? "Active" : "Paused"}
                </span>
              </div>

              <div style={{ marginTop: 14 }}>
                <button className="btn secondary small" onClick={() => runTest(workflow.id)}>
                  Run Test
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}