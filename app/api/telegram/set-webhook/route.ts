import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const setupSecret = request.headers.get("x-setup-secret");

    if (
      !process.env.SETUP_SECRET ||
      setupSecret !== process.env.SETUP_SECRET
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const appUrl = process.env.APP_URL;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!botToken || !appUrl || !webhookSecret) {
      return NextResponse.json(
        {
          error:
            "Missing TELEGRAM_BOT_TOKEN, APP_URL or TELEGRAM_WEBHOOK_SECRET",
        },
        { status: 500 }
      );
    }

    const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
        }),
      }
    );

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error("Set webhook error:", error);

    return NextResponse.json(
      { error: "Failed to set Telegram webhook" },
      { status: 500 }
    );
  }
}
