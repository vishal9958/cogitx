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

  // Synchronized sound generator (Accurate rocket launch whoosh & sharp explosive crack)
  const playLaunchSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const duration = 0.32;

      // Filtered noise ascent whoosh
      const noiseBuffer = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * duration),
        ctx.sampleRate
      );
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < output.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.setValueAtTime(4, now);
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.exponentialRampToValueAtTime(3600, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.2, now + duration * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + duration);

      // Rocket ascent whistle
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + duration);

      oscGain.gain.setValueAtTime(0.01, now);
      oscGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.75);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  };

  const playBurstSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const t = ctx.currentTime;

      // 1. Instant sharp shell crack (High-energy explosive snap, NO drum tones!)
      const snapDur = 0.07;
      const snapBuf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * snapDur),
        ctx.sampleRate
      );
      const snapData = snapBuf.getChannelData(0);
      for (let i = 0; i < snapData.length; i++) {
        snapData[i] =
          (Math.random() * 2 - 1) *
          Math.exp(-i / (ctx.sampleRate * 0.012));
      }
      const snapSrc = ctx.createBufferSource();
      snapSrc.buffer = snapBuf;
      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "highpass";
      snapFilter.frequency.setValueAtTime(1400, t);
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.55, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + snapDur);

      snapSrc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapSrc.start(t);
      snapSrc.stop(t + snapDur);

      // 2. Concussive explosive body blast (Pure air displacement noise)
      const boomDur = 0.55;
      const boomBuf = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * boomDur),
        ctx.sampleRate
      );
      const boomData = boomBuf.getChannelData(0);
      for (let i = 0; i < boomData.length; i++) {
        boomData[i] =
          (Math.random() * 2 - 1) *
          Math.exp(-i / (ctx.sampleRate * 0.09));
      }
      const boomSrc = ctx.createBufferSource();
      boomSrc.buffer = boomBuf;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(260, t);
      lowpass.frequency.exponentialRampToValueAtTime(40, t + boomDur);

      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.75, t);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + boomDur);

      boomSrc.connect(lowpass);
      lowpass.connect(boomGain);
      boomGain.connect(ctx.destination);
      boomSrc.start(t);
      boomSrc.stop(t + boomDur);

      // 3. Sizzling sparkler crackles (char-char-pat-pat)
      const crackleCount = 16;
      for (let c = 0; c < crackleCount; c++) {
        const delay = 0.06 + Math.random() * 0.5;
        const cTime = t + delay;
        const popLen = Math.floor(ctx.sampleRate * 0.025);
        const popBuf = ctx.createBuffer(1, popLen, ctx.sampleRate);
        const pData = popBuf.getChannelData(0);
        for (let k = 0; k < popLen; k++) {
          pData[k] =
            (Math.random() * 2 - 1) *
            Math.exp(-k / (ctx.sampleRate * 0.0035));
        }
        const popSrc = ctx.createBufferSource();
        popSrc.buffer = popBuf;

        const pFilter = ctx.createBiquadFilter();
        pFilter.type = "bandpass";
        pFilter.frequency.setValueAtTime(2500 + Math.random() * 1400, cTime);

        const pGain = ctx.createGain();
        pGain.gain.setValueAtTime(0.1 + Math.random() * 0.15, cTime);

        popSrc.connect(pFilter);
        pFilter.connect(pGain);
        pGain.connect(ctx.destination);
        popSrc.start(cTime);
      }
    } catch {}
  };

  // High-speed energetic canvas fireworks matching reference image:
  // Fast ascent -> Snappy punchy detonation -> Cascading weeping willow trails
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

    // Color palettes matching reference image:
    // Magenta, Warm Coral/Orange, Neon Green, Ice Blue, Golden Amber, Ruby Red
    const colorThemes = [
      { primary: "#d946ef", glow: "#e879f9", light: "#f5d0fe" }, // Violet / Magenta
      { primary: "#f97316", glow: "#fb923c", light: "#ffedd5" }, // Warm Coral / Orange
      { primary: "#22c55e", glow: "#4ade80", light: "#dcfce7" }, // Neon Emerald Green
      { primary: "#06b6d4", glow: "#38bdf8", light: "#e0f2fe" }, // Cyan / Glacier Blue
      { primary: "#eab308", glow: "#fde047", light: "#fef9c3" }, // Golden Amber
      { primary: "#f43f5e", glow: "#fb7185", light: "#ffe4e6" }, // Festive Ruby Rose
    ];

    interface TrailPoint {
      x: number;
      y: number;
      alpha: number;
    }

    interface Streamer {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      glowColor: string;
      alpha: number;
      decay: number;
      gravity: number;
      friction: number;
      lineWidth: number;
      history: TrailPoint[];
      maxHistory: number;
      sparkle: boolean;
    }

    interface AscendingRocket {
      x: number;
      y: number;
      targetY: number;
      vy: number;
      color: string;
      glowColor: string;
      history: { x: number; y: number }[];
    }

    interface DetonationFlash {
      x: number;
      y: number;
      radius: number;
      color: string;
      alpha: number;
    }

    let rockets: AscendingRocket[] = [];
    let streamers: Streamer[] = [];
    let flashes: DetonationFlash[] = [];

    const launchRocket = () => {
      if (!isRunning) return;

      const theme =
        colorThemes[Math.floor(Math.random() * colorThemes.length)];
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY =
        Math.random() * (canvas.height * 0.35) + canvas.height * 0.08;

      // Fast, snappy ascent (speed 22-28px/frame instead of 14)
      rockets.push({
        x,
        y: canvas.height + 20,
        targetY,
        vy: -(Math.random() * 6 + 23),
        color: theme.primary,
        glowColor: theme.glow,
        history: [],
      });

      playLaunchSound();
    };

    const detonateRocket = (rocket: AscendingRocket) => {
      const theme =
        colorThemes.find((t) => t.primary === rocket.color) ||
        colorThemes[Math.floor(Math.random() * colorThemes.length)];

      playBurstSound();

      // Brief flash at explosion center
      flashes.push({
        x: rocket.x,
        y: rocket.y,
        radius: 35,
        color: theme.glow,
        alpha: 0.85,
      });

      // High streamer count with fast, energetic radial blast
      const streamerCount = Math.floor(Math.random() * 26) + 80;

      for (let i = 0; i < streamerCount; i++) {
        const angle =
          (Math.PI * 2 * i) / streamerCount +
          (Math.random() - 0.5) * 0.18;

        // Snappy initial velocity (speed 7 to 16px/frame instead of 2.2 to 5.8)
        const speed = Math.random() * 9 + 7.5;
        const isAccent = Math.random() > 0.6;
        const color = isAccent ? theme.glow : theme.primary;

        streamers.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          glowColor: theme.glow,
          alpha: 1,
          decay: Math.random() * 0.016 + 0.013, // Fast, lively fade
          gravity: Math.random() * 0.03 + 0.075, // Graceful weeping willow cascade
          friction: 0.945, // Crisp initial expansion then smooth flow
          lineWidth: Math.random() * 1.6 + 1.3,
          history: [],
          maxHistory: Math.floor(Math.random() * 6) + 16,
          sparkle: Math.random() > 0.35,
        });
      }
    };

    // Staggered barrage on start
    launchRocket();
    setTimeout(launchRocket, 200);
    setTimeout(launchRocket, 450);

    const launchInterval = setInterval(() => {
      if (!isRunning) return;
      launchRocket();
      // Double barrage
      if (Math.random() > 0.35) {
        setTimeout(launchRocket, Math.random() * 250 + 100);
      }
    }, 950);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render explosion flashes
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        ctx.save();
        ctx.globalAlpha = f.alpha;
        const grad = ctx.createRadialGradient(
          f.x,
          f.y,
          0,
          f.x,
          f.y,
          f.radius
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.5, f.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        f.alpha -= 0.15;
        f.radius += 8;
        if (f.alpha <= 0) flashes.splice(i, 1);
      }

      // 2. Render fast ascending rockets (glowing tracer trails)
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];

        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > 10) r.history.shift();

        r.y += r.vy;

        // Ascending tracer line
        if (r.history.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(r.history[0].x, r.history[0].y);
          for (let h = 1; h < r.history.length; h++) {
            ctx.lineTo(r.history[h].x, r.history[h].y);
          }
          ctx.strokeStyle = r.glowColor;
          ctx.lineWidth = 2.4;
          ctx.shadowBlur = 12;
          ctx.shadowColor = r.color;
          ctx.stroke();
          ctx.restore();
        }

        // Rocket tip (hot glowing missile spark)
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 16;
        ctx.shadowColor = r.glowColor;
        ctx.fill();
        ctx.restore();

        // Apex reached -> Detonate instantly
        if (r.y <= r.targetY || r.vy >= -1) {
          detonateRocket(r);
          rockets.splice(i, 1);
        }
      }

      // 3. Render radiating weeping willow streamers
      for (let i = streamers.length - 1; i >= 0; i--) {
        const s = streamers[i];

        s.history.push({ x: s.x, y: s.y, alpha: s.alpha });
        if (s.history.length > s.maxHistory) {
          s.history.shift();
        }

        s.vx *= s.friction;
        s.vy *= s.friction;
        s.vy += s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          streamers.splice(i, 1);
          continue;
        }

        // Draw weeping willow streamer tail
        if (s.history.length > 1) {
          ctx.save();
          for (let h = 1; h < s.history.length; h++) {
            const p0 = s.history[h - 1];
            const p1 = s.history[h];
            const segmentAlpha =
              (h / s.history.length) * s.alpha;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = s.color;
            ctx.globalAlpha = Math.max(0, segmentAlpha);
            ctx.lineWidth =
              s.lineWidth * (h / s.history.length);
            ctx.lineCap = "round";
            ctx.shadowBlur = 9;
            ctx.shadowColor = s.glowColor;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Glowing streamer head
        const headSparkleAlpha = s.sparkle
          ? s.alpha * (0.65 + Math.random() * 0.35)
          : s.alpha;

        ctx.save();
        ctx.globalAlpha = Math.max(0, headSparkleAlpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.lineWidth * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = s.glowColor;
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
        zIndex: 75, // Above backdrop (70), behind modal card (80)
      }}
    />
  );
}
