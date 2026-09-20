import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export async function initDatabase() {
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS users (
    telegram_user_id BIGINT PRIMARY KEY, username TEXT, first_name TEXT, last_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await q`CREATE TABLE IF NOT EXISTS memories (
    id BIGSERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
    content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await q`CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')), content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await q`CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY, telegram_user_id BIGINT NOT NULL REFERENCES users(telegram_user_id) ON DELETE CASCADE,
    text TEXT NOT NULL, remind_at TIMESTAMPTZ NOT NULL, sent BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export async function upsertUser(u:{id:number;username?:string;first_name?:string;last_name?:string}) {
  await sql()`INSERT INTO users (telegram_user_id,username,first_name,last_name)
    VALUES (${u.id},${u.username??null},${u.first_name??null},${u.last_name??null})
    ON CONFLICT (telegram_user_id) DO UPDATE SET username=EXCLUDED.username,first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,updated_at=NOW()`;
}
export async function saveMessage(id:number,role:"user"|"assistant",content:string){
  await sql()`INSERT INTO messages (telegram_user_id,role,content) VALUES (${id},${role},${content})`;
}
export async function getRecentMessages(id:number,limit=12){
  return await sql()`SELECT role,content FROM (SELECT role,content,created_at FROM messages WHERE telegram_user_id=${id} ORDER BY created_at DESC LIMIT ${limit}) x ORDER BY created_at ASC` as {role:"user"|"assistant";content:string}[];
}
export async function saveMemory(id:number,content:string){
  await sql()`INSERT INTO memories (telegram_user_id,content) VALUES (${id},${content})`;
}
export async function getMemories(id:number,limit=20){
  return await sql()`SELECT content FROM memories WHERE telegram_user_id=${id} ORDER BY created_at DESC LIMIT ${limit}` as {content:string}[];
}