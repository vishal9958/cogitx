import { Pool } from "pg";

// Singleton pool for Neon PostgreSQL
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/** Create the leaderboard table if it doesn't exist */
export async function initDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id              SERIAL PRIMARY KEY,
        player_name     TEXT NOT NULL,
        final_score     INTEGER NOT NULL DEFAULT 0,
        time_taken_secs INTEGER NOT NULL DEFAULT 0,
        words_correct   INTEGER NOT NULL DEFAULT 0,
        hints_used      INTEGER NOT NULL DEFAULT 0,
        completed_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_lb_score
        ON leaderboard_entries (final_score DESC, time_taken_secs ASC);
    `);
  } finally {
    client.release();
  }
}
