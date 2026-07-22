import Topbar from "@/components/Topbar";

export default function ProductionPage() {
  return (
    <div>
      <Topbar title="Production Checklist" subtitle="Launch hardening" />

      <div className="card">
        <div className="card-title">Final Launch Checklist</div>

        <div className="settings-item">
          <div>
            <strong>Change all passwords</strong>
            <div className="muted">Postgres, Redis, n8n, admin account</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Set production domains</strong>
            <div className="muted">NEXTAUTH_URL, WEBHOOK_URL, N8N_EDITOR_BASE_URL</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Enable HTTPS</strong>
            <div className="muted">Use Coolify / Traefik / Let's Encrypt</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Configure WhatsApp</strong>
            <div className="muted">Phone ID, token, app secret, webhook</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Configure billing</strong>
            <div className="muted">Stripe secret, webhook secret, price IDs</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Enable backups</strong>
            <div className="muted">Run scripts/backup-db.sh daily</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Monitor workers</strong>
            <div className="muted">message, campaign, automation, email workers</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Add error tracking</strong>
            <div className="muted">Sentry DSN recommended</div>
          </div>
        </div>
      </div>
    </div>
  );
}