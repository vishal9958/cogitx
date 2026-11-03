"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import FireworksOverlay from "../components/FireworksOverlay";

interface CellDef {
  r: number;
  c: number;
  solution: string;
}

const CROSSWORD_CELLS: CellDef[] = [
  // 1 Across: LAMP (row 0, cols 11-14)
  { r: 0, c: 11, solution: "L" },
  { r: 0, c: 12, solution: "A" },
  { r: 0, c: 13, solution: "M" },
  { r: 0, c: 14, solution: "P" },

  // 2 Down continuation: PEACE (rows 1-4, col 14)
  { r: 1, c: 14, solution: "E" },
  { r: 2, c: 14, solution: "A" },
  { r: 3, c: 14, solution: "C" },
  { r: 4, c: 14, solution: "E" },

  // 3 Down: WISH (rows 1-4, col 7)
  { r: 1, c: 7, solution: "W" },
  { r: 2, c: 7, solution: "I" },
  { r: 3, c: 7, solution: "S" },
  { r: 4, c: 7, solution: "H" },

  // 4 Down: DARKNESS (rows 1-8, col 9)
  { r: 1, c: 9, solution: "D" },
  { r: 2, c: 9, solution: "A" },
  { r: 3, c: 9, solution: "R" },
  { r: 4, c: 9, solution: "K" },
  { r: 5, c: 9, solution: "N" },
  { r: 6, c: 9, solution: "E" },
  { r: 7, c: 9, solution: "S" },
  { r: 8, c: 9, solution: "S" },

  // 5 Across: DIYA (row 2, cols 6-9)
  { r: 2, c: 6, solution: "D" },
  { r: 2, c: 8, solution: "Y" },

  // 6 Down: RANGOLI (rows 2-8, col 11)
  { r: 2, c: 11, solution: "R" },
  { r: 3, c: 11, solution: "A" },
  { r: 4, c: 11, solution: "N" },
  { r: 5, c: 11, solution: "G" },
  { r: 6, c: 11, solution: "O" },
  { r: 7, c: 11, solution: "L" },
  { r: 8, c: 11, solution: "I" },

  // 7 Across: KINDLE (row 4, cols 9-14)
  { r: 4, c: 10, solution: "I" },
  { r: 4, c: 12, solution: "D" },
  { r: 4, c: 13, solution: "L" },

  // 8 Across: HOME (row 6, cols 6-9)
  { r: 6, c: 6, solution: "H" },
  { r: 6, c: 7, solution: "O" },
  { r: 6, c: 8, solution: "M" },

  // 9 Down: CANDLE (rows 7-12, col 13)
  { r: 7, c: 13, solution: "C" },
  { r: 8, c: 13, solution: "A" },
  { r: 9, c: 13, solution: "N" },
  { r: 10, c: 13, solution: "D" },
  { r: 11, c: 13, solution: "L" },
  { r: 12, c: 13, solution: "E" },

  // 10 Across: FESTIVAL (row 8, cols 7-14)
  { r: 8, c: 7, solution: "F" },
  { r: 8, c: 8, solution: "E" },
  { r: 8, c: 10, solution: "T" },
  { r: 8, c: 12, solution: "V" },
  { r: 8, c: 14, solution: "L" },

  // 11 Down: SWEETS (rows 10-15, col 11)
  { r: 10, c: 11, solution: "S" },
  { r: 11, c: 11, solution: "W" },
  { r: 12, c: 11, solution: "E" },
  { r: 13, c: 11, solution: "E" },
  { r: 14, c: 11, solution: "T" },
  { r: 15, c: 11, solution: "S" },

  // 12 Across: DIWALI (row 11, cols 9-14)
  { r: 11, c: 9, solution: "D" },
  { r: 11, c: 10, solution: "I" },
  { r: 11, c: 12, solution: "A" },
  { r: 11, c: 14, solution: "I" },

  // 13 Down: GIFTS (rows 12-16, col 8)
  { r: 12, c: 8, solution: "G" },
  { r: 13, c: 8, solution: "I" },
  { r: 14, c: 8, solution: "F" },
  { r: 15, c: 8, solution: "T" },
  { r: 16, c: 8, solution: "S" },

  // 14 Across: PETALS (row 15, cols 6-11)
  { r: 15, c: 6, solution: "P" },
  { r: 15, c: 7, solution: "E" },
  { r: 15, c: 9, solution: "A" },
  { r: 15, c: 10, solution: "L" },
];

