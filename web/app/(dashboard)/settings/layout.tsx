import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="pill-nav">
        <Link className="btn secondary small" href="/settings">General</Link>
        <Link className="btn secondary small" href="/settings/whatsapp">WhatsApp</Link>
        <Link className="btn secondary small" href="/settings/whatsapp-templates">Templates</Link>
        <Link className="btn secondary small" href="/settings/api-keys">API Keys</Link>
        <Link className="btn secondary small" href="/settings/team">Team</Link>
        <Link className="btn secondary small" href="/settings/agency">Agency</Link>
        <Link className="btn secondary small" href="/settings/white-label">White-label</Link>
        <Link className="btn secondary small" href="/settings/billing">Billing</Link>
        <Link className="btn secondary small" href="/settings/deployment">Deployment</Link>
        <Link className="btn secondary small" href="/settings/production">Production</Link>
      </div>

      {children}
    </div>
  );
}