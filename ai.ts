import OpenAI from "openai";

export async function generateAssistantReply(
  messages:{role:"user"|"assistant";content:string}[],
  memories:{content:string}[]
){
  const key=process.env.OPENAI_API_KEY;
  if(!key) throw new Error("OPENAI_API_KEY is not configured");
  const client=new OpenAI({apiKey:key});
  const model=process.env.OPENAI_MODEL||"gpt-5-mini";
  const memoryText=memories.length
    ? memories.map(m=>`- ${m.content}`).join("\n")
    : "No saved memories.";
  const r=await client.responses.create({
    model,
    instructions:`You are Roman's private Telegram personal assistant. Be concise, practical, friendly and truthful. Never claim an action happened unless the backend performed it. Use these saved memories only as context:\n${memoryText}`,
    input:messages.map(m=>({role:m.role,content:m.content}))
  });
  return r.output_text?.trim() || "I couldn't generate a response right now.";
}