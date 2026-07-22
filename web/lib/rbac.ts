import { ApiError } from "@/lib/api-error";

const permissions: Record<string, string[]> = {
  OWNER: ["*"],
  ADMIN: ["*"],
  AGENT: [
    "contacts.read",
    "contacts.write",
    "conversations.read",
    "conversations.write",
    "campaigns.read",
    "campaigns.write",
    "workflows.read",
    "workflows.write",
    "templates.read",
    "analytics.read",
    "organizations.read",
  ],
  VIEWER: [
    "contacts.read",
    "conversations.read",
    "campaigns.read",
    "workflows.read",
    "templates.read",
    "analytics.read",
    "organizations.read",
  ],
};

export function can(role: string, permission: string) {
  const perms = permissions[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

export function requirePermission(role: string, permission: string) {
  if (!can(role, permission)) {
    throw new ApiError(403, "Forbidden", "PERMISSION_DENIED");
  }
}