import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { Session } from "next-auth";

export async function requireOrganization(session: Session, organizationId?: string | null) {
  const orgId = organizationId || session.user.organizationId;

  if (!orgId) {
    throw new ApiError(400, "Organization is required", "ORG_REQUIRED");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organizationId: orgId,
      active: true,
    },
  });

  if (!membership) {
    throw new ApiError(403, "Organization access denied", "ORG_DENIED");
  }

  return {
    organizationId: membership.organizationId,
    role: membership.role,
  };
}