"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import EmptyState from "@/components/EmptyState";
import { orgHeaders } from "@/lib/org";

export default function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/v1/conversations", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setConversations(data.items || []);

      if (!active && data.items?.length) {
        setActive(data.items[0]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${conversationId}/messages`, {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setMessages(data.items || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (active?.id) {
      loadMessages(active.id);
      const interval = setInterval(() => loadMessages(active.id), 5000);
      return () => clearInterval(interval);
    }
  }, [active?.id]);

  const send = async () => {
    if (!draft.trim() || !active?.id) return;

    const message = draft.trim();
    setDraft("");

    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        direction: "OUTBOUND",
        body: message,
        status: "QUEUED",
      },
    ]);

    await fetch(`/api/v1/conversations/${active.id}/messages`, {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({ message }),
    });

    setTimeout(() => loadMessages(active.id), 700);
  };

  return (
    <div>
      <Topbar title="Inbox" subtitle="Unified conversations" />

      {loading ? (
        <EmptyState icon="⏳" title="Loading inbox" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No conversations yet"
          subtitle="WhatsApp messages will appear here."
        />
      ) : (
        <div className="inbox">
          <div className="card inbox-list" style={{ padding: 0 }}>
            {conversations.map((item) => (
              <div
                key={item.id}
                className={active?.id === item.id ? "inbox-item active" : "inbox-item"}
                onClick={() => setActive(item)}
              >
                <div className="inbox-name">
                  {item.contact?.name || item.contact?.phone || "Contact"}
                </div>
                <div className="inbox-preview">{item.channel}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>

          <div className="card chat" style={{ padding: 0 }}>
            <div className="chat-header">
              <strong>
                {active?.contact?.name || active?.contact?.phone || "Conversation"}
              </strong>
              <div className="muted">{active?.channel || ""}</div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <EmptyState icon="📨" title="No messages yet" />
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.direction === "OUTBOUND" ? "msg me" : "msg"}
                  >
                    {message.body}
                    <div style={{ fontSize: 11, opacity: 0.72, marginTop: 6 }}>
                      {message.status}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="chat-input">
              <input
                className="input"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button className="btn" onClick={send}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}