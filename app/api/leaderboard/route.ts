import { NextRequest, NextResponse } from "next/server";
import { getPool, initDb } from "@/lib/db";

// ── GET: Fetch top leaderboard entries ────────────────────────────
export async function GET() {
  try {
    await initDb();
    const pool = getPool();

    const result = await pool.query(`
      SELECT
        RANK() OVER (ORDER BY final_score DESC, time_taken_secs ASC) AS rank,
        player_name,
        final_score,
        time_taken_secs,
        words_correct,
        hints_used,
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
    const { player_name, words_correct, hints_used, time_taken_secs } = body;

    // Validate inputs
    if (!player_name || typeof player_name !== "string") {
      return NextResponse.json(
        { success: false, error: "player_name is required" },
        { status: 400 }
      );
    }

    const name = player_name.trim().slice(0, 50);
    if (!name) {
      return NextResponse.json(
        { success: false, error: "player_name cannot be empty" },
        { status: 400 }
      );
    }

    const wc = Math.max(0, Math.min(14, parseInt(words_correct) || 0));
    const hu = Math.max(0, Math.min(10, parseInt(hints_used) || 0));
    const tt = Math.max(0, parseInt(time_taken_secs) || 0);

    // Server-side score calculation
    // Base: 100pts per word, +300 SPARK bonus if all 14 correct
    // Hint penalty: -100 per hint
    const BASE_PER_WORD = 100;
    const SPARK_BONUS = wc === 14 ? 300 : 0;
    const HINT_PENALTY = hu * 100;
    const final_score = Math.max(
      0,
      wc * BASE_PER_WORD + SPARK_BONUS - HINT_PENALTY
    );

    const result = await pool.query(
      `INSERT INTO leaderboard_entries
         (player_name, final_score, time_taken_secs, words_correct, hints_used)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, player_name, final_score, time_taken_secs`,
      [name, final_score, tt, wc, hu]
    );

    // Get this player's rank
    const rankResult = await pool.query(
      `SELECT RANK() OVER (ORDER BY final_score DESC, time_taken_secs ASC) AS rank
       FROM leaderboard_entries
       ORDER BY final_score DESC, time_taken_secs ASC`,
    );
    const myRank = rankResult.rows.find(
      (_: any, idx: number) =>
        idx === rankResult.rows.indexOf(
          rankResult.rows.find((__: any, i: number) => i === result.rows[0]?.id - 1) ?? rankResult.rows[0]
        )
    );

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
      final_score,
    });
  } catch (error: any) {
    console.error("Leaderboard POST error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}
