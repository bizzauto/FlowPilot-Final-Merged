"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function AnalyticsPage() {
  const [data, setData] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/analytics/advanced", {
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
      <Topbar title="Advanced Analytics" subtitle="Funnel, channels and message performance" />

      {!data ? (
        <EmptyState icon="📈" title="Loading analytics" />
      ) : (
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">Contacts by Day</div>

            {(data.contactsByDay || []).length === 0 ? (
              <EmptyState icon="📅" title="No recent contacts" />
            ) : (
              <div className="bar-chart" style={{ height: 220 }}>
                {(data.contactsByDay || []).map((item: any) => (
                  <div
                    key={item.date}
                    className="bar"
                    style={{
                      height: `${Math.min(100, item.count * 12)}%`,
                    }}
                  >
                    <span>{item.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Stage Funnel</div>

            {(data.stageFunnel || []).length === 0 ? (
              <EmptyState icon="🧲" title="No pipeline data" />
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Stage</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.stageFunnel || []).map((item: any) => (
                      <tr key={item.stage}>
                        <td>{item.stage}</td>
                        <td>{item._count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Message Status</div>

            {(data.messageStatus || []).length === 0 ? (
              <EmptyState icon="📨" title="No message data" />
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.messageStatus || []).map((item: any) => (
                      <tr key={item.status}>
                        <td>
                          <span className="badge info">{item.status}</span>
                        </td>
                        <td>{item._count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Conversation Channels</div>

            {(data.channelSplit || []).length === 0 ? (
              <EmptyState icon="💬" title="No conversation data" />
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.channelSplit || []).map((item: any) => (
                      <tr key={item.channel}>
                        <td>{item.channel}</td>
                        <td>{item._count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}