import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { secureApi } from "@/lib/secure-api";
import { requirePermission } from "@/lib/rbac";
import { rateLimit } from "@/lib/rate-limit";
import { ApiError } from "@/lib/api-error";

const schema = z.object({
  csv: z.string().optional(),
  contacts: z
    .array(
      z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        stage: z.string().optional(),
      })
    )
    .optional(),
});

function parseCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);

  if (!lines.length) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("name");

  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const cols = line.split(",").map((col) => col.replace(/^"|"$/g, "").trim());

    return {
      name: cols[0] || "Imported Contact",
      email: cols[1] || undefined,
      phone: cols[2] || undefined,
      stage: cols[3] || "NEW",
    };
  });
}

export const POST = secureApi(async (req, _context, ctx) => {
  requirePermission(ctx.role, "contacts.write");
  await rateLimit(`contacts:import:${ctx.session.user.id}`, 20, 60);

  const json = await req.json();
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
  }

  let contacts = parsed.data.contacts || [];

  if (parsed.data.csv) {
    contacts = parseCsv(parsed.data.csv);
  }

  if (!contacts.length) {
    throw new ApiError(400, "No contacts provided", "EMPTY_IMPORT");
  }

  const result = await prisma.contact.createMany({
    data: contacts.map((contact) => ({
      organizationId: ctx.organizationId,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      stage: contact.stage || "NEW",
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ imported: result.count });
});