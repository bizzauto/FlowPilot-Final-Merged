import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function handleApiError(error: unknown, req?: Request) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { message: error.message, code: error.code } },
      { status: error.status }
    );
  }

  logger.error({ error, url: req?.url, method: req?.method }, "Unhandled API error");

  return NextResponse.json(
    { error: { message: "Internal Server Error" } },
    { status: 500 }
  );
}