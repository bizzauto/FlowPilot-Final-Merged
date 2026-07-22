"use client";

import { useEffect, useState } from "react";
import { orgHeaders, setStoredOrgId } from "@/lib/org";

export default function OrgSwitcher() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [current, setCurrent] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/v1/organizations", {
        headers: orgHeaders(),
      });
      const data = await res.json();
      setOrgs(data.items || []);
      setCurrent(data.current || "");
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const switchOrg = (orgId: string) => {
    setStoredOrgId(orgId);
    setCurrent(orgId);
    window.location.reload();
  };

  return (
    <select
      className="select org-switcher"
      value={current}
      onChange={(e) => switchOrg(e.target.value)}
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name} ({org.role})
        </option>
      ))}
    </select>
  );
}