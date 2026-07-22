"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function SupportTicketPage() {
  const params = useParams();
  const id = params.id as string;

  const [ticket, setTicket] = useState<any | null>(null);
  const [reply, setReply] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`/api/v1/tickets/${id}`, {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setTicket(data);
    } catch {
      setTicket(null);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const send = async () => {
    if (!reply.trim()) return;

    await fetch(`/api/v1/tickets/${id}/messages`, {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ body: reply }),
    });

    setReply("");
    load();
  };

  return (
    <div>
      <Topbar title={ticket?.subject || "Ticket"} subtitle="Support conversation" />

      {!ticket ? (
        <EmptyState icon="🎫" title="Loading ticket" />
      ) : (
        <div className="card">
          <div className="card-title">Messages</div>

          <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
            {(ticket.messages || []).map((message: any) => (
              <div key={message.id} className="msg">
                {message.body}
                <div className="muted" style={{ marginTop: 8 }}>
                  {message.authorType} · {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input" style={{ padding: 0, borderTop: "none" }}>
            <input
              className="input"
              placeholder="Write a reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button className="btn" onClick={send}>
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}