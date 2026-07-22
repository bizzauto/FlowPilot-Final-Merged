"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/welcome", label: "Welcome", icon: "🚀" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/inbox", label: "Inbox", icon: "💬" },
  { href: "/contacts", label: "Contacts", icon: "👥" },
  { href: "/pipeline", label: "Pipeline", icon: "🧲" },
  { href: "/broadcast", label: "Broadcast", icon: "📣" },
  { href: "/automation-builder", label: "Automation Builder", icon: "⚡" },
  { href: "/support", label: "Support", icon: "🎫" },
  { href: "/billing-portal", label: "Billing Portal", icon: "💳" },
  { href: "/design", label: "Design System", icon: "🎨" },
  { href: "/agency-wizard", label: "Agency Wizard", icon: "🏢" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const path = usePathname() || "";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">FlowPilot</div>
      <div className="sidebar-sub">Ultra Edition</div>

      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={path.startsWith(item.href) ? "nav-item active" : "nav-item"}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </aside>
  );
}