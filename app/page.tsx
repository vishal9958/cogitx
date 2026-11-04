"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import FireworksOverlay from "../components/FireworksOverlay";

/* ── Crossword Definitions (Exact 1:1 replica from cogitx-diwali) ── */
interface WordDef {
  n: number;
  d: "A" | "D";
  r: number;
  c: number;
  a: string;
  clue: string;
  i?: number;
  cells?: string[];
}

const WORDS: WordDef[] = [
  { n: 1,  d: "A", r: 0,  c: 5, a: "LAMP",     clue: "A source of light on a desk or in a window." },
  { n: 5,  d: "A", r: 2,  c: 0, a: "DIYA",     clue: "Small clay dish of oil with a wick, lit at dusk on holiday evenings." },
  { n: 7,  d: "A", r: 4,  c: 3, a: "KINDLE",   clue: "To start a fire, or to stir up a feeling." },
  { n: 8,  d: "A", r: 6,  c: 0, a: "HOME",     clue: "Where the lights are hung and the family gathers." },
  { n: 10, d: "A", r: 8,  c: 1, a: "FESTIVAL", clue: "A celebration marked on the calendar each year." },
  { n: 12, d: "A", r: 11, c: 3, a: "DIWALI",   clue: "The Indian holiday of lights, celebrated around the world each autumn." },
  { n: 14, d: "A", r: 15, c: 0, a: "PETALS",   clue: "Soft coloured parts of a flower." },
  { n: 2,  d: "D", r: 0,  c: 8, a: "PEACE",    clue: "Calm and quiet, and a wish for the year ahead." },
  { n: 3,  d: "D", r: 1,  c: 1, a: "WISH",     clue: "A hope for something good to come." },
  { n: 4,  d: "D", r: 1,  c: 3, a: "DARKNESS", clue: "What every light pushes back." },
  { n: 6,  d: "D", r: 2,  c: 5, a: "RANGOLI",  clue: "Colourful floor art made of powder at the entrance of a home." },
  { n: 9,  d: "D", r: 7,  c: 7, a: "CANDLE",   clue: "Wax around a wick, lit for light." },
  { n: 11, d: "D", r: 10, c: 5, a: "SWEETS",   clue: "Treats shared between neighbours and friends on a holiday." },
  { n: 13, d: "D", r: 12, c: 2, a: "GIFTS",    clue: "Presents exchanged with family and friends." },
];

// Shaded squares in order -> S P A R K
const SPARK: [number, number][] = [
  [8, 3], // S
  [0, 8], // P
  [2, 3], // A
  [2, 5], // R
  [4, 3], // K
];

const SAVE_KEY = "cogitx-diwali-xw-v1";
const key = (r: number, c: number) => r + "," + c;

interface CellDef {
  id: string;
  r: number;
  c: number;
  ans: string;
  num: number;
  spark: number;
  A: number | null;
  D: number | null;
}

const CELLS = new Map<string, CellDef>();
WORDS.forEach((w, i) => {
  w.i = i;
  w.cells = [];
  for (let k = 0; k < w.a.length; k++) {
    const r = w.r + (w.d === "D" ? k : 0);
    const c = w.c + (w.d === "A" ? k : 0);
    const id = key(r, c);
    let cell = CELLS.get(id);
    if (!cell) {
      cell = { id, r, c, ans: w.a[k], num: 0, spark: 0, A: null, D: null };
      CELLS.set(id, cell);
    }
    cell[w.d] = i;
    w.cells.push(id);
    if (k === 0) cell.num = w.n;
  }
});
SPARK.forEach(([r, c], i) => {
  const cObj = CELLS.get(key(r, c));
  if (cObj) cObj.spark = i + 1;
});

const ORDER = [...WORDS]
  .sort((a, b) => (a.d === b.d ? a.n - b.n : a.d === "A" ? -1 : 1))
  .map((w) => w.i!);

const CELL_LIST = [...CELLS.values()];
const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["check", "Z", "X", "C", "V", "B", "N", "M", "back"],
];

