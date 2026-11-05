"use client";

import React, { useEffect, useRef } from "react";

interface FireworksOverlayProps {
  active: boolean;
  soundEnabled?: boolean;
}

export default function FireworksOverlay({
  active,
  soundEnabled = true,
}: FireworksOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Background authentic Diwali cracker atmosphere
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio("/fireworks.mp3");
      audio.loop = true;
      audio.volume = 0.45;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (active && soundEnabled) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
    };
  }, [active, soundEnabled]);

  const playLaunchSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const duration = 0.28;

      const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) output[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.setValueAtTime(4, now);
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(3600, now + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.18, now + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      noise.start(now); noise.stop(now + duration);
    } catch {}
  };

  const playBurstSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;

      // Sharp crack
      const snapDur = 0.07;
      const snapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * snapDur), ctx.sampleRate);
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapData.length; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.012));
      }
      const snapSrc = ctx.createBufferSource();
      snapSrc.buffer = snapBuf;
      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "highpass";
      snapFilter.frequency.setValueAtTime(1400, t);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.5, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + snapDur);
      snapSrc.connect(snapFilter); snapFilter.connect(snapGain); snapGain.connect(ctx.destination);
      snapSrc.start(t); snapSrc.stop(t + snapDur);

      // Boom body
      const boomDur = 0.5;
      const boomBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * boomDur), ctx.sampleRate);
      const boomData = boomBuf.getChannelData(0);
      for (let i = 0; i < boomData.length; i++) {
        boomData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.09));
      }
      const boomSrc = ctx.createBufferSource();
      boomSrc.buffer = boomBuf;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(260, t);
      lowpass.frequency.exponentialRampToValueAtTime(40, t + boomDur);
      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.7, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + boomDur);
      boomSrc.connect(lowpass); lowpass.connect(boomGain); boomGain.connect(ctx.destination);
      boomSrc.start(t); boomSrc.stop(t + boomDur);
    } catch {}
  };

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colorThemes = [
      { primary: "#d946ef", glow: "#e879f9" },
      { primary: "#f97316", glow: "#fb923c" },
      { primary: "#22c55e", glow: "#4ade80" },
      { primary: "#06b6d4", glow: "#38bdf8" },
      { primary: "#eab308", glow: "#fde047" },
      { primary: "#f43f5e", glow: "#fb7185" },
    ];

    interface TrailPoint { x: number; y: number; }

    interface Streamer {
      x: number; y: number;
      vx: number; vy: number;
      color: string; glowColor: string;
      alpha: number; decay: number;
      gravity: number; friction: number;
      lineWidth: number;
      history: TrailPoint[];
      maxHistory: number;
    }

    interface Rocket {
      x: number; y: number;
      targetY: number; vy: number;
      color: string; glowColor: string;
      history: TrailPoint[];
    }

    interface Flash {
      x: number; y: number;
      radius: number; color: string; alpha: number;
    }

    let rockets: Rocket[] = [];
    let streamers: Streamer[] = [];
    let flashes: Flash[] = [];

    const launchRocket = () => {
      if (!isRunning) return;
      const theme = colorThemes[Math.floor(Math.random() * colorThemes.length)];
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY = Math.random() * (canvas.height * 0.35) + canvas.height * 0.08;
      // Faster ascent: 28–38px/frame
      rockets.push({
        x, y: canvas.height + 20, targetY,
        vy: -(Math.random() * 10 + 28),
        color: theme.primary, glowColor: theme.glow,
        history: [],
      });
      playLaunchSound();
    };

    const detonateRocket = (rocket: Rocket) => {
      const theme = colorThemes.find(t => t.primary === rocket.color) || colorThemes[0];
      playBurstSound();

      flashes.push({ x: rocket.x, y: rocket.y, radius: 32, color: theme.glow, alpha: 0.9 });

      // Reduced streamer count: 55–75 (was 95–130) — same visual density, way faster render
      const count = Math.floor(Math.random() * 20) + 55;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = Math.random() * 9 + 8; // 8–17px/frame
        const isAccent = Math.random() > 0.5;
        streamers.push({
          x: rocket.x, y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: isAccent ? theme.glow : theme.primary,
          glowColor: theme.glow,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.018,   // fast fade so count stays low
          gravity: Math.random() * 0.05 + 0.1,   // snappy pull
          friction: 0.93,
          lineWidth: Math.random() * 1.8 + 1.2,
          history: [],
          maxHistory: Math.floor(Math.random() * 5) + 10,
        });
      }
    };

    // Initial rapid burst
    launchRocket();
    setTimeout(launchRocket, 120);
    setTimeout(launchRocket, 280);
    setTimeout(launchRocket, 460);

    // Sustain: one rocket every 500ms, occasional double
    const launchInterval = setInterval(() => {
      if (!isRunning) return;
      launchRocket();
      if (Math.random() > 0.4) setTimeout(launchRocket, Math.random() * 160 + 80);
    }, 500);

    // ── Render loop ─────────────────────────────────────────────
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        ctx.save();
        ctx.globalAlpha = f.alpha;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.5, f.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        f.alpha -= 0.18;
        f.radius += 9;
        if (f.alpha <= 0) flashes.splice(i, 1);
      }

      // 2. Rockets — one shadowBlur set per rocket, not per segment
      ctx.save();
      ctx.lineWidth = 2.2;
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > 10) r.history.shift();
        r.y += r.vy;

        if (r.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(r.history[0].x, r.history[0].y);
          for (let h = 1; h < r.history.length; h++) ctx.lineTo(r.history[h].x, r.history[h].y);
          ctx.strokeStyle = r.glowColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = r.color;
          ctx.stroke();
        }

        // Tip dot
        ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.shadowColor = r.glowColor;
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= -1) {
          detonateRocket(r);
          rockets.splice(i, 1);
        }
      }
      ctx.restore();

      // 3. Streamers — batch by color to cut draw calls
      //    shadowBlur only once per batch group
      for (let i = streamers.length - 1; i >= 0; i--) {
        const s = streamers[i];
        s.history.push({ x: s.x, y: s.y });
        if (s.history.length > s.maxHistory) s.history.shift();
        s.vx *= s.friction; s.vy *= s.friction;
        s.vy += s.gravity;
        s.x += s.vx; s.y += s.vy;
        s.alpha -= s.decay;
        if (s.alpha <= 0) { streamers.splice(i, 1); continue; }

        // Trail
        if (s.history.length > 1) {
          ctx.save();
          ctx.shadowBlur = 7;
          ctx.shadowColor = s.glowColor;
          for (let h = 1; h < s.history.length; h++) {
            const p0 = s.history[h - 1];
            const p1 = s.history[h];
            const segAlpha = (h / s.history.length) * s.alpha;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = s.color;
            ctx.globalAlpha = Math.max(0, segAlpha);
            ctx.lineWidth = s.lineWidth * (h / s.history.length);
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.restore();
        }

        // Head dot — no shadow on these to save GPU
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha * 0.9);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.lineWidth * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      clearInterval(launchInterval);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [active, soundEnabled]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 75,
      }}
    />
  );
}
