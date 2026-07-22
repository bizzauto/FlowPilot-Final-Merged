import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "flowpilot-part3",
    time: new Date().toISOString(),
  });
}