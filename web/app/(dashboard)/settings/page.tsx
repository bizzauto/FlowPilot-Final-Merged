import Topbar from "@/components/Topbar";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div>
      <Topbar title="Settings" subtitle="Configure your platform" />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Quick Actions</div>

          <div className="settings-item">
            <div>
              <strong>WhatsApp</strong>
              <div className="muted">Connection and webhook status</div>
            </div>
            <Link className="btn secondary small" href="/settings/whatsapp">
              Open
            </Link>
          </div>

          <div className="settings-item">
            <div>
              <strong>API Keys</strong>
              <div className="muted">Create keys for n8n and integrations</div>
            </div>
            <Link className="btn secondary small" href="/settings/api-keys">
              Open
            </Link>
          </div>

          <div className="settings-item">
            <div>
              <strong>Team</strong>
              <div className="muted">Manage members and roles</div>
            </div>
            <Link className="btn secondary small" href="/settings/team">
              Open
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Growth</div>

          <div className="settings-item">
            <div>
              <strong>Billing</strong>
              <div className="muted">Plans and subscription</div>
            </div>
            <Link className="btn secondary small" href="/settings/billing">
              Open
            </Link>
          </div>

          <div className="settings-item">
            <div>
              <strong>Agency</strong>
              <div className="muted">Create client workspaces</div>
            </div>
            <Link className="btn secondary small" href="/settings/agency">
              Open
            </Link>
          </div>

          <div className="settings-item">
            <div>
              <strong>White-label</strong>
              <div className="muted">Logo, color and custom domain</div>
            </div>
            <Link className="btn secondary small" href="/settings/white-label">
              Open
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}