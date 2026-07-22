"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function BillingPortalPage() {
  const [data, setData] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/billing/subscriptions", {
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

  const cancel = async (id: string) => {
    const ok = confirm("Cancel this subscription?");

    if (!ok) return;

    await fetch(`/api/v1/billing/subscriptions/${id}/cancel`, {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  return (
    <div>
      <Topbar title="Billing Portal" subtitle="Manage subscription" />

      {!data ? (
        <EmptyState icon="💳" title="Loading billing portal" />
      ) : (
        <>
          <div className="card hero" style={{ marginBottom: 16 }}>
            <div className="card-title">Current Plan</div>
            <div className="stat-value">{data.organization?.plan || "starter"}</div>
            <div className="muted">{data.organization?.name}</div>
          </div>

          <div className="card">
            <div className="card-title">Subscriptions</div>

            {(data.subscriptions || []).length === 0 ? (
              <EmptyState icon="💳" title="No subscriptions" subtitle="Upgrade from billing page." />
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.subscriptions || []).map((sub: any) => (
                      <tr key={sub.id}>
                        <td>{sub.provider}</td>
                        <td>{sub.plan}</td>
                        <td>
                          <span className="badge success">{sub.status}</span>
                        </td>
                        <td>{new Date(sub.createdAt).toLocaleString()}</td>
                        <td>
                          {sub.status === "active" ? (
                            <button className="btn danger small" onClick={() => cancel(sub.id)}>
                              Cancel
                            </button>
                          ) : (
                            <span className="muted">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}