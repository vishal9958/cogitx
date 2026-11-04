"use client";

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
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

const MYSTERY_SHADED_KEYS = [
  { key: "8-9", num: 1 },  // S
  { key: "0-14", num: 2 }, // P
  { key: "2-9", num: 3 },  // A
  { key: "2-11", num: 4 }, // R
  { key: "4-9", num: 5 },  // K
];

// Custom per-box zoom scale so every word has its ideal magnification
const CLUE_ZOOM_LEVELS: Record<string, number> = {
  // 4-letter short words -> deeper zoom
  "1A": 2.45,
  "3D": 2.38,
  "5A": 2.45,
  "8A": 2.45,

  // 5-letter medium words
  "2D": 2.2,
  "13D": 2.2,

  // 6-letter medium words
  "7A": 2.12,
  "9D": 2.08,
  "11D": 2.08,
  "12A": 2.08,
  "14A": 2.12,

  // 7-8 letter long words -> wider view so whole word fits
  "4D": 1.78,
  "6D": 1.88,
  "10A": 1.82,
};

export default function DiwaliCardPage() {
  const [letters, setLetters] = useState<Record<string, string>>({});
  const [cellStatus, setCellStatus] = useState<Record<string, string>>({});
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintsLeft, setHintsLeft] = useState(3);

  // Active cell, zoom, camera swoop, and word tracking
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [activeClue, setActiveClue] = useState<ClueDef | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSwooping, setIsSwooping] = useState(false);
  const [hintedCell, setHintedCell] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const acrossClues = CLUES_DATA.filter((c) => c.direction === "across");
  const downClues = CLUES_DATA.filter((c) => c.direction === "down");

  // Select a clue, smoothly swoop/zoom, and focus target cell
  const handleSelectAndZoomClue = (clue: ClueDef) => {
    if (isZoomed && activeClue && activeClue.id !== clue.id) {
      // Camera swoop: slightly dip zoom out mid-flight while panning, then zoom back in
      setIsSwooping(true);
      setActiveClue(clue);
      setTimeout(() => {
        setIsSwooping(false);
      }, 170);
    } else {
      setActiveClue(clue);
      setIsZoomed(true);
    }

    // Pick first empty/unsolved cell, or fallback to first cell
    const targetCell =
      clue.cells.find((k, idx) => (letters[k] || "").toUpperCase() !== clue.solution[idx]) ||
      clue.cells[0];

    if (targetCell) {
      setFocusedCell(targetCell);
      setTimeout(() => {
        inputRefs.current[targetCell]?.focus();
      }, 60);
    }
  };

  // Exit zoomed view smoothly
  const handleDoneZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setIsSwooping(false);
  };

  // Cycle to previous clue in popover
  const handlePrevClue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeClue) return;
    const currIdx = CLUES_DATA.findIndex((c) => c.id === activeClue.id);
    const prevIdx = (currIdx - 1 + CLUES_DATA.length) % CLUES_DATA.length;
    handleSelectAndZoomClue(CLUES_DATA[prevIdx]);
  };

  // Cycle to next clue in popover
  const handleNextClue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeClue) return;
    const currIdx = CLUES_DATA.findIndex((c) => c.id === activeClue.id);
    const nextIdx = (currIdx + 1) % CLUES_DATA.length;
    handleSelectAndZoomClue(CLUES_DATA[nextIdx]);
  };

  // Calculate zoom transform with custom magnification per clue and camera swoop
  const getZoomTransform = (clue: ClueDef | null) => {
    if (!clue || !isZoomed) {
      return { x: 0, y: 0, scale: 1 };
    }

    // Custom tailored zoom level for this specific clue
    let targetScale = CLUE_ZOOM_LEVELS[clue.id] || 2.15;
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      targetScale *= 0.85;
    }

    // Dip scale down during camera swoop when shifting between boxes
    const S = isSwooping ? targetScale * 0.74 : targetScale;

    let minR = 999, maxR = -1, minC = 999, maxC = -1;
    clue.cells.forEach((k) => {
      const [r, c] = k.split("-").map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    const wordCenterXPct = ((43 + ((minC + maxC) / 2 + 0.5) * 32) / 730) * 100;
    const wordCenterYPct = ((52 + ((minR + maxR) / 2 + 0.5) * 32) / 1024) * 100;

    // Anchor word horizontally at 50% and vertically at ~31% of viewport
    const tx = 50 - wordCenterXPct * S;
    const ty = 31 - wordCenterYPct * S;

    return { x: tx, y: ty, scale: S };
  };

  // Calculate popover position directly beneath the active word
  const getPopoverPosition = (clue: ClueDef | null) => {
    if (!clue) return { leftPct: 50, topPct: 50 };

    let maxR = -1, minC = 999, maxC = -1;
    clue.cells.forEach((k) => {
      const [r, c] = k.split("-").map(Number);
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    });

    const wordCenterXPct = ((43 + ((minC + maxC) / 2 + 0.5) * 32) / 730) * 100;
    const wordBottomPct = ((52 + (maxR + 1) * 32) / 1024) * 100;

    return {
      leftPct: wordCenterXPct,
      topPct: wordBottomPct + 1.2, // ~12px directly below word
    };
  };

  // Global key listener for Escape key to exit zoom smoothly
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false);
        setIsSwooping(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isZoomed]);

  // When a cell is focused, pick the matching clue
  const handleCellFocus = (key: string) => {
    setFocusedCell(key);
    const matchingClues = cellToClues[key];
    if (matchingClues && matchingClues.length > 0) {
      if (activeClue && matchingClues.some((c) => c.id === activeClue.id)) {
        return;
      }
      setActiveClue(matchingClues[0]);
    }
  };

  // Cell click handler: smooth zoom/swoop to word
  const handleCellClick = (key: string) => {
    const matchingClues = cellToClues[key];
    if (matchingClues && matchingClues.length > 0) {
      const clue =
        activeClue && matchingClues.some((c) => c.id === activeClue.id)
          ? activeClue
          : matchingClues[0];

      if (!isZoomed || activeClue?.id !== clue.id) {
        handleSelectAndZoomClue(clue);
      }
      setFocusedCell(key);
      inputRefs.current[key]?.focus();
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

      // Automatically advance to the next cell in the active word
      if (char && activeClue) {
        const currIdx = activeClue.cells.indexOf(key);
        if (currIdx !== -1 && currIdx + 1 < activeClue.cells.length) {
          const nextKey = activeClue.cells[currIdx + 1];
          setTimeout(() => {
            setFocusedCell(nextKey);
            inputRefs.current[nextKey]?.focus();
          }, 10);
        }
      }
    }
  };

  const handleKeyDown = (key: string, e: KeyboardEvent<HTMLInputElement>) => {
    const [r, c] = key.split("-").map(Number);

    if (e.key === "Backspace") {
      if (!letters[key] && activeClue) {
        const currIdx = activeClue.cells.indexOf(key);
        if (currIdx > 0) {
          e.preventDefault();
          const prevKey = activeClue.cells[currIdx - 1];
          setFocusedCell(prevKey);
          inputRefs.current[prevKey]?.focus();
          setLetters((prev) => ({ ...prev, [prevKey]: "" }));
          return;
        }
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = `${r}-${c + 1}`;
      if (cellMap[next]) {
        setFocusedCell(next);
        inputRefs.current[next]?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = `${r}-${c - 1}`;
      if (cellMap[prev]) {
        setFocusedCell(prev);
        inputRefs.current[prev]?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const down = `${r + 1}-${c}`;
      if (cellMap[down]) {
        setFocusedCell(down);
        inputRefs.current[down]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const up = `${r - 1}-${c}`;
      if (cellMap[up]) {
        setFocusedCell(up);
        inputRefs.current[up]?.focus();
      }
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

  // Request a precise clue hint (Max 3 hints per game):
  // If user is focused on a box (e.g. 13 Down), give hint for that EXACT word!
  // Otherwise pick the first unsolved clue in the puzzle.
  const requestHint = async () => {
    if (loading) return;

    // Check if 3 hint limit reached
    if (hintsLeft <= 0) {
      setHintToast({
        title: "💡 No Hints Remaining",
        message: "You have used all 3 hints! Try solving the rest with the clues.",
      });
      return;
    }

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

    // Deduct 1 hint from the 3 total
    const remaining = hintsLeft - 1;
    setHintsLeft(remaining);

    // 3. Reveal the letter immediately in the grid and focus it
    setLetters((prev) => ({
      ...prev,
      [targetCellKey!]: targetSolutionLetter,
    }));

    setHintedCell(targetCellKey);
    setTimeout(() => setHintedCell(null), 2200);

    inputRefs.current[targetCellKey]?.focus();

    // 4. Show clear clue banner with remaining hint count
    setHintToast({
      title: `💡 Hint for ${targetClue.label} (${remaining} left)`,
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
          title: `💡 Hint for ${targetClue.label} (${remaining} left)`,
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
    setIsZoomed(false);
    setIsSwooping(false);
    setHintsLeft(3);
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

  const zoomTransform = getZoomTransform(activeClue);
  const popoverPos = getPopoverPosition(activeClue);

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

      {/* Exact 1:1 Replica Card */}
      <main
        ref={containerRef}
        className={`card-frame ${isZoomed ? "is-zoomed" : ""}`}
      >
        <div
          className="card-viewport"
          style={{
            transform: isZoomed
              ? `translate(${zoomTransform.x}%, ${zoomTransform.y}%) scale(${zoomTransform.scale})`
              : "translate(0%, 0%) scale(1)",
            transformOrigin: "0 0",
            transition: "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <img
            src="/diwali-card.jpg"
            alt="CogitX AI Diwali Crossword Greeting"
            className="card-image"
          />

          {/* Dimmer Overlay in Zoom Mode (click anywhere outside word to zoom out) */}
          {isZoomed && (
            <div
              className="zoom-dim-overlay"
              onClick={handleDoneZoom}
              title="Click to zoom out"
            />
          )}

          {/* Floating Clue Popover Attached Directly Under Zoomed Word */}
          {isZoomed && activeClue && (
            <div
              className="clue-floating-popover"
              style={{
                left: `${Math.min(78, Math.max(22, popoverPos.leftPct))}%`,
                top: `${popoverPos.topPct}%`,
                transform: "translate(-50%, 0)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popover-caret" />
              <div className="popover-header">
                <button
                  type="button"
                  className="popover-nav-btn"
                  onClick={handlePrevClue}
                  title="Previous Clue"
                >
                  ‹
                </button>
                <div className="popover-title-group">
                  <span className="popover-clue-label">
                    {activeClue.number} {activeClue.direction.toUpperCase()}
                  </span>
                  <span className="popover-clue-letters">
                    {activeClue.solution.length} letters
                  </span>
                </div>
                <button
                  type="button"
                  className="popover-nav-btn"
                  onClick={handleNextClue}
                  title="Next Clue"
                >
                  ›
                </button>
                <button
                  type="button"
                  className="popover-done-btn"
                  onClick={handleDoneZoom}
                >
                  Done
                </button>
              </div>
              <div className="popover-clue-body">{activeClue.clue}</div>
            </div>
          )}

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
              const isFocused = focusedCell === key;

              return (
                <div
                  key={key}
                  className={`cell-slot ${statusClass} ${
                    isWordActive ? "word-active" : ""
                  } ${isHinted ? "hint-pulse" : ""} ${
                    isFocused ? "is-focused" : ""
                  }`}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  onClick={() => handleCellClick(key)}
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

          {/* 5 Shaded Mystery Squares Row (SPARK) */}
          <div
            className="mystery-squares-row"
            aria-label="Mystery word shaded squares"
          >
            {MYSTERY_SHADED_KEYS.map((item) => (
              <div key={item.key} className="mystery-square-box">
                <span className="mystery-square-letter">
                  {letters[item.key] || ""}
                </span>
                <span className="mystery-square-num">{item.num}</span>
              </div>
            ))}
          </div>

          {/* Interactive Bottom Clues List Overlay (Across & Down) */}
          <section
            className="clues-card-overlay"
            aria-label="Interactive Crossword Clues"
          >
            <div className="clues-col across-col">
              <h3 className="clues-heading">ACROSS</h3>
              <div className="clues-list">
                {acrossClues.map((clue) => {
                  const isActive = activeClue?.id === clue.id;
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      className={`clue-row-btn ${isActive ? "active" : ""}`}
                      onClick={() => handleSelectAndZoomClue(clue)}
                      title={`Select & Zoom ${clue.label}`}
                    >
                      <span className="clue-num-tag">{clue.number}</span>
                      <span className="clue-body-text">{clue.clue}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="clues-col down-col">
              <h3 className="clues-heading">DOWN</h3>
              <div className="clues-list">
                {downClues.map((clue) => {
                  const isActive = activeClue?.id === clue.id;
                  return (
                    <button
                      key={clue.id}
                      type="button"
                      className={`clue-row-btn ${isActive ? "active" : ""}`}
                      onClick={() => handleSelectAndZoomClue(clue)}
                      title={`Select & Zoom ${clue.label}`}
                    >
                      <span className="clue-num-tag">{clue.number}</span>
                      <span className="clue-body-text">{clue.clue}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Card Footer Subtitle (Progress saves on this device) */}
        <div className="card-footer-note">
          <button
            type="button"
            className="footer-clear-btn"
            onClick={clearAll}
          >
            Clear puzzle
          </button>
          <span className="footer-dot">·</span>
          <span>Tap any square to play. Progress saves on this device.</span>
        </div>

        {/* Card Form Action Buttons (Docked inside the card frame at the bottom) */}
        <footer className="card-form-actions" aria-label="Game Actions">
          <button
            type="button"
            className="form-action-btn primary"
            onClick={submitCrossword}
            disabled={loading}
          >
            {loading ? "Checking..." : "Submit & Check"}
          </button>

          <button
            type="button"
            className="form-action-btn hint"
            onClick={requestHint}
            disabled={loading || hintsLeft <= 0}
            title={
              hintsLeft <= 0
                ? "All 3 hints used"
                : activeClue
                ? `Get hint for ${activeClue.label} (${hintsLeft} left)`
                : `Get a hint (${hintsLeft} left)`
            }
          >
            Hint {activeClue ? `(${activeClue.label})` : ""} [{hintsLeft}/3]
          </button>

          <button
            type="button"
            className="form-action-btn secondary"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Cracker Audio"
          >
            {soundEnabled ? "Sound: On" : "Sound: Off"}
          </button>

          <button
            type="button"
            className="form-action-btn secondary"
            onClick={clearAll}
          >
            Clear
          </button>

          <button
            type="button"
            className="form-action-btn secondary"
            onClick={printCard}
          >
            Print / PDF
          </button>
        </footer>
      </main>
    </div>
  );
}
