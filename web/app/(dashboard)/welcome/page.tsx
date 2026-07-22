"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function WelcomePage() {
  const [data, setData] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/onboarding/status", {
        headers: orgHeaders(),
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar
        title="Welcome to FlowPilot"
        subtitle="Complete your production onboarding"
      />

      <div className="card hero" style={{ marginBottom: 16 }}>
        <div className="card-title">Setup Progress</div>

        {!data ? (
          <div className="muted">Loading checklist...</div>
        ) : (
          <div>
            <div className="stat-value">
              {data.completed} / {data.total}
            </div>

            <div className="progress" style={{ marginTop: 10 }}>
              <div
                style={{
                  width: `${(data.completed / data.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {!data ? (
        <EmptyState icon="⏳" title="Loading onboarding" />
      ) : (
        <div className="grid grid-2">
          {(data.tasks || []).map((task: any, index: number) => (
            <div key={index} className="card">
              <div className="settings-item" style={{ marginBottom: 0, border: "none", background: "transparent", padding: 0 }}>
                <div>
                  <strong>{task.label}</strong>
                  <div className="muted">
                    {task.done ? "Completed" : "Pending"}
                  </div>
                </div>

                <span className={task.done ? "badge success" : "badge warning"}>
                  {task.done ? "OK" : "TODO"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}