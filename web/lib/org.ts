export function getStoredOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("flowpilot_org_id");
}

export function setStoredOrgId(id: string) {
  localStorage.setItem("flowpilot_org_id", id);
}

export function orgHeaders(extra?: Record<string, string>) {
  const orgId = getStoredOrgId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra || {}),
  };

  if (orgId) {
    headers["x-org-id"] = orgId;
  }

  return headers;
}