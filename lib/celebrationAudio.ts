"use client";

/**
 * Shared audio for the win celebration.
 *
 * iOS/Safari only allow audio that is started (or "unlocked") inside a user
 * gesture. The celebration starts from timers / after an API call, so we unlock
 * a single AudioContext + <audio> element on any real gesture and reuse them.
 * The context is never closed — a closed context can't be unlocked again.
 */

let audioEl: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let primed = false;
let wantLoop = false;

export function getCrackerAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioEl) {
    audioEl = new Audio("/fireworks.mp3");
    audioEl.loop = true;
    audioEl.volume = 0.45;
    audioEl.preload = "auto";
  }
  return audioEl;
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx || audioCtx.state === "closed") {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** Call from inside a user gesture. Safe to call repeatedly. */
export function unlockAudio() {
  getAudioContext();
  const el = getCrackerAudio();
  if (!el || primed) return;
  primed = true;
  if (wantLoop) return; // already trying to play for real
  el.muted = true;
  el.play()
    .then(() => {
      if (!wantLoop) {
        el.pause();
        el.currentTime = 0;
      }
      el.muted = false;
    })
    .catch(() => {
      el.muted = false;
      primed = false; // try again on the next gesture
    });
}

export function playCrackerLoop() {
  const el = getCrackerAudio();
  if (!el) return;
  wantLoop = true;
  el.muted = false;
  el.currentTime = 0;
  el.play().catch(() => {});
}

export function stopCrackerLoop() {
  wantLoop = false;
  const el = audioEl;
  if (!el) return;
  el.pause();
  el.currentTime = 0;
}

const GESTURE_EVENTS = ["pointerup", "touchend", "click", "keydown"] as const;

/** Unlock audio on every real user gesture. Returns a remover. */
export function installAudioUnlock(): () => void {
  if (typeof document === "undefined") return () => {};
  const handler = () => unlockAudio();
  GESTURE_EVENTS.forEach((ev) =>
    document.addEventListener(ev, handler, { passive: true, capture: true })
  );
  return () =>
    GESTURE_EVENTS.forEach((ev) =>
      document.removeEventListener(ev, handler, { capture: true } as EventListenerOptions)
    );
}
