import { NextRequest, NextResponse } from "next";
import { telegram } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const setupSecret = process.env.SETUP_SECRET;

  if (
    !setupSecret ||
    request.headers.get("x-setup-secret") !== setupSecret
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "APP_URL is not configured",
      },
      {
        status: 500,
      }
    );
  }

  const webhookUrl =
    `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

  return NextResponse.json(
    await telegram("setWebhook", {
      url: webhookUrl,
      secret_token:
        process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
      allowed_updates: ["message"],
    })
  );
}
