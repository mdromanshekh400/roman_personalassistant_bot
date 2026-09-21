import OpenAI from "openai";
import { getRecentMessages, getMemories } from "./db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getAIResponse({
  userId,
  message,
}: {
  userId: number;
  message: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const [messages, memories] = await Promise.all([
    getRecentMessages(userId, 20),
    getMemories(userId),
  ]);

  const memoryText =
    memories.length > 0
      ? memories.map((item) => `- ${item.content}`).join("\n")
      : "No saved memories.";

  const conversation = messages
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  const response = await openai.responses.create({
    model,
    instructions: `
You are Roman's personal AI assistant.

Be helpful, concise, friendly and practical.
Use the saved memories only when relevant.
Do not claim to have performed actions that you did not actually perform.

Saved memories:
${memoryText}

Recent conversation:
${conversation}
`,
    input: message,
  });

  return response.output_text || "Sorry, I couldn't generate a response.";
}
