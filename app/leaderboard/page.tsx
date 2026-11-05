"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  player_name: string;
  player_email: string;
  final_score: number;
  time_taken_secs: number;
  words_correct: number;
  hints_used: number;
  wrong_attempts: number;
  completed_at: string;
}

interface MyPosition {
  name: string;
  rank: number | null;
  score: number;
  time: number;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  return `${local[0]}***@${domain}`;
}

// ── Podium ────────────────────────────────────────────────────────
function PodiumSection({ entries }: { entries: LeaderboardEntry[] }) {
  const p1 = entries.find((e) => Number(e.rank) === 1);
  const p2 = entries.find((e) => Number(e.rank) === 2);
  const p3 = entries.find((e) => Number(e.rank) === 3);

  interface SlotProps {
    entry: LeaderboardEntry | undefined;
    pos: number;
    blockH: number;
    emoji: string;
    nameColor: string;
    scoreColor: string;
    borderColor: string;
    avatarSize: number;
    fontSize: number;
  }

  const Slot = ({ entry, pos, blockH, emoji, nameColor, scoreColor, borderColor, avatarSize, fontSize }: SlotProps) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      {/* Avatar + info */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
        <div style={{
          position: "relative",
          width: avatarSize, height: avatarSize, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: `2px solid ${borderColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: fontSize, color: nameColor,
          fontFamily: "'Inter Tight','Inter',sans-serif",
          boxShadow: `0 0 18px ${borderColor}44`,
          marginBottom: 6,
          flexShrink: 0,
        }}>
          {entry ? entry.player_name.charAt(0).toUpperCase() : "?"}
          <span style={{
            position: "absolute", top: -8, right: -4,
            fontSize: pos === 1 ? "1.1rem" : "0.9rem",
            filter: `drop-shadow(0 0 6px ${borderColor})`,
            lineHeight: 1,
          }}>{emoji}</span>
        </div>
        <div style={{
          fontWeight: 700, fontSize: pos === 1 ? "0.85rem" : "0.75rem",
          color: "#d0d0d0", maxWidth: pos === 1 ? 130 : 100,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          textAlign: "center", fontFamily: "'Inter','sans-serif'",
        }}>
          {entry?.player_name ?? "—"}
        </div>
        <div style={{
          fontWeight: 900, fontSize: pos === 1 ? "1.0rem" : "0.88rem",
          color: scoreColor, marginTop: 2,
          fontFamily: "'Inter Tight','Inter',sans-serif",
          letterSpacing: "-0.02em",
        }}>
          {entry ? `${entry.final_score}` : "—"}
          <span style={{ fontSize: "0.65rem", fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
        </div>
        <div style={{ fontSize: "0.68rem", color: "#555", marginTop: 1 }}>
          {entry ? formatTime(Number(entry.time_taken_secs)) : ""}
        </div>
      </div>
      {/* Podium block */}
      <div style={{
        width: "90%",
        height: blockH,
        background: `linear-gradient(180deg, ${borderColor}18 0%, ${borderColor}08 100%)`,
        border: `1px solid ${borderColor}28`,
        borderBottom: "none",
        borderRadius: "8px 8px 0 0",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 8,
      }}>
        <span style={{
          fontWeight: 900, fontSize: "1.6rem",
          color: `${borderColor}30`,
          fontFamily: "'Inter Tight','Inter',sans-serif",
          letterSpacing: "-0.04em",
        }}>{pos}</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 8px" }}>
      <Slot entry={p2} pos={2} blockH={72} emoji="🥈"
        nameColor="#94a3b8" scoreColor="#94a3b8" borderColor="#94a3b8"
        avatarSize={52} fontSize={20} />
      <Slot entry={p1} pos={1} blockH={100} emoji="🥇"
        nameColor="#FFD700" scoreColor="#FFD700" borderColor="#FFD700"
        avatarSize={64} fontSize={24} />
      <Slot entry={p3} pos={3} blockH={52} emoji="🥉"
        nameColor="#cd7f32" scoreColor="#cd7f32" borderColor="#cd7f32"
        avatarSize={46} fontSize={18} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPos, setMyPos] = useState<MyPosition | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEntries(data.entries);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));

    try {
      const raw = sessionStorage.getItem("cogitx-player");
      if (raw) {
        const p = JSON.parse(raw);
        setMyPos({ name: p.name, rank: null, score: 0, time: 0 });
      }
    } catch { }
  }, []);

  // Match player name to entry once loaded
  useEffect(() => {
    if (!entries.length || !myPos) return;
    const match = entries.find(
      (e) => e.player_name.toLowerCase() === myPos.name.toLowerCase()
    );
    if (match) {
      setMyPos({
        name: match.player_name,
        rank: Number(match.rank),
        score: match.final_score,
        time: Number(match.time_taken_secs),
      });
    }
  }, [entries]);

  const top10 = entries.slice(0, 10);
  const restAfter3 = top10.slice(3);

  return (
    <>
      {/* ── Global styles injected for this page ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;900&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body {
          background: #EFEFEF;
          color: #141416;
          font-family: 'Inter', -apple-system, sans-serif;
          overflow-x: hidden;
        }
        .lb-row:hover { background: rgba(242,239,210,0.5) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(10px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#EFEFEF",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative",
      }}>

        {/* Paper texture overlay */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          opacity: 0.55, mixBlendMode: "multiply",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='table' tableValues='0 .22'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        {/* Grid line background */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(to right,#C3C3C8 1px,transparent 1px),linear-gradient(to bottom,#C3C3C8 1px,transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 0 120px" }}>

          {/* ── Header strip ── */}
          <div style={{
            padding: "18px 20px 14px",
            borderBottom: "1px solid #C3C3C8",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center",
              color: "#4B4B51", textDecoration: "none",
              fontSize: 13, fontWeight: 600, gap: 4,
            }}>
              ← Puzzle
            </Link>
            <div style={{ flex: 1, textAlign: "center" }}>
              <h1 style={{
                fontFamily: "'Inter Tight','Inter',sans-serif",
                fontWeight: 900, fontSize: "clamp(1.3rem,4vw,1.7rem)",
                letterSpacing: "-0.03em", color: "#141416",
                textTransform: "uppercase", lineHeight: 1,
              }}>Leaderboard</h1>
            </div>
            <img src="/assets/logo.png" alt="CogitX"
              style={{ height: 24, opacity: 0.7 }} />
          </div>

          {/* ── Score formula ── */}
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center",
            gap: "2px 8px", padding: "8px 16px",
            fontSize: "0.68rem", fontWeight: 600,
            color: "#8A8A90", letterSpacing: "0.04em",
            borderBottom: "1px solid #E0E0E4",
          }}>
            <span>100 pts/word</span><span style={{ color: "#C3C3C8" }}>·</span>
            <span>+300 SPARK</span><span style={{ color: "#C3C3C8" }}>·</span>
            <span>−100/hint</span><span style={{ color: "#C3C3C8" }}>·</span>
            <span>−20/wrong check</span>
          </div>

          {/* ── Loading / Error / Empty ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px" }}>
              <div style={{
                width: 28, height: 28, border: "3px solid #C3C3C8",
                borderTop: "3px solid #141416", borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
              <p style={{ color: "#8A8A90", marginTop: 14, fontSize: "0.85rem" }}>Loading scores…</p>
            </div>
          )}
          {error && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ color: "#C8322B", fontSize: "0.9rem" }}>⚠ {error}</p>
            </div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <p style={{ color: "#8A8A90", fontSize: "0.88rem" }}>
                No scores yet — be the first! 🪔
              </p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              {/* ── Podium section ── */}
              <div style={{
                background: "#E8E8E0",
                borderBottom: "1px solid #C3C3C8",
                padding: "20px 16px 0",
              }}>
                <p style={{
                  textAlign: "center",
                  fontFamily: "'Inter Tight','Inter',sans-serif",
                  fontWeight: 700, fontSize: "0.68rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "#8A8A90", marginBottom: 16,
                }}>🪔 Top Solvers</p>
                <PodiumSection entries={entries} />
              </div>

              {/* Base line under podium */}
              <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#C3C3C8 30%,#C3C3C8 70%,transparent)" }} />

              {/* ── Top 10 list (rank 4–10) ── */}
              {restAfter3.length > 0 && (
                <div style={{ padding: "0 0 8px" }}>
                  <div style={{
                    padding: "10px 20px 6px",
                    fontSize: "0.65rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#8A8A90",
                    borderBottom: "1px solid #E0E0E4",
                  }}>
                    Rankings
                  </div>
                  {restAfter3.map((e, i) => {
                    const rankNum = Number(e.rank);
                    const isMe = myPos?.name?.toLowerCase() === e.player_name.toLowerCase();
                    return (
                      <div
                        key={i}
                        className="lb-row"
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "11px 20px",
                          borderBottom: "1px solid #E8E8EC",
                          background: isMe ? "rgba(242,239,210,0.7)" : "transparent",
                          animation: `fadeUp 0.25s ease ${i * 0.04}s both`,
                          borderLeft: isMe ? "3px solid #4B4B51" : "3px solid transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Rank */}
                        <div style={{
                          width: 28, textAlign: "center", flexShrink: 0,
                          fontWeight: 700, fontSize: "0.8rem",
                          fontFamily: "'Inter Tight','Inter',sans-serif",
                          color: "#8A8A90",
                        }}>
                          {rankNum}
                        </div>

                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "#D9D9DB", border: "1px solid #C3C3C8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "0.85rem", color: "#4B4B51",
                          flexShrink: 0,
                        }}>
                          {e.player_name.charAt(0).toUpperCase()}
                        </div>

                        {/* Name + meta */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: "0.88rem", color: "#141416",
                            display: "flex", alignItems: "center", gap: 5,
                            overflow: "hidden",
                          }}>
                            <span style={{
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>{e.player_name}</span>
                            {isMe && (
                              <span style={{
                                fontSize: "0.58rem", fontWeight: 700,
                                background: "#141416", color: "#EFEFEF",
                                padding: "1px 6px", borderRadius: 999,
                                letterSpacing: "0.05em", flexShrink: 0,
                              }}>YOU</span>
                            )}
                          </div>
                          <div style={{
                            fontSize: "0.67rem", color: "#8A8A90", marginTop: 2,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {e.words_correct}/14 words
                            {e.hints_used > 0 && ` · ${e.hints_used} hint${e.hints_used !== 1 ? "s" : ""}`}
                            {e.wrong_attempts > 0 && ` · ${e.wrong_attempts} wrong`}
                            {maskEmail(e.player_email) && ` · ${maskEmail(e.player_email)}`}
                          </div>
                        </div>

                        {/* Time */}
                        <div style={{
                          fontSize: "0.78rem", color: "#8A8A90",
                          flexShrink: 0, fontVariantNumeric: "tabular-nums",
                          minWidth: 48, textAlign: "right",
                        }}>
                          {formatTime(Number(e.time_taken_secs))}
                        </div>

                        {/* Score */}
                        <div style={{
                          fontWeight: 900, fontSize: "1rem", color: "#141416",
                          flexShrink: 0, minWidth: 44, textAlign: "right",
                          fontFamily: "'Inter Tight','Inter',sans-serif",
                          letterSpacing: "-0.02em",
                        }}>
                          {e.final_score}
                          <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "#8A8A90", marginLeft: 2 }}>pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Footer ── */}
              <div style={{
                padding: "20px 20px 12px",
                borderTop: "1px solid #C3C3C8",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <img src="/assets/logo.png" alt="CogitX" style={{ height: 20, opacity: 0.6 }} />
                <a href="https://www.cogitx.ai" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "0.72rem", color: "#8A8A90", textDecoration: "none" }}>
                  www.cogitx.ai
                </a>
              </div>
            </>
          )}
        </div>

        {/* ── Sticky Bottom Bar: Your Position ── */}
        {myPos && myPos.rank !== null && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
            background: "rgba(20,20,22,0.94)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
            padding: "10px 16px",
            paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
          }}>
            <div style={{
              maxWidth: 480, margin: "0 auto",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,215,0,0.15)",
                border: "1.5px solid rgba(255,215,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.9rem", color: "#FFD700",
                flexShrink: 0,
              }}>
                {myPos.name.charAt(0).toUpperCase()}
              </div>
              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: "0.82rem", color: "#f0f0f0",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{myPos.name}</div>
                <div style={{ fontSize: "0.62rem", color: "#555", marginTop: 1 }}>Your position</div>
              </div>
              {/* Stats chips */}
              {[
                { label: "Rank", value: `#${myPos.rank}`, color: "#f0f0f0" },
                { label: "Score", value: `${myPos.score}`, color: "#FFD700" },
                { label: "Time", value: formatTime(myPos.time), color: "#f0f0f0" },
              ].map((chip) => (
                <div key={chip.label} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "4px 10px", minWidth: 48,
                }}>
                  <span style={{
                    fontSize: "0.55rem", color: "#555", fontWeight: 700,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>{chip.label}</span>
                  <span style={{
                    fontSize: "0.82rem", fontWeight: 800,
                    color: chip.color, letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                  }}>{chip.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
