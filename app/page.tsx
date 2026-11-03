"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import FireworksOverlay from "../components/FireworksOverlay";

interface CellDef {
  r: number;
  c: number;
  solution: string;
}

interface ClueDef {
  id: string; // e.g. "13D", "1A"
  number: number;
  direction: "across" | "down";
  label: string; // "13 Down"
  clue: string;
  solution: string;
  cells: string[]; // cell keys "r-c"
}

const CLUES_DATA: ClueDef[] = [
  {
    id: "1A",
    number: 1,
    direction: "across",
    label: "1 Across",
    clue: "A source of light on a desk or in a window. (4)",
    solution: "LAMP",
    cells: ["0-11", "0-12", "0-13", "0-14"],
  },
  {
    id: "2D",
    number: 2,
    direction: "down",
    label: "2 Down",
    clue: "Calm and quiet, and a wish for the year ahead. (5)",
    solution: "PEACE",
    cells: ["0-14", "1-14", "2-14", "3-14", "4-14"],
  },
  {
    id: "3D",
    number: 3,
    direction: "down",
    label: "3 Down",
    clue: "A hope for something good to come. (4)",
    solution: "WISH",
    cells: ["1-7", "2-7", "3-7", "4-7"],
  },
  {
    id: "4D",
    number: 4,
    direction: "down",
    label: "4 Down",
    clue: "What every light pushes back. (8)",
    solution: "DARKNESS",
    cells: ["1-9", "2-9", "3-9", "4-9", "5-9", "6-9", "7-9", "8-9"],
  },
  {
    id: "5A",
    number: 5,
    direction: "across",
    label: "5 Across",
    clue: "Small clay dish of oil with a wick, lit at dusk on holiday evenings. (4)",
    solution: "DIYA",
    cells: ["2-6", "2-7", "2-8", "2-9"],
  },
  {
    id: "6D",
    number: 6,
    direction: "down",
    label: "6 Down",
    clue: "Colourful floor art made of powder at the entrance of a home. (7)",
    solution: "RANGOLI",
    cells: ["2-11", "3-11", "4-11", "5-11", "6-11", "7-11", "8-11"],
  },
  {
    id: "7A",
    number: 7,
    direction: "across",
    label: "7 Across",
    clue: "To start a fire, or to stir up a feeling. (6)",
    solution: "KINDLE",
    cells: ["4-9", "4-10", "4-11", "4-12", "4-13", "4-14"],
  },
  {
    id: "8A",
    number: 8,
    direction: "across",
    label: "8 Across",
    clue: "Where the lights are hung and the family gathers. (4)",
    solution: "HOME",
    cells: ["6-6", "6-7", "6-8", "6-9"],
  },
  {
    id: "9D",
    number: 9,
    direction: "down",
    label: "9 Down",
    clue: "Wax around a wick, lit for light. (6)",
    solution: "CANDLE",
    cells: ["7-13", "8-13", "9-13", "10-13", "11-13", "12-13"],
  },
  {
    id: "10A",
    number: 10,
    direction: "across",
    label: "10 Across",
    clue: "A celebration marked on the calendar each year. (8)",
    solution: "FESTIVAL",
    cells: ["8-7", "8-8", "8-9", "8-10", "8-11", "8-12", "8-13", "8-14"],
  },
  {
    id: "11D",
    number: 11,
    direction: "down",
    label: "11 Down",
    clue: "Treats shared between neighbours and friends on a holiday. (6)",
    solution: "SWEETS",
    cells: ["10-11", "11-11", "12-11", "13-11", "14-11", "15-11"],
  },
  {
    id: "12A",
    number: 12,
    direction: "across",
    label: "12 Across",
    clue: "The Indian holiday of lights, celebrated around the world each autumn. (6)",
    solution: "DIWALI",
    cells: ["11-9", "11-10", "11-11", "11-12", "11-13", "11-14"],
  },
  {
    id: "13D",
    number: 13,
    direction: "down",
    label: "13 Down",
    clue: "Presents exchanged with family and friends. (5)",
    solution: "GIFTS",
    cells: ["12-8", "13-8", "14-8", "15-8", "16-8"],
  },
  {
    id: "14A",
    number: 14,
    direction: "across",
    label: "14 Across",
    clue: "Soft coloured parts of a flower. (6)",
    solution: "PETALS",
    cells: ["15-6", "15-7", "15-8", "15-9", "15-10", "15-11"],
  },
];

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

  // Active cell and word tracking
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [activeClue, setActiveClue] = useState<ClueDef | null>(null);
  const [hintedCell, setHintedCell] = useState<string | null>(null);

  const [hintToast, setHintToast] = useState<{
    title: string;
    clueText?: string;
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

  // Build mapping from cellKey -> matching ClueDef[]
  const cellToClues = useRef<Record<string, ClueDef[]>>(
    (() => {
      const map: Record<string, ClueDef[]> = {};
      CLUES_DATA.forEach((clue) => {
        clue.cells.forEach((cellKey) => {
          if (!map[cellKey]) map[cellKey] = [];
          map[cellKey].push(clue);
        });
      });
      return map;
    })()
  ).current;

  // Select a clue and focus its first cell
  const handleSelectClue = (clue: ClueDef) => {
    setActiveClue(clue);
    const firstCell = clue.cells[0];
    if (firstCell && inputRefs.current[firstCell]) {
      inputRefs.current[firstCell]?.focus();
    }
  };

  // When a cell is focused, pick the matching clue
  const handleCellFocus = (key: string) => {
    setFocusedCell(key);
    const matchingClues = cellToClues[key];
    if (matchingClues && matchingClues.length > 0) {
      // If currently active clue already covers this cell, keep it
      if (activeClue && matchingClues.some((c) => c.id === activeClue.id)) {
        return;
      }
      // Otherwise set to the primary clue for this cell (e.g. 13D for Box 13 at 12-8)
      setActiveClue(matchingClues[0]);
    }
  };

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
        // If active clue is down, move down; if across, move right
        if (activeClue?.direction === "down") {
          const down = `${r + 1}-${c}`;
          if (cellMap[down]) {
            inputRefs.current[down]?.focus();
            return;
          }
        }
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

  // Request a precise clue hint:
  // If user is focused on a box (e.g. 13 Down), give hint for that EXACT word!
  // Otherwise pick the first unsolved clue in the puzzle.
  const requestHint = async () => {
    if (loading) return;

    // 1. Determine target clue: either current active clue or first incomplete clue
    let targetClue = activeClue;

    if (!targetClue) {
      targetClue =
        CLUES_DATA.find((clue) => {
          return clue.cells.some(
            (k, idx) => (letters[k] || "").toUpperCase() !== clue.solution[idx]
          );
        }) || CLUES_DATA[0];
      setActiveClue(targetClue);
    }

    // 2. Find first empty or incorrect cell in target clue
    let targetCellKey: string | null = null;
    let targetSolutionLetter = "";
    let targetPos = 1;

    for (let i = 0; i < targetClue.cells.length; i++) {
      const k = targetClue.cells[i];
      const sol = targetClue.solution[i];
      if ((letters[k] || "").toUpperCase() !== sol) {
        targetCellKey = k;
        targetSolutionLetter = sol;
        targetPos = i + 1;
        break;
      }
    }

    // If word is already fully solved
    if (!targetCellKey) {
      setHintToast({
        title: `💡 ${targetClue.label} is Already Solved!`,
        clueText: targetClue.clue,
        message: `You've already solved "${targetClue.solution}"! Pick another box for a hint.`,
      });
      return;
    }

    // 3. Reveal the letter immediately in the grid and focus it
    setLetters((prev) => ({
      ...prev,
      [targetCellKey!]: targetSolutionLetter,
    }));

    setHintedCell(targetCellKey);
    setTimeout(() => setHintedCell(null), 2200);

    inputRefs.current[targetCellKey]?.focus();

    // 4. Show clear clue banner so user knows exactly what word this hint is for
    setHintToast({
      title: `💡 Hint for ${targetClue.label} (${targetClue.solution.length} Letters)`,
      clueText: `"${targetClue.clue}"`,
      message: `Revealed letter '${targetSolutionLetter}' at position ${targetPos} of ${targetClue.solution.length}!`,
    });

    // 5. In background, ping CogitX Workflow for AI message/telemetry
    setLoading(true);
    try {
      const res = await fetch("/api/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hint",
          playerName: "Player",
          clueId: targetClue.id,
        }),
      });

      const data = await res.json();
      if (data?.aiMessage) {
        setHintToast({
          title: `💡 Hint for ${targetClue.label}`,
          clueText: `"${targetClue.clue}"`,
          message: data.aiMessage,
        });
      }
    } catch (e) {
      // Local hint already succeeded, error can be silently logged
      console.log("CogitX hint ping:", e);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setLetters({});
    setCellStatus({});
    setShowSolution(false);
    setFocusedCell(null);
    setActiveClue(null);
  };

  const printCard = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Determine if a cell is part of the currently active word
  const isCellInActiveWord = (key: string) => {
    if (!activeClue) return false;
    return activeClue.cells.includes(key);
  };

  return (
    <div className="page-wrapper">
      {/* Diwali Fireworks & Authentic Diwali Crackers Audio */}
      <FireworksOverlay
        active={Boolean(resultModal)}
        soundEnabled={soundEnabled}
      />

      {/* Clue Hint Toast Notification */}
      {hintToast && (
        <aside className="ai-toast" role="alert">
          <div className="toast-icon">🪔</div>
          <div className="toast-content">
            <h4 className="toast-title">{hintToast.title}</h4>
            {hintToast.clueText && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#fde68a",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {hintToast.clueText}
              </p>
            )}
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

      {/* Celebratory Result Modal with Fireworks in Background */}
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
                title="Toggle Crackers Audio"
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

      {/* Active Clue Bar (Shown above the card when any cell is clicked) */}
      {activeClue && (
        <header className="active-clue-bar" aria-live="polite">
          <span className="clue-badge">{activeClue.label}</span>
          <span className="clue-text">{activeClue.clue}</span>
        </header>
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

            const isWordActive = isCellInActiveWord(key);
            const isHinted = hintedCell === key;

            return (
              <div
                key={key}
                className={`cell-slot ${statusClass} ${
                  isWordActive ? "word-active" : ""
                } ${isHinted ? "hint-pulse" : ""}`}
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
                  onFocus={() => handleCellFocus(key)}
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
          title={
            activeClue
              ? `Get hint for ${activeClue.label}`
              : "Get a hint for the puzzle"
          }
        >
          💡 Hint {activeClue ? `(${activeClue.label})` : ""}
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
