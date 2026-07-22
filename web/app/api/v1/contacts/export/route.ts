import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";

export const GET = secureApi(async (_req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.read");
  await rateLimit(`contacts:export:${ctx.session.user.id}`, 20, 60);

  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: ctx.organizationId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const header = "name,email,phone,stage,score\n";

  const rows = contacts
    .map((contact) => {
      return [
        contact.name,
        contact.email || "",
        contact.phone || "",
        contact.stage,
        contact.score,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",");
    })
    .join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=contacts.csv",
    },
  });
});