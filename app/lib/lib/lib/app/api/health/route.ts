import { NextResponse } from "next";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "roman-personalassistant-bot",
    timestamp: new Date().toISOString(),
  });
}
