import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";
import { handleApiError, ApiError } from "@/lib/api-error";
import { sendToN8n } from "@/lib/n8n";

const schema = z.object({
  name: z.string().min(1).max(120),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = await requireApiKey(req, "contacts.write");
    await rateLimit(`public:contacts:${apiKey.organizationId}`, 120, 60);

    const json = await req.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      throw new ApiError(422, parsed.error.message, "VALIDATION_ERROR");
    }

    const body = parsed.data;

    const contact = await prisma.contact.create({
      data: {
        organizationId: apiKey.organizationId,
        name: body.name,
        phone: body.phone,
        email: body.email?.toLowerCase(),
        tags: body.tags || [],
      },
    });

    await sendToN8n("contact.created", {
      organizationId: apiKey.organizationId,
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return handleApiError(error, req);
  }
}