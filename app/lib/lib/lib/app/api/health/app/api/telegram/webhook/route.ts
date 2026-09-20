import { NextRequest, NextResponse } from "next";

import { generateAssistantReply } from "@/lib/ai";
import {
  getMemories,
  getRecentMessages,
  initDatabase,
  saveMemory,
  saveMessage,
  upsertUser,
} from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Update = {
  message?: {
    text?: string;
    chat: {
      id: number;
    };
    from?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

function isOwner(id: number) {
  const ownerId = process.env.TELEGRAM_OWNER_ID;

  return Boolean(ownerId) && String(id) === ownerId;
}

function validSecret(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  return (
    request.headers.get("x-telegram-bot-api-secret-token") === secret
  );
}

async function handleCommand(
  chatId: number,
  userId: number,
  text: string
) {
  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      "🤖 Hello! I'm your Personal Assistant.\n\nTry /help or send me a message."
    );

    return;
  }

  if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      "🧠 Commands:\n\n" +
        "/remember <text> — save memory\n" +
        "/memories — show memories\n" +
        "/help — show help\n\n" +
        "Normal messages are sent to the AI assistant."
    );

    return;
  }

  if (text.startsWith("/remember ")) {
    const memory = text.slice(10).trim();

    if (!memory) {
      await sendTelegramMessage(
        chatId,
        "Use /remember <text>"
      );

      return;
    }

    await saveMemory(userId, memory);

    await sendTelegramMessage(
      chatId,
      "✅ Saved to memory."
    );

    return;
  }

  if (text === "/memories") {
    const memories = await getMemories(userId);

    if (!memories.length) {
      await sendTelegramMessage(
        chatId,
        "🧠 No saved memories yet."
      );

      return;
    }

    const text = memories
      .map((memory, index) => `${index + 1}. ${memory.content}`)
      .join("\n");

    await sendTelegramMessage(
      chatId,
      `🧠 Saved memories:\n\n${text}`
    );
  }
}

export async function POST(request: NextRequest) {
  if (!validSecret(request)) {
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

  try {
    const update = (await request.json()) as Update;

    const message = update.message;
    const text = message?.text?.trim();
    const from = message?.from;

    if (!message || !text || !from) {
      return NextResponse.json({
        ok: true,
      });
    }

    if (!isOwner(from.id)) {
      await sendTelegramMessage(
        message.chat.id,
        "🔒 This is a private assistant."
      );

      return NextResponse.json({
        ok: true,
      });
    }

    await initDatabase();
    await upsertUser(from);

    if (text.startsWith("/")) {
      await handleCommand(
        message.chat.id,
        from.id,
        text
      );

      return NextResponse.json({
        ok: true,
      });
    }

    await saveMessage(
      from.id,
      "user",
      text
    );

    const recentMessages =
      await getRecentMessages(from.id);

    const memories =
      await getMemories(from.id);

    const reply =
      await generateAssistantReply(
        recentMessages,
        memories
      );

    await saveMessage(
      from.id,
      "assistant",
      reply
    );

    await sendTelegramMessage(
      message.chat.id,
      reply
    );

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Telegram webhook error:",
      error
    );

    return NextResponse.json({
      ok: true,
    });
  }
}
