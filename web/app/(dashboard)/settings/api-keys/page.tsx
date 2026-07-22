"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/api-keys", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setKeys(data.items || []);
    } catch {
      setKeys([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: orgHeaders(),
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (data.key) {
        setNewKey(data.key);
        setName("");
        load();
      }
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/v1/api-keys/${id}/revoke`, {
      method: "POST",
      headers: orgHeaders(),
    });

    load();
  };

  return (
    <div>
      <Topbar title="API Keys" subtitle="Manage integration keys" />

      {newKey ? (
        <div className="card" style={{ marginBottom: 16, borderColor: "#22c55e" }}>
          <div className="card-title">New API Key</div>
          <p className="muted" style={{ marginBottom: 10 }}>
            Copy this key now. It will not be shown again.
          </p>
          <div style={{ wordBreak: "break-all", fontWeight: 700 }}>
            {newKey}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create API Key</div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="Key name, e.g. n8n"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn" onClick={create} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Active Keys</div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Prefix</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{key.prefix}</td>
                <td>{new Date(key.createdAt).toLocaleString()}</td>
                <td>
                  <button className="btn secondary" onClick={() => revoke(key.id)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}