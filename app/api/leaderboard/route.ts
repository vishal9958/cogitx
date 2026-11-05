import { NextRequest, NextResponse } from "next/server";
import { getPool, initDb } from "@/lib/db";

// ── GET: Fetch top leaderboard entries OR check existing player ───
export async function GET(req: NextRequest) {
  try {
    await initDb();
    const pool = getPool();

    // ?email=xxx  →  check if this player already submitted
    const { searchParams } = new URL(req.url);
    const emailParam = searchParams.get("email");

    if (emailParam) {
      const email = emailParam.trim().toLowerCase();
      const existing = await pool.query(`
        SELECT
          player_name,
          final_score,
          time_taken_secs,
          words_correct,
          hints_used,
          wrong_attempts,
          completed_at,
          RANK() OVER (ORDER BY final_score DESC, time_taken_secs ASC) AS rank
        FROM leaderboard_entries
        WHERE player_email = $1
        ORDER BY final_score DESC
        LIMIT 1
      `, [email]);

      if (existing.rows.length > 0) {
        return NextResponse.json({ success: true, alreadyPlayed: true, entry: existing.rows[0] });
      }
      return NextResponse.json({ success: true, alreadyPlayed: false });
    }

    // No email param → return full leaderboard
    const result = await pool.query(`
      SELECT
        RANK() OVER (ORDER BY final_score DESC, time_taken_secs ASC) AS rank,
        player_name,
        player_email,
        final_score,
        time_taken_secs,
        words_correct,
        hints_used,
        wrong_attempts,
        completed_at
      FROM leaderboard_entries
      ORDER BY final_score DESC, time_taken_secs ASC
      LIMIT 50
    `);

    return NextResponse.json({ success: true, entries: result.rows });
  } catch (error: any) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

// ── POST: Submit a score ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await initDb();
    const pool = getPool();

    const body = await req.json();
    const {
      player_name,
      player_email,
      words_correct,
      hints_used,
      wrong_attempts,
      time_taken_secs,
    } = body;

    // Validate required fields
    if (!player_name || typeof player_name !== "string") {
      return NextResponse.json(
        { success: false, error: "player_name is required" },
        { status: 400 }
      );
    }

    const name = player_name.trim().slice(0, 50);
    const email = (player_email || "").toString().trim().toLowerCase().slice(0, 100);

    if (!name) {
      return NextResponse.json(
        { success: false, error: "player_name cannot be empty" },
        { status: 400 }
      );
    }

    const wc = Math.max(0, Math.min(14, parseInt(words_correct) || 0));
    const hu = Math.max(0, Math.min(10, parseInt(hints_used) || 0));
    const wa = Math.max(0, parseInt(wrong_attempts) || 0);
    const tt = Math.max(0, parseInt(time_taken_secs) || 0);

    // ── Server-side score calculation (must match frontend display) ──
    // Base: 100 pts per correct word
    // SPARK bonus: +300 if all 14 words correct
    // Hint penalty: -100 per hint used
    // Wrong attempt penalty: -20 per wrong check
    const BASE_PER_WORD = 100;
    const SPARK_BONUS = wc === 14 ? 300 : 0;
    const HINT_PENALTY = hu * 100;
    const WRONG_PENALTY = wa * 20;
    const final_score = Math.max(0, wc * BASE_PER_WORD + SPARK_BONUS - HINT_PENALTY - WRONG_PENALTY);

    const result = await pool.query(
      `INSERT INTO leaderboard_entries
         (player_name, player_email, final_score, time_taken_secs, words_correct, hints_used, wrong_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, player_name, final_score, time_taken_secs`,
      [name, email, final_score, tt, wc, hu, wa]
    );

    // Compute this player's rank after insert
    const rankResult = await pool.query(`
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY final_score DESC, time_taken_secs ASC) AS rank
        FROM leaderboard_entries
      ) ranked WHERE id = $1
    `, [result.rows[0].id]);

    const myRank = rankResult.rows[0]?.rank ?? null;

    return NextResponse.json({
      success: true,
      entry: { ...result.rows[0], rank: myRank },
      final_score,
      rank: myRank,
    });
  } catch (error: any) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}
