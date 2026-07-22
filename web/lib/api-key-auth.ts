import crypto from "crypto";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export function hashApiKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function requireApiKey(req: Request, scope?: string) {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing API key", "UNAUTHORIZED");
  }

  const rawKey = auth.slice(7).trim();

  if (!rawKey) {
    throw new ApiError(401, "Missing API key", "UNAUTHORIZED");
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { organization: true },
  });

  if (!apiKey || apiKey.revokedAt) {
    throw new ApiError(401, "Invalid API key", "INVALID_API_KEY");
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw new ApiError(401, "API key expired", "API_KEY_EXPIRED");
  }

  if (!apiKey.organization.active) {
    throw new ApiError(403, "Organization inactive", "ORG_INACTIVE");
  }

  if (scope && !apiKey.scopes.includes("*") && !apiKey.scopes.includes(scope)) {
    throw new ApiError(403, "Insufficient scope", "INSUFFICIENT_SCOPE");
  }

  await prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return apiKey;
}