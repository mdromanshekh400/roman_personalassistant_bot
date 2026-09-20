import {NextRequest,NextResponse} from "next";
import {generateAssistantReply} from "@/lib/ai";
import {getMemories,getRecentMessages,initDatabase,saveMemory,saveMessage,upsertUser} from "@/lib/db";
import {sendTelegramMessage} from "@/lib/telegram";

export const runtime="nodejs";
export const dynamic="force-dynamic";

type Update={message?:{text?:string;chat:{id:number};from?:{id:number;username?:string;first_name?:string;last_name?:string}}};

function owner(id:number){return !!process.env.TELEGRAM_OWNER_ID && String(id)===process.env.TELEGRAM_OWNER_ID;}
function validSecret(r:NextRequest){const s=process.env.TELEGRAM_WEBHOOK_SECRET;return !s||r.headers.get("x-telegram-bot-api-secret-token")===s;}

async function command(chatId:number,userId:number,text:string){
  if(text==="/start"){await sendTelegramMessage(chatId,"🤖 Hello! I'm your Personal Assistant.\n\nTry /help or send me a message.");return;}
  if(text==="/help"){await sendTelegramMessage(chatId,"🧠 Commands:\n\n/remember <text> — save memory\n/memories — show memories\n/help — show help\n\nNormal messages are sent to the AI assistant.");return;}
  if(text.startsWith("/remember ")){const m=text.slice(10).trim();if(!m){await sendTelegramMessage(chatId,"Use /remember <text>");return;}await saveMemory(userId,m);await sendTelegramMessage(chatId,"✅ Saved to memory.");return;}
  if(text==="/memories"){const ms=await getMemories(userId);await sendTelegramMessage(chatId,ms.length?"🧠 Saved memories:\n\n"+ms.map((m,i)=>`${i+1}. ${m.content}`).join("\n"):"🧠 No saved memories yet.");}
}

export async function POST(request:NextRequest){
  if(!validSecret(request))return NextResponse.json({ok:false},{status:401});
  try{
    const u=(await request.json()) as Update; const m=u.message; const text=m?.text?.trim(); const from=m?.from;
    if(!m||!text||!from)return NextResponse.json({ok:true});
    if(!owner(from.id)){await sendTelegramMessage(m.chat.id,"🔒 This is a private assistant.");return NextResponse.json({ok:true});}
    await initDatabase(); await upsertUser(from);
    if(text.startsWith("/")){await command(m.chat.id,from.id,text);return NextResponse.json({ok:true});}
    await saveMessage(from.id,"user",text);
    const reply=await generateAssistantReply(await getRecentMessages(from.id),await getMemories(from.id));
    await saveMessage(from.id,"assistant",reply); await sendTelegramMessage(m.chat.id,reply);
    return NextResponse.json({ok:true});
  }catch(e){console.error("Webhook error",e);return NextResponse.json({ok:true});}
}