const API_BASE = "https://api.telegram.org";

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

export async function telegram(method: string, body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/bot${getToken()}/${method}`, {
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify(body),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Telegram API ${response.status}: ${await response.text()}`);
  return response.json();
}

export async function sendTelegramMessage(chatId: number, text: string) {
  return telegram("sendMessage", {chat_id: chatId, text, disable_web_page_preview: true});
}