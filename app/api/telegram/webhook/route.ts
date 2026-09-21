import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai";
import {
  getOrCreateUser,
  saveMemory,
  saveMessage,
} from "@/lib/db";
import {
  sendTelegramMessage,
  type TelegramUpdate,
} from "@/lib/telegram";

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");

    if (
      process.env.TELEGRAM_WEBHOOK_SECRET &&
      secret !== process.env.TELEGRAM_WEBHOOK_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (!message?.chat?.id || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (
      process.env.TELEGRAM_OWNER_ID &&
      String(chatId) !== process.env.TELEGRAM_OWNER_ID
    ) {
      await sendTelegramMessage(
        chatId,
        "Sorry, this bot is private."
      );

      return NextResponse.json({ ok: true });
    }

    const user = await getOrCreateUser({
      telegramId: String(chatId),
      firstName: message.from?.first_name,
      username: message.from?.username,
    });

    await saveMessage(user.id, "user", text);

    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        "👋 Hello! I'm Roman's Personal Assistant.\n\nSend me a message and I'll help you."
      );

      return NextResponse.json({ ok: true });
    }

    if (text === "/help") {
      await sendTelegramMessage(
        chatId,
        "🤖 Commands:\n\n/start - Start assistant\n/help - Show help\n/remember <text> - Save a memory\n/memories - Show saved memories"
      );

      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/remember ")) {
      const memory = text.substring("/remember ".length).trim();

      if (!memory) {
        await sendTelegramMessage(
          chatId,
          "Please provide something to remember."
        );
        return NextResponse.json({ ok: true });
      }

      await saveMemory(user.id, memory);

      await sendTelegramMessage(
        chatId,
        "🧠 Saved to memory."
      );

      return NextResponse.json({ ok: true });
    }

    const reply = await getAIResponse({
      userId: user.id,
      message: text,
    });

    await saveMessage(user.id, "assistant", reply);

    await sendTelegramMessage(chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
