import type { ReactNode } from "react";

export default function EmptyState({
  icon = "📦",
  title,
  subtitle,
  action,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div style={{ fontWeight: 700, color: "white" }}>{title}</div>
      {subtitle ? <div className="muted">{subtitle}</div> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}