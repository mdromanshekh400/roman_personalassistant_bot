import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.pgPool) {
    global.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return global.pgPool;
}

export interface UserRecord {
  id: number;
  telegram_id: string;
  first_name?: string | null;
  username?: string | null;
}

export async function initializeDatabase() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      first_name TEXT,
      username TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS memories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      remind_at TIMESTAMPTZ NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function getOrCreateUser(data: {
  telegramId: string;
  firstName?: string;
  username?: string;
}): Promise<UserRecord> {
  const pool = getPool();

  await initializeDatabase();

  const result = await pool.query<UserRecord>(
    `
      INSERT INTO users (telegram_id, first_name, username)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        username = EXCLUDED.username
      RETURNING id, telegram_id, first_name, username
    `,
    [data.telegramId, data.firstName ?? null, data.username ?? null]
  );

  return result.rows[0];
}

export async function saveMemory(
  userId: number,
  content: string
) {
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO memories (user_id, content)
      VALUES ($1, $2)
    `,
    [userId, content]
  );
}

export async function getMemories(userId: number) {
  const pool = getPool();

  const result = await pool.query(
    `
      SELECT id, content, created_at
      FROM memories
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `,
    [userId]
  );

  return result.rows;
}

export async function saveMessage(
  userId: number,
  role: "user" | "assistant",
  content: string
) {
  const pool = getPool();

  await pool.query(
    `
      INSERT INTO messages (user_id, role, content)
      VALUES ($1, $2, $3)
    `,
    [userId, role, content]
  );
}

export async function getRecentMessages(
  userId: number,
  limit = 20
) {
  const pool = getPool();

  const result = await pool.query(
    `
      SELECT role, content, created_at
      FROM messages
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows.reverse();
}
