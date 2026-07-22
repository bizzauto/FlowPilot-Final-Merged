"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/tickets", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setTickets(data.items || []);
    } catch {
      setTickets([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!subject.trim()) return;

    await fetch("/api/v1/tickets", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        subject,
        description,
        priority,
      }),
    });

    setSubject("");
    setDescription("");
    setPriority("MEDIUM");
    load();
  };

  return (
    <div>
      <Topbar title="Support Tickets" subtitle="Customer support module" />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Create Ticket</div>

        <div className="form-grid">
          <div>
            <label className="label">Subject</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button className="btn" onClick={create}>
            Create
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon="🎫" title="No tickets yet" subtitle="Create your first support ticket." />
      ) : (
        <div className="card">
          <div className="card-title">Tickets</div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.subject}</td>
                    <td>
                      <span className="badge info">{ticket.status}</span>
                    </td>
                    <td>
                      <span className="badge warning">{ticket.priority}</span>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td>
                      <Link className="btn secondary small" href={`/support/${ticket.id}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}