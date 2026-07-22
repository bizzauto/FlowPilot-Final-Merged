"use client";

import type { ReactNode } from "react";
import OrgSwitcher from "@/components/OrgSwitcher";

export default function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        {subtitle ? <div className="muted">{subtitle}</div> : null}
      </div>

      <div className="topbar-right">
        {action ? <div>{action}</div> : null}
        <OrgSwitcher />
      </div>
    </div>
  );
}