export default function DiwaliCardPage() {
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [cellStatus, setCellStatus] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintToast, setHintToast] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [resultModal, setResultModal] = useState<{
    wordsCorrect: number;
    wordsTotal: number;
    allCorrect: boolean;
    trophy: boolean;
    aiMessage: string;
  } | null>(null);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const cellMap = useRef<Record<string, CellDef>>(
    CROSSWORD_CELLS.reduce((acc, cell) => {
      acc[`${cell.r}-${cell.c}`] = cell;
      return acc;
    }, {} as Record<string, CellDef>)
  ).current;

  const handleInput = (key: string, val: string) => {
    const char = val.slice(-1).toUpperCase();
    if (/^[A-Z]?$/.test(char)) {
      setLetters((prev) => ({ ...prev, [key]: char }));
      if (cellStatus[key]) {
        setCellStatus((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  const handleKeyDown = (key: string, e: KeyboardEvent<HTMLInputElement>) => {
    const [r, c] = key.split("-").map(Number);

    if (e.key === "Backspace") {
      if (!letters[key]) {
        const prevH = `${r}-${c - 1}`;
        const prevV = `${r - 1}-${c}`;
        const target = cellMap[prevH] ? prevH : cellMap[prevV] ? prevV : null;
        if (target) {
          inputRefs.current[target]?.focus();
        }
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = `${r}-${c + 1}`;
      if (cellMap[next]) inputRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = `${r}-${c - 1}`;
      if (cellMap[prev]) inputRefs.current[prev]?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const down = `${r + 1}-${c}`;
      if (cellMap[down]) inputRefs.current[down]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const up = `${r - 1}-${c}`;
      if (cellMap[up]) inputRefs.current[up]?.focus();
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      setTimeout(() => {
        const nextH = `${r}-${c + 1}`;
        const nextV = `${r + 1}-${c}`;
        const target = cellMap[nextH] ? nextH : cellMap[nextV] ? nextV : null;
        if (target) inputRefs.current[target]?.focus();
      }, 10);
    }
  };

  // Submit and check answers with CogitX Workflow
  const submitCrossword = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          playerName: "Player",
          grid: letters,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.details || "Failed to submit.");
      }

      if (data.cellStatus) {
        setCellStatus(data.cellStatus);
      }

      setResultModal({
        wordsCorrect: data.wordsCorrect,
        wordsTotal: data.wordsTotal,
        allCorrect: data.allCorrect,
        trophy: data.trophy,
        aiMessage: data.aiMessage,
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      setHintToast({
        title: "API Status",
        message: err.message || "Failed to reach CogitX workflow.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Request an AI hint from the CogitX Workflow
  const requestHint = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hint",
          playerName: "Player",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.details || "Failed to get hint.");
      }

      if (data.hint?.key && data.hint?.letter) {
        setLetters((prev) => ({
          ...prev,
          [data.hint.key]: data.hint.letter,
        }));
      }

      setHintToast({
        title: `Hint (${data.hint?.hintsLeft ?? 0} hints left)`,
        message: data.aiMessage || "Here is a hint for your puzzle!",
      });
    } catch (err: any) {
      console.error("Hint error:", err);
      setHintToast({
        title: "Hint Status",
        message: err.message || "Could not retrieve hint.",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setLetters({});
    setCellStatus({});
    setShowSolution(false);
  };

  const printCard = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="page-wrapper">
      {/* Diwali Fireworks & Crackers Sound Animation (plays behind modal) */}
      <FireworksOverlay
        active={Boolean(resultModal)}
        soundEnabled={soundEnabled}
      />

      {/* AI Hint Toast Banner */}
      {hintToast && (
        <aside className="ai-toast" role="alert">
          <div className="toast-icon">🪔</div>
          <div className="toast-content">
            <h4 className="toast-title">{hintToast.title}</h4>
            <p className="toast-message">{hintToast.message}</p>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => setHintToast(null)}
            aria-label="Close"
          >
            ×
          </button>
        </aside>
      )}

      {/* Celebratory Result Modal with Diwali Crackers in Background */}
      {resultModal && (
        <div
          className="modal-backdrop"
          onClick={() => setResultModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className={`result-badge ${
                resultModal.trophy ? "trophy" : "progress"
              }`}
            >
              {resultModal.trophy
                ? "🎆 Happy Diwali Champion! 🏆"
                : "✨ Diwali Greetings"}
            </div>

            <div className="result-score">
              {resultModal.wordsCorrect} / {resultModal.wordsTotal}
            </div>

            <p className="result-ai-msg">{resultModal.aiMessage}</p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title="Toggle Crackers Sound"
              >
                {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
              </button>

              <button
                type="button"
                className="modal-btn"
                onClick={() => setResultModal(null)}
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exact 1:1 Replica Card */}
      <main className="card-frame">
        <img
          src="/diwali-card.jpg"
          alt="CogitX AI Diwali Crossword Greeting"
          className="card-image"
        />

        {/* Interactive Crossword Input Overlay */}
        <section
          className="interactive-overlay"
          aria-label="Crossword Grid Cells"
        >
          {CROSSWORD_CELLS.map((cell) => {
            const key = `${cell.r}-${cell.c}`;
            const leftPct = ((43 + cell.c * 32) / 730) * 100;
            const topPct = ((52 + cell.r * 32) / 1024) * 100;
            const widthPct = (32 / 730) * 100;
            const heightPct = (32 / 1024) * 100;

            const displayValue = showSolution
              ? cell.solution
              : letters[key] || "";

            const statusClass =
              cellStatus[key] === "correct"
                ? "correct"
                : cellStatus[key] === "wrong"
                ? "incorrect"
                : "";

            return (
              <div
                key={key}
                className={`cell-slot ${statusClass}`}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                }}
              >
                <input
                  ref={(el) => {
                    inputRefs.current[key] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={displayValue}
                  onChange={(e) => handleInput(key, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(key, e)}
                  aria-label={`Row ${cell.r + 1}, Column ${cell.c + 1}`}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            );
          })}
        </section>
      </main>

      {/* Floating Toolbar with CogitX Actions */}
      <nav className="floating-toolbar" aria-label="Game Actions">
        <button
          type="button"
          className="toolbar-btn primary"
          onClick={submitCrossword}
          disabled={loading}
        >
          {loading ? "Checking..." : "⚡ Submit & Check"}
        </button>

        <button
          type="button"
          className="toolbar-btn accent"
          onClick={requestHint}
          disabled={loading}
        >
          💡 Hint
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title="Toggle Cracker Audio"
        >
          {soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off"}
        </button>

        <button type="button" className="toolbar-btn" onClick={clearAll}>
          Clear
        </button>

        <button type="button" className="toolbar-btn" onClick={printCard}>
          Print / PDF
        </button>
      </nav>
    </div>
  );
}
