"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders, setStoredOrgId } from "@/lib/org";

export default function OrganizationPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [current, setCurrent] = useState("");
  const [selected, setSelected] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/organizations", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setOrgs(data.items || []);
      setCurrent(data.current || "");
      setSelected(data.current || "");
    } catch {
      setOrgs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const switchOrg = () => {
    if (!selected) return;
    setStoredOrgId(selected);
    window.location.href = "/dashboard";
  };

  return (
    <div>
      <Topbar title="Organization" subtitle="Switch workspace" />

      <div className="card">
        <div className="card-title">Your Organizations</div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr
                key={org.id}
                onClick={() => setSelected(org.id)}
                style={{
                  cursor: "pointer",
                  background: selected === org.id ? "rgba(79,70,229,0.12)" : "transparent",
                }}
              >
                <td>{org.name}</td>
                <td>{org.slug}</td>
                <td>{org.role}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={switchOrg}>
            Switch Organization
          </button>
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Current organization ID: {current}
        </div>
      </div>
    </div>
  );
}