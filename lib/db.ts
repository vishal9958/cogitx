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

/** Create / migrate the leaderboard table */
export async function initDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    // Create table with all columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_entries (
        id              SERIAL PRIMARY KEY,
        player_name     TEXT NOT NULL,
        player_email    TEXT NOT NULL DEFAULT '',
        final_score     INTEGER NOT NULL DEFAULT 0,
        time_taken_secs INTEGER NOT NULL DEFAULT 0,
        words_correct   INTEGER NOT NULL DEFAULT 0,
        hints_used      INTEGER NOT NULL DEFAULT 0,
        wrong_attempts  INTEGER NOT NULL DEFAULT 0,
        completed_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add missing columns if upgrading from old schema
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='leaderboard_entries' AND column_name='player_email'
        ) THEN
          ALTER TABLE leaderboard_entries ADD COLUMN player_email TEXT NOT NULL DEFAULT '';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='leaderboard_entries' AND column_name='wrong_attempts'
        ) THEN
          ALTER TABLE leaderboard_entries ADD COLUMN wrong_attempts INTEGER NOT NULL DEFAULT 0;
        END IF;
      END
      $$
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lb_score
        ON leaderboard_entries (final_score DESC, time_taken_secs ASC)
    `);
  } finally {
    client.release();
  }
}
