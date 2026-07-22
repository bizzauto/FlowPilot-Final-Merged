"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function DashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/analytics", {
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

  const generateDemo = async () => {
    setLoadingDemo(true);

    try {
      const res = await fetch("/api/v1/demo/generate", {
        method: "POST",
        headers: orgHeaders(),
      });

      const json = await res.json();

      if (json.success) {
        alert("Demo data generated.");
        load();
      } else {
        alert(json.error?.message || "Demo generation failed.");
      }
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Real database analytics"
        action={
          <button className="btn" onClick={generateDemo} disabled={loadingDemo}>
            {loadingDemo ? "Generating..." : "Generate Demo Data"}
          </button>
        }
      />

      {!data ? (
        <EmptyState icon="📊" title="Loading dashboard" />
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 16 }}>
            {(data.stats || []).map((stat: any) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="card">
            <div className="card-title">Recent Contacts</div>

            {(data.recentContacts || []).length === 0 ? (
              <EmptyState
                icon="👥"
                title="No contacts yet"
                subtitle="Click Generate Demo Data or create a contact."
              />
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recentContacts || []).map((contact: any) => (
                      <tr key={contact.id}>
                        <td>{contact.name}</td>
                        <td>{contact.email || "-"}</td>
                        <td>{contact.phone || "-"}</td>
                        <td>
                          <span className="badge info">{contact.stage}</span>
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