/* ── Helpers ────────────────────────────────────────────────────── */
const wordDone = (w: WordDef, L: Record<string, string>) =>
  w.cells ? w.cells.every((k) => L[k] === CELLS.get(k)?.ans) : false;
const wordFilled = (w: WordDef, L: Record<string, string>) =>
  w.cells ? w.cells.every((k) => Boolean(L[k])) : false;
const allCorrect = (L: Record<string, string>) =>
  CELL_LIST.every((c) => L[c.id] === c.ans);

function loadSaved(): { letters: Record<string, string>; solved: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { letters: {}, solved: false };
    const o = JSON.parse(raw);
    const letters: Record<string, string> = {};
    for (const [k, v] of Object.entries(o.letters || {})) {
      if (CELLS.has(k)) letters[k] = v as string;
    }
    return { letters, solved: Boolean(o.solved) };
  } catch {
    return { letters: {}, solved: false };
  }
}

function setUnit() {
  if (typeof window === "undefined") return;
  const u = Math.floor((Math.min(window.innerWidth, 460) / 390) * 32) / 32;
  document.documentElement.style.setProperty("--u", u + "px");
}

export default function DiwaliCardPage() {
  const saved = useRef<{ letters: Record<string, string>; solved: boolean } | null>(null);
  if (!saved.current) saved.current = loadSaved();

  /* State */
  const [letters, setLetters] = useState<Record<string, string>>(saved.current.letters);
  const [solved, setSolved] = useState<boolean>(saved.current.solved);
  const [wordIdx, setWordIdx] = useState<number | null>(0); // opens on 1 Across
  const [idx, setIdx] = useState<number>(0);
  const [focused, setFocused] = useState<boolean>(false);
  const [wrong, setWrong] = useState<Set<string>>(() => new Set());
  const [winTick, setWinTick] = useState<number>(0);
  const [cardState, setCardState] = useState<{ text: string; bad: boolean }>({ text: "", bad: false });
  const [stageTransform, setStageTransform] = useState<string>("");
  const [cardTop, setCardTop] = useState<string | null>(null);
  const [caretLeft, setCaretLeft] = useState<number>(40);
  const [pressed, setPressed] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const [clearArmed, setClearArmed] = useState<boolean>(false);

  // App API, audio, fireworks and hints
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hintsLeft, setHintsLeft] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
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

  /* Refs */
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const zoomRef = useRef<{ base: { left: number; top: number }; tx: number; ty: number; s: number } | null>(null);
  const toastT = useRef<NodeJS.Timeout | number>(0);
  const clearT = useRef<NodeJS.Timeout | number>(0);

  const word = wordIdx == null ? null : WORDS[wordIdx];

  // always-fresh snapshot for timers / global listeners
  const latest = useRef<{
    letters: Record<string, string>;
    solved: boolean;
    wordIdx: number | null;
    idx: number;
    focused: boolean;
  }>({
    letters,
    solved,
    wordIdx,
    idx,
    focused,
  });
  latest.current = { letters, solved, wordIdx, idx, focused };

  /* ── unit ───────────────────────────────────────────────────── */
  useLayoutEffect(() => {
    setUnit();
  }, []);

  /* ── persistence ────────────────────────────────────────────── */
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ letters, solved }));
    } catch {}
  }, [letters, solved]);

  /* ── toast ──────────────────────────────────────────────────── */
  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(toastT.current as any);
    toastT.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3600);
  }, []);

  /* ── zoom (smooth camera swoop to target word with custom scale) ─ */
  const positionCaret = useCallback(() => {
    const z = zoomRef.current;
    const { wordIdx: wi, idx: i } = latest.current;
    if (!z || wi == null) return;
    const w = WORDS[wi];
    if (!w.cells) return;
    const el = cellRefs.current[w.cells[i]];
    const card = cardRef.current;
    const grid = gridRef.current;
    if (!el || !card || !grid) return;
    const u = el.offsetWidth;
    const cx = grid.offsetLeft + el.offsetLeft + u / 2;
    const sx = z.base.left + z.tx + cx * z.s;
    const cr = card.getBoundingClientRect();
    setCaretLeft(Math.max(22, Math.min(cr.width - 22, sx - cr.left)));
  }, []);

  const layoutZoom = useCallback(() => {
    const { wordIdx: wi } = latest.current;
    if (wi == null) return;
    const w = WORDS[wi];
    if (!w.cells || w.cells.length === 0) return;
    const grid = gridRef.current;
    const stage = stageRef.current;
    const scroller = scrollerRef.current;
    const keys = keysRef.current;
    const card = cardRef.current;
    const probe = probeRef.current;
    const first = cellRefs.current[w.cells[0]];
    const last = cellRefs.current[w.cells[w.cells.length - 1]];
    if (!grid || !stage || !scroller || !keys || !card || !probe || !first || !last) return;

    const u = first.offsetWidth;
    const x0 = grid.offsetLeft + first.offsetLeft;
    const y0 = grid.offsetTop + first.offsetTop;
    const wordW = grid.offsetLeft + last.offsetLeft + u - x0;
    const wordH = grid.offsetTop + last.offsetTop + u - y0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sr = scroller.getBoundingClientRect();
    const base = {
      left: sr.left + stage.offsetLeft - scroller.scrollLeft,
      top: sr.top + stage.offsetTop - scroller.scrollTop,
    };
    const keysH = keys.offsetHeight;
    const cardH = card.offsetHeight;
    const safeTop = probe.offsetHeight;
    const topMin = safeTop + 14;
    const bottomMax = vh - keysH - 10;
    const gap = 12;
    const maxW = Math.min(vw, 560) - 44;
    const availH = bottomMax - topMin - gap - cardH;
    let s = Math.min(maxW / wordW, availH / wordH);
    s = Math.max(1, Math.min(2.6, s));
    const groupH = wordH * s + gap + cardH;
    const T = topMin + Math.max(0, (bottomMax - topMin - groupH) * 0.42);
    const tx = vw / 2 - base.left - (x0 + wordW / 2) * s;
    const ty = T - base.top - y0 * s;

    setStageTransform(`translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`);
    setCardTop(Math.min(T + wordH * s + gap, bottomMax - cardH) + "px");
    zoomRef.current = { base, tx, ty, s };
    positionCaret();
  }, [positionCaret]);

  // when the focused word changes (or focus turns on), zoom onto it
  useEffect(() => {
    if (!focused || wordIdx == null) return;
    const id = requestAnimationFrame(layoutZoom);
    return () => cancelAnimationFrame(id);
  }, [focused, wordIdx, layoutZoom]);

  // when the cursor moves inside a word, slide the caret
  useEffect(() => {
    if (focused) positionCaret();
  }, [idx, wordIdx, focused, positionCaret]);

  /* ── focus mode ─────────────────────────────────────────────── */
  const exitFocus = useCallback(() => {
    if (!latest.current.focused) return;
    zoomRef.current = null;
    setStageTransform("");
    setFocused(false);
  }, []);

  const focusWord = useCallback((wi: number, i?: number) => {
    const w = WORDS[wi];
    if (!w.cells) return;
    if (i == null) {
      i = w.cells.findIndex((k) => !latest.current.letters[k]);
      if (i < 0) i = 0;
    }
    setWordIdx(wi);
    setIdx(i);
    setCardState({ text: "", bad: false });
    setFocused(true);
  }, []);

  const nextWord = useCallback(
    (dir: number, skipFilled?: boolean) => {
      const { wordIdx: wi, letters: L } = latest.current;
      if (wi == null) return;
      const pos = ORDER.indexOf(wi);
      const n = ORDER.length;
      let pick: number | null = null;
      if (skipFilled) {
        for (let step = 1; step < n; step++) {
          const cand = ORDER[(pos + dir * step + n * n) % n];
          if (!wordFilled(WORDS[cand], L)) {
            pick = cand;
            break;
          }
        }
      }
      if (pick == null) pick = ORDER[(pos + dir + n) % n];
      focusWord(pick);
    },
    [focusWord]
  );

  /* ── input ──────────────────────────────────────────────────── */
  const putLetter = (id: string, ch: string) => {
    const next = { ...latest.current.letters };
    if (ch) next[id] = ch;
    else delete next[id];
    latest.current.letters = next;
    setLetters(next);
    setWrong((prev) => {
      if (!prev.has(id)) return prev;
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    return next;
  };

  const typeLetter = (ch: string) => {
    const { wordIdx: wi, idx: i } = latest.current;
    if (wi == null) return;
    const w = WORDS[wi];
    if (!w.cells) return;
    const next = putLetter(w.cells[i], ch);
    if (i < w.cells.length - 1) {
      setIdx(i + 1);
    } else if (!allCorrect(next)) {
      setTimeout(() => {
        const L = latest.current;
        if (L.focused && L.wordIdx != null && wordFilled(WORDS[L.wordIdx], L.letters)) {
          nextWord(1, true);
        }
      }, 260);
    }
  };

  const backspace = () => {
    const { wordIdx: wi, idx: i, letters: L } = latest.current;
    if (wi == null) return;
    const w = WORDS[wi];
    if (!w.cells) return;
    if (L[w.cells[i]]) putLetter(w.cells[i], "");
    else if (i > 0) {
      setIdx(i - 1);
      putLetter(w.cells[i - 1], "");
    }
  };

  const checkWord = () => {
    const { wordIdx: wi, letters: L } = latest.current;
    if (wi == null) return;
    const w = WORDS[wi];
    if (!w.cells) return;
    let bad = 0;
    let empty = 0;
    const marks = new Set(wrong);
    w.cells.forEach((k) => {
      if (!L[k]) empty++;
      else if (L[k] !== CELLS.get(k)?.ans) {
        bad++;
        marks.add(k);
      }
    });
    setWrong(marks);
    setCardState({
      bad: Boolean(bad),
      text: bad
        ? `${bad} ${bad === 1 ? "letter is" : "letters are"} off`
        : empty
        ? `Filled letters look right · ${empty} to go`
        : "Correct",
    });
  };

  /* ── solved detection ───────────────────────────────────────── */
  useEffect(() => {
    const all = allCorrect(letters);
    if (all && !solved) {
      setSolved(true);
      const t = setTimeout(() => {
        exitFocus();
        setWinTick((n) => n + 1);
        showToast("Solved. The shaded squares spell SPARK — Happy Diwali!");
        setResultModal({
          wordsCorrect: WORDS.length,
          wordsTotal: WORDS.length,
          allCorrect: true,
          trophy: true,
          aiMessage: "Nailed it with a perfect score! The shaded squares spell SPARK. Happy Diwali from CogitX!",
        });
      }, 320);
      return () => clearTimeout(t);
    }
    if (!all && solved) setSolved(false);
  }, [letters, solved, exitFocus, showToast]);

  /* ── events ─────────────────────────────────────────────────── */
  const onCellClick = (id: string) => {
    const cell = CELLS.get(id);
    if (!cell) return;
    const { wordIdx: wi, idx: curIdx, focused: isFocused } = latest.current;
    const w = wi == null ? null : WORDS[wi];
    const has = { A: cell.A != null, D: cell.D != null };
    if (w && w.cells && w.cells.includes(id)) {
      const i = w.cells.indexOf(id);
      if (i === curIdx && isFocused) {
        // tapping the active square flips direction
        const other = w.d === "A" ? cell.D : cell.A;
        if (other != null && WORDS[other].cells) {
          focusWord(other, WORDS[other].cells!.indexOf(id));
          return;
        }
      }
      if (!isFocused && wi != null) {
        focusWord(wi, i);
        return;
      }
      setIdx(i);
      return;
    }
    const dir = w ? w.d : "A";
    const target =
      dir === "A" && has.A
        ? cell.A!
        : dir === "D" && has.D
        ? cell.D!
        : has.A
        ? cell.A!
        : cell.D!;
    if (WORDS[target]?.cells) {
      focusWord(target, WORDS[target].cells!.indexOf(id));
    }
  };

  const onKeyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const b = target.closest(".key") as HTMLButtonElement | null;
    if (!b) return;
    e.preventDefault();
    const k = b.dataset.key;
    if (!k) return;
    setPressed(k);
    setTimeout(() => setPressed((p) => (p === k ? null : p)), 120);
    if (k === "back") backspace();
    else if (k === "check") checkWord();
    else typeLetter(k);
  };

  const onClear = () => {
    if (!clearArmed) {
      setClearArmed(true);
      clearTimeout(clearT.current as any);
      clearT.current = setTimeout(() => setClearArmed(false), 3000);
      return;
    }
    clearTimeout(clearT.current as any);
    setClearArmed(false);
    latest.current.letters = {};
    setLetters({});
    setWrong(new Set());
    setWinTick(0);
    setSolved(false);
    setWordIdx(0);
    showToast("Puzzle cleared");
  };

  // block page scroll while a word is in focus
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const h = (e: TouchEvent) => {
      if (latest.current.focused) e.preventDefault();
    };
    el.addEventListener("touchmove", h, { passive: false });
    return () => el.removeEventListener("touchmove", h);
  }, []);

  // hardware keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { focused: f, wordIdx: wi, idx: i } = latest.current;
      if (!f || wi == null) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const w = WORDS[wi];
      if (!w.cells) return;
      if (/^[a-z]$/i.test(e.key)) {
        typeLetter(e.key.toUpperCase());
        e.preventDefault();
      } else if (e.key === "Backspace") {
        backspace();
        e.preventDefault();
      } else if (e.key === "Escape") {
        exitFocus();
      } else if (e.key === "Tab" || e.key === "Enter") {
        nextWord(e.shiftKey ? -1 : 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (i < w.cells.length - 1) setIdx(i + 1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (i > 0) setIdx(i - 1);
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [exitFocus, nextWord]);

  // resize
  useEffect(() => {
    let t: NodeJS.Timeout | number;
    const onResize = () => {
      clearTimeout(t as any);
      t = setTimeout(() => {
        setUnit();
        if (latest.current.focused) layoutZoom();
      }, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t as any);
      window.removeEventListener("resize", onResize);
    };
  }, [layoutZoom]);

  /* ── Backend API Integration (Submit & Check Workflow) ─────── */
  const submitCrossword = async () => {
    setLoading(true);
    let correctCount = 0;
    const localWrongMarks = new Set<string>();

    WORDS.forEach((w) => {
      if (!w.cells) return;
      const wordText = w.cells.map((k) => letters[k] || "").join("");
      if (wordText.toUpperCase() === w.a) {
        correctCount++;
      } else {
        w.cells.forEach((k) => {
          if (letters[k] && letters[k] !== CELLS.get(k)?.ans) {
            localWrongMarks.add(k);
          }
        });
      }
    });

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
      const isComplete = data?.allCorrect || data?.trophy || correctCount === WORDS.length;

      // Update cell error marks from API if available
      if (data?.cellStatus) {
        const apiWrongMarks = new Set<string>();
        for (const [k, status] of Object.entries(data.cellStatus)) {
          if (status === "wrong") apiWrongMarks.add(k);
        }
        setWrong(apiWrongMarks);
      } else {
        setWrong(localWrongMarks);
      }

      if (isComplete) {
        exitFocus();
        setWinTick((n) => n + 1);
        setSolved(true);
      }

      setResultModal({
        wordsCorrect: data?.wordsCorrect ?? correctCount,
        wordsTotal: data?.wordsTotal ?? WORDS.length,
        allCorrect: Boolean(isComplete),
        trophy: Boolean(data?.trophy || isComplete),
        aiMessage:
          data?.aiMessage ||
          (isComplete
            ? "Nailed it with a perfect score! The shaded squares spell SPARK. Wishing you and your loved ones a very Happy Diwali!"
            : `Great effort! You've correctly solved ${data?.wordsCorrect ?? correctCount} of ${WORDS.length} words.`),
      });
    } catch {
      const isComplete = correctCount === WORDS.length;
      setWrong(localWrongMarks);
      if (isComplete) {
        exitFocus();
        setWinTick((n) => n + 1);
        setSolved(true);
      }
      setResultModal({
        wordsCorrect: correctCount,
        wordsTotal: WORDS.length,
        allCorrect: isComplete,
        trophy: isComplete,
        aiMessage: isComplete
          ? "Nailed it with a perfect score! The shaded squares spell SPARK. Wishing you a very Happy Diwali!"
          : `Great effort! You've correctly solved ${correctCount} of ${WORDS.length} words. Keep going!`,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ── AI Clue Hint ────────────────────────────────────────────── */
  const requestHint = async () => {
    if (hintsLeft <= 0) {
      showToast("All 3 hints have been used for this game!");
      return;
    }

    const currentWord = word || WORDS[0];
    if (!currentWord.cells) return;
    setLoading(true);

    try {
      const res = await fetch("/api/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hint",
          playerName: "Player",
          clueId: `${currentWord.n}${currentWord.d}`,
        }),
      });

      const data = await res.json();
      setHintsLeft((prev) => Math.max(0, prev - 1));

      // Reveal first unrevealed or incorrect letter of the active word
      const emptyIdx = currentWord.cells.findIndex((k) => (letters[k] || "") !== CELLS.get(k)?.ans);
      if (emptyIdx !== -1) {
        const targetKey = currentWord.cells[emptyIdx];
        const correctLetter = CELLS.get(targetKey)?.ans || "";
        putLetter(targetKey, correctLetter);
      }

      setHintToast({
        title: `Hint for ${currentWord.n} ${currentWord.d === "A" ? "Across" : "Down"}`,
        clueText: currentWord.clue,
        message:
          data?.aiMessage ||
          `This word starts with '${currentWord.a[0]}' and has ${currentWord.a.length} letters.`,
      });

      setTimeout(() => setHintToast(null), 6000);
    } catch {
      setHintsLeft((prev) => Math.max(0, prev - 1));
      const emptyIdx = currentWord.cells.findIndex((k) => (letters[k] || "") !== CELLS.get(k)?.ans);
      if (emptyIdx !== -1) {
        const targetKey = currentWord.cells[emptyIdx];
        const correctLetter = CELLS.get(targetKey)?.ans || "";
        putLetter(targetKey, correctLetter);
      }
      setHintToast({
        title: `Hint for ${currentWord.n} ${currentWord.d === "A" ? "Across" : "Down"}`,
        clueText: currentWord.clue,
        message: `This word begins with '${currentWord.a[0]}' and has ${currentWord.a.length} letters.`,
      });
      setTimeout(() => setHintToast(null), 6000);
    } finally {
      setLoading(false);
    }
  };

  const printCard = () => {
    if (typeof window !== "undefined") window.print();
  };

  /* Derived view data */
  const activeCells = word && word.cells ? word.cells : [];

  return (
    <>
      {/* Diwali Fireworks & Authentic Sound on Completion */}
      <FireworksOverlay active={Boolean(resultModal)} soundEnabled={soundEnabled} />

      {/* Clue Hint Toast Notification */}
      {hintToast && (
        <aside className="ai-toast" role="alert">
          <div className="toast-icon">🪔</div>
          <div className="toast-content">
            <h4 className="toast-title">{hintToast.title}</h4>
            {hintToast.clueText && (
              <p style={{ fontSize: "12px", color: "#fde68a", fontWeight: 600, marginBottom: "4px" }}>
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

      {/* Celebratory Result Modal */}
      {resultModal && (
        <div className="modal-backdrop" onClick={() => setResultModal(null)} role="dialog" aria-modal="true">
          <div className="result-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`result-badge ${resultModal.trophy ? "trophy" : "progress"}`}>
              {resultModal.trophy ? "🎆 Happy Diwali Champion! 🏆" : "✨ Diwali Greetings"}
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
                {soundEnabled ? "Sound: On" : "Sound: Off"}
              </button>
              <button type="button" className="modal-btn" onClick={() => setResultModal(null)}>
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN POSTER SCROLLER */}
      <div id="scroller" ref={scrollerRef} className={focused ? "lock" : ""}>
        <div
          id="stage"
          ref={stageRef}
          className={focused ? "focus" : ""}
          style={stageTransform ? { transform: stageTransform } : undefined}
        >
          {/* LAYER 1 · PAPER POSTER */}
          <div id="paper">
            <div className="zone-grid">
              <div className="bggrid" />
              <h1 className="hl hl-fire">Fire up your neurons</h1>
              <img className="ink sweets" src="/assets/sweets.png" alt="Sweets" />
              <img className="ink diyas" src="/assets/diyas.png" alt="Diyas" />
              <p className="hl hl-light">Light up life</p>
              <img className="ink lantern" src="/assets/lantern.png" alt="Lantern" />
              <p className="hl hl-kindle">Kindle your happiness</p>
              <img className="ink toran" src="/assets/toran.png" alt="Toran" />
              <p className="hl hl-every">Everything that makes Diwali</p>
              <img className="ink rangoli" src="/assets/rangoli.png" alt="Rangoli" />
              <img className="ink crackers" src="/assets/crackers.png" alt="Crackers" />
              <img className="ink family" src="/assets/family.png" alt="Family" />
              <img className="ink gift" src="/assets/gift.png" alt="Gift" />
              <p className="hl hl-happy">
                Happy Diwali from <span>CogitX</span>
              </p>
            </div>

            <div className="zone-text">
              <p className="spark-line">
                <span className="t">
                  The shaded squares, in order, spell what every lamp and every good idea begins with.
                </span>
                <span className={"spark-boxes" + (solved ? " win" : "")}>
                  {SPARK.map(([r, c], i) => {
                    const l = letters[key(r, c)] || "";
                    return (
                      <b key={i} data-i={i + 1} className={l ? "full" : ""}>
                        {l}
                      </b>
                    );
                  })}
                </span>
              </p>
              <hr />
              <h2 className="thanks">Thank you for being part of CogitX AI's journey.</h2>
              <p className="wish">Wishing you and your loved ones a Diwali full of light, joy and new beginnings.</p>
              <p className="wish">Here's to the sparks that light up the year ahead.</p>

              <div className="clues">
                {[
                  ["A", "Across"],
                  ["D", "Down"],
                ].map(([d, label]) => (
                  <section key={d}>
                    <h3>{label}</h3>
                    <ol className="cl">
                      {WORDS.filter((w) => w.d === d).map((w) => (
                        <li
                          key={w.i}
                          tabIndex={0}
                          className={(wordDone(w, letters) ? "done " : "") + (wordIdx === w.i ? "now" : "")}
                          onClick={() => focusWord(w.i!)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              focusWord(w.i!);
                            }
                          }}
                        >
                          <b>{w.n}</b>
                          <span>
                            {w.clue} ({w.a.length})
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>

              <hr />
              <footer>
                <img className="logo" src="/assets/logo.png" alt="CogitX" />
                <a href="https://www.cogitx.ai" target="_blank" rel="noopener noreferrer">
                  www.cogitx.ai
                </a>
              </footer>

              <p className="tiny">
                <button id="clear" type="button" className={clearArmed ? "arm" : ""} onClick={onClear}>
                  {clearArmed ? "Tap again to clear" : "Clear puzzle"}
                </button>
                {" · Tap any square to play. Progress saves on this device."}
              </p>

              {/* ACTION BUTTONS (SUBMIT & CHECK, HINT, SOUND, CLEAR, PRINT) */}
              <div className="actions-dock" aria-label="Game Actions">
                <button
                  type="button"
                  className="action-btn primary"
                  onClick={submitCrossword}
                  disabled={loading}
                >
                  {loading ? "Checking with AI..." : "Submit & Check"}
                </button>

                <button
                  type="button"
                  className="action-btn hint"
                  onClick={requestHint}
                  disabled={loading || hintsLeft <= 0}
                  title={
                    hintsLeft <= 0
                      ? "All 3 hints used"
                      : word
                      ? `Get hint for ${word.n} ${word.d === "A" ? "Across" : "Down"} (${hintsLeft} left)`
                      : `Get a hint (${hintsLeft} left)`
                  }
                >
                  Hint {word ? `(${word.n}${word.d})` : ""} [{hintsLeft}/3]
                </button>

                <button
                  type="button"
                  className="action-btn"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title="Toggle Crackers Audio"
                >
                  {soundEnabled ? "Sound: On" : "Sound: Off"}
                </button>

                <button type="button" className="action-btn" onClick={onClear}>
                  Clear
                </button>

                <button type="button" className="action-btn" onClick={printCard}>
                  Print / PDF
                </button>
              </div>
            </div>
          </div>

          {/* LAYER 2 · SCRIM (Dims background & non-active cells when zoomed) */}
          <div id="scrim" onClick={exitFocus} />

          {/* LAYER 3 · GRID CELLS */}
          <div id="grid" ref={gridRef} role="grid" aria-label="Crossword grid">
            {CELL_LIST.map((cell) => {
              const on = activeCells.includes(cell.id);
              const cur = on && activeCells[idx] === cell.id;
              const cls =
                "cell" +
                (cell.spark ? " shade" : "") +
                (on ? " on" : "") +
                (cur ? " cur" : "") +
                (wrong.has(cell.id) ? " wrong" : "") +
                (cell.spark && winTick > 0 ? " win" : "");
              return (
                <div
                  key={cell.spark && winTick > 0 ? cell.id + "#" + winTick : cell.id}
                  ref={(el) => {
                    if (el) cellRefs.current[cell.id] = el;
                  }}
                  className={cls}
                  data-k={cell.id}
                  role="gridcell"
                  tabIndex={-1}
                  style={{
                    left: `calc(${cell.c * 32} * var(--u))`,
                    top: `calc(${cell.r * 32} * var(--u))`,
                  }}
                  onClick={() => onCellClick(cell.id)}
                >
                  {cell.num ? <span className="n">{cell.num}</span> : null}
                  {cell.spark ? <span className="s">{cell.spark}</span> : null}
                  <span className="l">{letters[cell.id] || ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LAYER 4 · CLUE CARD (Floating underneath the focused word with caret) */}
      <div
        id="card"
        ref={cardRef}
        className={"card" + (focused ? " show" : "")}
        role="dialog"
        aria-live="polite"
        style={cardTop ? { top: cardTop } : undefined}
      >
        <div className="caret" style={{ left: caretLeft + "px" }} />
        <div className="card-top">
          <button
            className="nav"
            id="prev"
            type="button"
            aria-label="Previous word"
            onClick={() => nextWord(-1)}
          >
            ‹
          </button>
          <div className="eyebrow">
            <b>{word ? `${word.n} ${word.d === "A" ? "Across" : "Down"}` : ""}</b>
            <span>{word ? `${word.a.length} letters` : ""}</span>
          </div>
          <button
            className="nav"
            id="next"
            type="button"
            aria-label="Next word"
            onClick={() => nextWord(1)}
          >
            ›
          </button>
          <button className="done" id="done" type="button" onClick={exitFocus}>
            Done
          </button>
        </div>
        <p className="clue">
          {word ? (
            <>
              {word.clue} <span className="len">({word.a.length})</span>
            </>
          ) : null}
        </p>
        <p className={"state" + (cardState.bad ? " bad" : "")}>{cardState.text}</p>
      </div>

      {/* LAYER 5 · KEYBOARD (Slides up smoothly from bottom in focus mode) */}
      <div
        id="keys"
        ref={keysRef}
        className={"keys" + (focused ? " show" : "")}
        aria-label="Keyboard"
        onPointerDown={onKeyPointerDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {KEY_ROWS.map((row, ri) => (
          <div className="krow" key={ri}>
            {ri === 1 && <span className="sp" />}
            {row.map((k) => (
              <button
                key={k}
                type="button"
                data-key={k}
                className={
                  "key" +
                  (k.length > 1 ? " wide" : "") +
                  (pressed === k ? " press" : "")
                }
                aria-label={k === "back" ? "Backspace" : k === "check" ? "Check word" : k}
              >
                {k === "back" ? "⌫" : k === "check" ? "Check" : k}
              </button>
            ))}
            {ri === 1 && <span className="sp" />}
          </div>
        ))}
      </div>

      <div id="toast" role="status" className={toast.show ? "show" : ""}>
        {toast.msg}
      </div>
      <div id="probe" ref={probeRef} />
    </>
  );
}
