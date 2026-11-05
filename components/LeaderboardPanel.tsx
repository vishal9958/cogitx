"use client";

import React, { useEffect, useState } from "react";

interface LBEntry {
  rank: number;
  player_name: string;
  player_email: string;
  final_score: number;
  time_taken_secs: number;
  words_correct: number;
  hints_used: number;
  wrong_attempts: number;
}

interface MyPos {
  name: string;
  rank: number | null;
  score: number;
  time: number;
}

function fmt(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function mask(email: string) {
  if (!email?.includes("@")) return "";
  const [l, d] = email.split("@");
  return `${l[0]}***@${d}`;
}

// ── Podium ────────────────────────────────────────────────────────
function Podium({ entries }: { entries: LBEntry[] }) {
  const p1 = entries.find((e) => Number(e.rank) === 1);
  const p2 = entries.find((e) => Number(e.rank) === 2);
  const p3 = entries.find((e) => Number(e.rank) === 3);

  const Slot = ({
    entry, pos, blockH, emoji, color, size,
  }: {
    entry: LBEntry | undefined; pos: number; blockH: number;
    emoji: string; color: string; size: number;
  }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
        {/* Avatar */}
        <div style={{
          position: "relative", width: size, height: size, borderRadius: "50%",
          background: "rgba(255,255,255,0.06)", border: `2px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: size * 0.38, color,
          boxShadow: `0 0 16px ${color}44`, marginBottom: 6, flexShrink: 0,
        }}>
          {entry ? entry.player_name.charAt(0).toUpperCase() : "?"}
          <span style={{
            position: "absolute", top: -8, right: -4,
            fontSize: pos === 1 ? "1.1rem" : "0.9rem",
            filter: `drop-shadow(0 0 5px ${color})`, lineHeight: 1,
          }}>{emoji}</span>
        </div>
        <div style={{
          fontWeight: 700, fontSize: pos === 1 ? "0.83rem" : "0.72rem",
          color: "#d0d0d0", maxWidth: pos === 1 ? 120 : 90,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center",
        }}>{entry?.player_name ?? "—"}</div>
        <div style={{
          fontWeight: 900, fontSize: pos === 1 ? "0.98rem" : "0.85rem",
          color, letterSpacing: "-0.02em", marginTop: 2,
        }}>
          {entry ? entry.final_score : "—"}
          <span style={{ fontSize: "0.6rem", fontWeight: 600, marginLeft: 2, opacity: 0.7 }}>pts</span>
        </div>
        <div style={{ fontSize: "0.65rem", color: "#555", marginTop: 1 }}>
          {entry ? fmt(Number(entry.time_taken_secs)) : ""}
        </div>
      </div>
      {/* Block */}
      <div style={{
        width: "88%", height: blockH,
        background: `linear-gradient(180deg,${color}18 0%,${color}06 100%)`,
        border: `1px solid ${color}28`, borderBottom: "none",
        borderRadius: "8px 8px 0 0",
        display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 8,
      }}>
        <span style={{ fontWeight: 900, fontSize: "1.5rem", color: `${color}30`, letterSpacing: "-0.04em" }}>
          {pos}
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "0 8px" }}>
      <Slot entry={p2} pos={2} blockH={70} emoji="🥈" color="#94a3b8" size={50} />
      <Slot entry={p1} pos={1} blockH={100} emoji="🥇" color="#FFD700" size={62} />
      <Slot entry={p3} pos={3} blockH={50} emoji="🥉" color="#cd7f32" size={44} />
    </div>
  );
}

// ── LeaderboardPanel ──────────────────────────────────────────────
export default function LeaderboardPanel({
  onClose,
  playerName,
}: {
  onClose: () => void;
  playerName?: string;
}) {
  const [entries, setEntries] = useState<LBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myPos, setMyPos] = useState<MyPos | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { if (d.success) setEntries(d.entries); else setError(d.error); })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!entries.length || !playerName) return;
    const match = entries.find((e) => e.player_name.toLowerCase() === playerName.toLowerCase());
    if (match) {
      setMyPos({ name: match.player_name, rank: Number(match.rank), score: match.final_score, time: Number(match.time_taken_secs) });
    }
  }, [entries, playerName]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 10);

  return (
    /* Full-screen overlay */
    <div style={{
      position: "fixed", inset: 0, zIndex: 90,
      background: "rgba(8,8,12,0.72)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={onClose}
    >
      {/* Panel — slides up, same paper aesthetic */}
      <div
        style={{
          width: "100%", maxWidth: 480,
          maxHeight: "92vh",
          background: "#EFEFEF",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
          animation: "slideUp 0.3s cubic-bezier(0.22,0.9,0.3,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .lb-list-row:hover { background: rgba(242,239,210,0.6) !important; }
        `}</style>

        {/* Handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "#C3C3C8" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "4px 18px 10px",
          borderBottom: "1px solid #C3C3C8",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.1rem", filter: "drop-shadow(0 0 6px rgba(255,180,0,0.7))" }}>🪔</span>
            <h2 style={{
              fontFamily: "'Inter Tight','Inter',sans-serif",
              fontWeight: 900, fontSize: "1.1rem",
              letterSpacing: "-0.03em", color: "#141416",
              textTransform: "uppercase", margin: 0,
            }}>Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#D9D9DB", border: "none", borderRadius: "50%",
              width: 30, height: 30, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem", color: "#4B4B51", fontWeight: 700,
            }}
          >✕</button>
        </div>

        {/* Score formula */}
        <div style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center",
          gap: "2px 6px", padding: "6px 16px",
          fontSize: "0.62rem", fontWeight: 600, color: "#8A8A90",
          borderBottom: "1px solid #E0E0E4",
        }}>
          <span>100 pts/word</span><span style={{ color: "#C3C3C8" }}>·</span>
          <span>+300 SPARK</span><span style={{ color: "#C3C3C8" }}>·</span>
          <span>−100/hint</span><span style={{ color: "#C3C3C8" }}>·</span>
          <span>−20/wrong</span>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: myPos?.rank ? 72 : 16 }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
              <div style={{
                width: 26, height: 26, border: "3px solid #C3C3C8",
                borderTop: "3px solid #141416", borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
              <p style={{ color: "#8A8A90", marginTop: 12, fontSize: "0.82rem" }}>Loading…</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "36px 20px", textAlign: "center" }}>
              <p style={{ color: "#C8322B", fontSize: "0.85rem" }}>⚠ {error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ color: "#8A8A90", fontSize: "0.85rem" }}>No scores yet — be the first! 🎉</p>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <>
              {/* Podium */}
              <div style={{
                background: "#E8E8E0", borderBottom: "1px solid #C3C3C8",
                padding: "16px 12px 0",
              }}>
                <p style={{
                  textAlign: "center", fontWeight: 700, fontSize: "0.62rem",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  color: "#8A8A90", marginBottom: 12,
                }}>🪔 Top Solvers</p>
                <Podium entries={top3} />
              </div>

              {/* Divider */}
              <div style={{ height: 2, background: "linear-gradient(90deg,transparent,#C3C3C8 30%,#C3C3C8 70%,transparent)" }} />

              {/* Rank 4–10 */}
              {rest.length > 0 && (
                <div>
                  <div style={{
                    padding: "8px 18px 5px",
                    fontSize: "0.62rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "#8A8A90", borderBottom: "1px solid #E0E0E4",
                  }}>Rankings</div>

                  {rest.map((e, i) => {
                    const rankNum = Number(e.rank);
                    const isMe = playerName && e.player_name.toLowerCase() === playerName.toLowerCase();
                    return (
                      <div key={i} className="lb-list-row" style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 18px",
                        borderBottom: "1px solid #E8E8EC",
                        background: isMe ? "rgba(242,239,210,0.7)" : "transparent",
                        borderLeft: isMe ? "3px solid #141416" : "3px solid transparent",
                        transition: "background 0.15s",
                      }}>
                        <div style={{
                          width: 26, textAlign: "center", flexShrink: 0,
                          fontWeight: 700, fontSize: "0.78rem", color: "#8A8A90",
                        }}>{rankNum}</div>

                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "#D9D9DB", border: "1px solid #C3C3C8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 800, fontSize: "0.82rem", color: "#4B4B51", flexShrink: 0,
                        }}>
                          {e.player_name.charAt(0).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: "0.85rem", color: "#141416",
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {e.player_name}
                            </span>
                            {isMe && (
                              <span style={{
                                fontSize: "0.55rem", fontWeight: 700,
                                background: "#141416", color: "#EFEFEF",
                                padding: "1px 5px", borderRadius: 999,
                                letterSpacing: "0.05em", flexShrink: 0,
                              }}>YOU</span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.63rem", color: "#8A8A90", marginTop: 2 }}>
                            {e.words_correct}/14 words
                            {e.hints_used > 0 && ` · ${e.hints_used} hint${e.hints_used !== 1 ? "s" : ""}`}
                            {e.wrong_attempts > 0 && ` · ${e.wrong_attempts} wrong`}
                            {mask(e.player_email) && ` · ${mask(e.player_email)}`}
                          </div>
                        </div>

                        <div style={{ fontSize: "0.75rem", color: "#8A8A90", flexShrink: 0, minWidth: 44, textAlign: "right" }}>
                          {fmt(Number(e.time_taken_secs))}
                        </div>

                        <div style={{
                          fontWeight: 900, fontSize: "0.95rem", color: "#141416",
                          flexShrink: 0, minWidth: 42, textAlign: "right",
                          letterSpacing: "-0.02em",
                        }}>
                          {e.final_score}
                          <span style={{ fontSize: "0.58rem", color: "#8A8A90", marginLeft: 2 }}>pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div style={{
                padding: "14px 18px 10px",
                borderTop: "1px solid #C3C3C8",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <img src="/assets/logo.png" alt="CogitX" style={{ height: 18, opacity: 0.55 }} />
                <span style={{ fontSize: "0.68rem", color: "#8A8A90" }}>Diwali Crossword 2026</span>
              </div>
            </>
          )}
        </div>

        {/* Sticky your-position bar inside panel */}
        {myPos && myPos.rank !== null && (
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(20,20,22,0.94)",
            backdropFilter: "blur(16px)",
            padding: "10px 16px",
            paddingBottom: "calc(10px + env(safe-area-inset-bottom,0px))",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(255,215,0,0.15)", border: "1.5px solid rgba(255,215,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "0.88rem", color: "#FFD700", flexShrink: 0,
              }}>
                {myPos.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "#f0f0f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {myPos.name}
                </div>
                <div style={{ fontSize: "0.6rem", color: "#555", marginTop: 1 }}>Your position</div>
              </div>
              {[
                { label: "Rank", value: `#${myPos.rank}`, color: "#f0f0f0" },
                { label: "Score", value: `${myPos.score}`, color: "#FFD700" },
                { label: "Time", value: fmt(myPos.time), color: "#f0f0f0" },
              ].map((c) => (
                <div key={c.label} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "3px 9px", minWidth: 46,
                }}>
                  <span style={{ fontSize: "0.52rem", color: "#555", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color: c.color, letterSpacing: "-0.02em" }}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
