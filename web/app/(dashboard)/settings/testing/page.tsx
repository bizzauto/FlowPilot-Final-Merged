import Topbar from "@/components/Topbar";

export default function TestingPage() {
  return (
    <div>
      <Topbar title="Testing Checklist" subtitle="Final QA" />

      <div className="card">
        <div className="card-title">Core Tests</div>

        <div className="settings-item">
          <div>
            <strong>Login</strong>
            <div className="muted">Admin login works</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Contacts</strong>
            <div className="muted">Create, import, export</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Inbox</strong>
            <div className="muted">Send and receive messages</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Campaigns</strong>
            <div className="muted">Create and queue</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Automations</strong>
            <div className="muted">Run test execution</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Billing</strong>
            <div className="muted">Stripe checkout test</div>
          </div>
        </div>

        <div className="settings-item">
          <div>
            <strong>Backup</strong>
            <div className="muted">Run scripts/backup-db.sh</div>
          </div>
        </div>
      </div>
    </div>
  );
}