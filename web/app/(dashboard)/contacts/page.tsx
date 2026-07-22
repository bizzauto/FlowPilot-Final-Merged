"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function ContactsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", stage: "NEW" });
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/v1/contacts?limit=100", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addContact = async () => {
    if (!form.name) return;

    await fetch("/api/v1/contacts", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify(form),
    });

    setForm({ name: "", email: "", phone: "", stage: "NEW" });
    load();
  };

  const exportCsv = async () => {
    const res = await fetch("/api/v1/contacts/export", {
      headers: orgHeaders(),
    });

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const importCsv = async () => {
    setMessage("");

    const res = await fetch("/api/v1/contacts/import", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ csv }),
    });

    const data = await res.json();

    if (data.imported !== undefined) {
      setMessage(`Imported ${data.imported} contacts.`);
      setCsv("");
      load();
    } else {
      setMessage(data.error?.message || "Import failed");
    }
  };

  return (
    <div>
      <Topbar
        title="Contacts"
        subtitle="Create, import and export CRM contacts"
        action={
          <button className="btn secondary" onClick={exportCsv}>
            Export CSV
          </button>
        }
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Add Contact</div>

        <div className="form-grid">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Stage</label>
            <select
              className="select"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            >
              <option value="NEW">NEW</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="PROPOSAL">PROPOSAL</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="WON">WON</option>
            </select>
          </div>

          <button className="btn" onClick={addContact}>
            Add
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Import CSV</div>

        <textarea
          className="textarea"
          rows={5}
          placeholder={"name,email,phone,stage\nAarav,aarav@example.com,+91...,NEW"}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />

        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={importCsv}>
            Import
          </button>
          <div className="muted">{message}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">All Contacts</div>

        {loading ? (
          <EmptyState icon="⏳" title="Loading contacts" />
        ) : items.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No contacts found"
            subtitle="Add a contact or import CSV."
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
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {items.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.name}</td>
                    <td>{contact.email || "-"}</td>
                    <td>{contact.phone || "-"}</td>
                    <td>
                      <span className="badge info">{contact.stage}</span>
                    </td>
                    <td>{contact.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}