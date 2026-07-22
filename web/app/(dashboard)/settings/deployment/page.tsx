import Topbar from "@/components/Topbar";

export default function DeploymentChecklistPage() {
  return (
    <div>
      <Topbar
        title="Deployment Checklist"
        subtitle="Final production deployment guide"
      />

      <div className="grid grid-2">
        <div className="card">
          <div className="card-title">Server Setup</div>

          <div className="settings-item">
            <div>
              <strong>VPS ready</strong>
              <div className="muted">Ubuntu 22.04 / 24.04, 4GB RAM minimum</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Coolify installed</strong>
              <div className="muted">Docker Compose deployment enabled</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Domains added</strong>
              <div className="muted">app domain and n8n domain</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>HTTPS enabled</strong>
              <div className="muted">Let's Encrypt via Coolify</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Environment Secrets</div>

          <div className="settings-item">
            <div>
              <strong>Database</strong>
              <div className="muted">POSTGRES_PASSWORD, DATABASE_URL</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Redis</strong>
              <div className="muted">REDIS_PASSWORD, REDIS_URL</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Auth</strong>
              <div className="muted">NEXTAUTH_URL, NEXTAUTH_SECRET</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>WhatsApp</strong>
              <div className="muted">Phone ID, token, verify token, app secret</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Razorpay</strong>
              <div className="muted">Key ID, key secret, webhook secret</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Webhooks</div>

          <div className="settings-item">
            <div>
              <strong>WhatsApp webhook</strong>
              <div className="muted">/api/whatsapp/webhook</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Razorpay webhook</strong>
              <div className="muted">/api/billing/razorpay/webhook</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>n8n event webhook</strong>
              <div className="muted">N8N_EVENT_WEBHOOK_URL</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Post Deploy Tests</div>

          <div className="settings-item">
            <div>
              <strong>Login test</strong>
              <div className="muted">Admin login works</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Billing test</strong>
              <div className="muted">Razorpay test payment</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>WhatsApp test</strong>
              <div className="muted">Send and receive message</div>
            </div>
          </div>

          <div className="settings-item">
            <div>
              <strong>Backup test</strong>
              <div className="muted">scripts/backup-db.sh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}