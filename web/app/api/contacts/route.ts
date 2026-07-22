import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await prisma.contact.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        items: [],
        error: "Database not ready",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || !body.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        stage: body.stage || "NEW",
        score: body.score || 0,
        tags: body.tags || [],
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}