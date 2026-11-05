"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  final_score: number;
  time_taken_secs: number;
  words_correct: number;
  hints_used: number;
  completed_at: string;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: "1.3rem" }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: "1.3rem" }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: "1.3rem" }}>🥉</span>;
  return <span style={{ color: "#888", fontWeight: 700 }}>#{rank}</span>;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEntries(data.entries);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      {/* Background particle dots */}
      <div style={styles.bgDots} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <Link href="/" style={styles.backBtn}>
            ← Back to Puzzle
          </Link>
          <div style={styles.titleWrap}>
            <span style={styles.diya}>🪔</span>
            <h1 style={styles.title}>Leaderboard</h1>
            <span style={styles.diya}>🪔</span>
          </div>
          <p style={styles.subtitle}>Top Diwali Crossword Solvers</p>
        </div>

        {/* Table Card */}
        <div style={styles.card}>
          {loading && (
            <div style={styles.center}>
              <div style={styles.spinner} />
              <p style={{ color: "#888", marginTop: 16 }}>Loading scores…</p>
            </div>
          )}

          {error && (
            <div style={styles.center}>
              <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>⚠ {error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div style={styles.center}>
              <p style={{ color: "#888" }}>No scores yet. Be the first! 🎉</p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 60, textAlign: "center" }}>Rank</th>
                    <th style={{ ...styles.th, textAlign: "left" }}>Player</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Time</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr
                      key={idx}
                      style={{
                        ...styles.tr,
                        ...(e.rank <= 3 ? styles.topRow : {}),
                      }}
                    >
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <RankBadge rank={Number(e.rank)} />
                      </td>
                      <td style={{ ...styles.td, textAlign: "left" }}>
                        <span style={styles.playerName}>{e.player_name}</span>
                        <span style={styles.wordsMeta}>
                          {e.words_correct}/14 words
                          {e.hints_used > 0 && ` · ${e.hints_used} hint${e.hints_used > 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "center", color: "#a0a0a0" }}>
                        {formatTime(Number(e.time_taken_secs))}
                      </td>
                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <span style={styles.score}>{e.final_score}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <a
            href="https://cogitx.ai/platform"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.cogitxBadge}
          >
            Built on CogitX Platform →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f13 0%, #1a1a22 50%, #0f0f13 100%)",
    color: "#f0f0f0",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgDots: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(circle, rgba(255,180,0,0.07) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: 680,
    margin: "0 auto",
    padding: "32px 16px 48px",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  backBtn: {
    display: "inline-block",
    color: "#888",
    textDecoration: "none",
    fontSize: "0.85rem",
    marginBottom: 20,
    padding: "6px 12px",
    border: "1px solid #333",
    borderRadius: 8,
    transition: "color 0.2s, border-color 0.2s",
  },
  titleWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 6,
  },
  diya: {
    fontSize: "1.8rem",
    filter: "drop-shadow(0 0 8px rgba(255,180,0,0.6))",
  },
  title: {
    fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg, #FFD700 0%, #FF8C00 60%, #FFD700 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  subtitle: {
    color: "#666",
    fontSize: "0.88rem",
    marginTop: 4,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    backdropFilter: "blur(12px)",
    overflow: "hidden",
    minHeight: 200,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(255,215,0,0.2)",
    borderTop: "3px solid #FFD700",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "14px 16px",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#555",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(0,0,0,0.2)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s",
  },
  topRow: {
    background: "rgba(255,215,0,0.04)",
  },
  td: {
    padding: "14px 16px",
    verticalAlign: "middle",
  },
  playerName: {
    display: "block",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: "#f0f0f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 180,
  },
  wordsMeta: {
    display: "block",
    fontSize: "0.72rem",
    color: "#555",
    marginTop: 2,
  },
  score: {
    fontWeight: 800,
    fontSize: "1.1rem",
    color: "#FFD700",
    letterSpacing: "-0.02em",
  },
  footer: {
    textAlign: "center",
    marginTop: 32,
  },
  cogitxBadge: {
    display: "inline-block",
    color: "#555",
    textDecoration: "none",
    fontSize: "0.78rem",
    letterSpacing: "0.05em",
    padding: "6px 14px",
    border: "1px solid #333",
    borderRadius: 20,
    transition: "color 0.2s",
  },
};
