"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

const palette = [
  { type: "trigger", label: "Trigger", icon: "🎯" },
  { type: "wait", label: "Wait / Delay", icon: "⏱️" },
  { type: "send_whatsapp", label: "Send WhatsApp", icon: "💬" },
  { type: "send_email", label: "Send Email", icon: "📧" },
  { type: "add_tag", label: "Add Tag", icon: "🏷️" },
  { type: "webhook", label: "Webhook", icon: "🔗" },
];

export default function AutomationBuilderPage() {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("contact.created");
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addStep = (type: string) => {
    const item = palette.find((p) => p.type === type);

    setSteps([
      ...steps,
      {
        type,
        label: item?.label || type,
        icon: item?.icon || "⚙️",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;

    if (target < 0 || target >= steps.length) return;

    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;

    setSteps(copy);
  };

  const save = async () => {
    if (!name.trim()) {
      alert("Automation name required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/workflows", {
        method: "POST",
        headers: orgHeaders(),
        body: JSON.stringify({
          name,
          trigger,
          steps,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Automation saved.");
        setName("");
        setSteps([]);
      } else {
        alert(data.error?.message || "Failed to save automation.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar title="Automation Builder" subtitle="Drag and drop workflow builder" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-2">
          <div>
            <label className="label">Automation Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New lead follow-up"
            />
          </div>

          <div>
            <label className="label">Trigger</label>
            <select
              className="select"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
            >
              <option value="contact.created">Contact Created</option>
              <option value="whatsapp.message.inbound">WhatsApp Message Received</option>
              <option value="deal.stage_changed">Deal Stage Changed</option>
              <option value="appointment.booked">Appointment Booked</option>
            </select>
          </div>
        </div>
      </div>

      <div className="builder-layout">
        <div className="card">
          <div className="card-title">Steps</div>

          {palette.map((item) => (
            <div
              key={item.type}
              className="palette-item"
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", item.type)}
              onClick={() => addStep(item.type)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData("text/plain");
            if (type) addStep(type);
          }}
        >
          {steps.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">⚡</div>
              <div style={{ color: "white", fontWeight: 700 }}>
                Drag steps here
              </div>
              <div className="muted">
                Or click a step from the left panel.
              </div>
            </div>
          ) : (
            steps.map((step, index) => (
              <div key={index} className="step-item">
                <div className="step-header">
                  <div>
                    <strong>
                      {step.icon} {step.label}
                    </strong>
                    <div className="muted">Type: {step.type}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn secondary small" onClick={() => move(index, "up")}>
                      Up
                    </button>
                    <button className="btn secondary small" onClick={() => move(index, "down")}>
                      Down
                    </button>
                    <button className="btn danger small" onClick={() => removeStep(index)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn" onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save Automation"}
        </button>
      </div>
    </div>
  );
}