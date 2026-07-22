"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { orgHeaders } from "@/lib/org";

export default function WhatsAppSettingsPage() {
  const [status, setStatus] = useState<any | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/v1/whatsapp/status", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Topbar title="WhatsApp Settings" subtitle="Connection status" />

      <div className="card">
        <div className="card-title">Status</div>

        {!status ? (
          <div className="muted">Loading...</div>
        ) : (
          <div>
            <div className="settings-item">
              <div>
                <strong>Connection</strong>
                <div className="muted">
                  {status.connected ? "Connected" : "Not connected"}
                </div>
              </div>
              <span className="badge">
                {status.connected ? "OK" : "Pending"}
              </span>
            </div>

            <div className="settings-item">
              <div>
                <strong>Webhook URL</strong>
                <div className="muted">{status.webhookUrl}</div>
              </div>
            </div>

            <div className="settings-item">
              <div>
                <strong>Phone Number ID</strong>
                <div className="muted">
                  {status.phoneNumberIdSet ? "Configured" : "Missing"}
                </div>
              </div>
            </div>

            <div className="settings-item">
              <div>
                <strong>Access Token</strong>
                <div className="muted">
                  {status.accessTokenSet ? "Configured" : "Missing"}
                </div>
              </div>
            </div>

            <div className="settings-item">
              <div>
                <strong>Verify Token</strong>
                <div className="muted">
                  {status.verifyTokenSet ? "Configured" : "Missing"}
                </div>
              </div>
            </div>

            <div className="settings-item">
              <div>
                <strong>App Secret</strong>
                <div className="muted">
                  {status.appSecretSet ? "Configured" : "Missing"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}