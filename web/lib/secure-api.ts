import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { requireOrganization } from "@/lib/tenant";
import { handleApiError } from "@/lib/api-error";
import { Session } from "next-auth";

export type SecureContext = {
  session: Session;
  organizationId: string;
  role: string;
};

export function secureApi(
  handler: (req: NextRequest, context: any, ctx: SecureContext) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const session = await requireSession();
      const orgHeader = req.headers.get("x-org-id");
      const { organizationId, role } = await requireOrganization(session, orgHeader);

      return await handler(req, context, {
        session,
        organizationId,
        role,
      });
    } catch (error) {
      return handleApiError(error, req);
    }
  };
}