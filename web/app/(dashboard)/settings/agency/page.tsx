"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function AgencyPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/agency/clients", { headers: orgHeaders() });
      const data = await res.json();
      setClients(data.items || []);
    } catch {
      setClients([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;

    const res = await fetch("/api/v1/agency/clients", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ name, slug }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error?.message || "Failed to create client");
      return;
    }

    setName("");
    setSlug("");
    load();
  };

  return (
    <div>
      <Topbar title="Agency Clients" subtitle="Create client workspaces" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Client</div>

        <div className="form-grid">
          <div>
            <label className="label">Client Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="label">Slug</label>
            <input
              className="input"
              placeholder="client-name"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
          </div>

          <button className="btn" onClick={create}>
            Create Client
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Clients</div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Plan</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{client.slug}</td>
                <td>{client.plan}</td>
                <td>{new Date(client.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}