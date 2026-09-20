import OpenAI from "openai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Memory = {
  content: string;
};

export async function generateAssistantReply(
  messages: ChatMessage[],
  memories: Memory[]
) {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({
    apiKey: key,
  });

  const model = process.env.OPENAI_MODEL || "gpt-5-mini";

  const memoryText = memories.length
    ? memories.map((memory) => `- ${memory.content}`).join("\n")
    : "No saved memories.";

  const response = await client.responses.create({
    model,
    instructions: `
You are Roman's private Telegram personal assistant.

Be concise, practical, friendly and truthful.

Never claim that an action happened unless the backend actually performed it.

Use the following saved memories only as context:

${memoryText}
    `,
    input: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });

  return (
    response.output_text?.trim() ||
    "I couldn't generate a response right now."
  );
}
