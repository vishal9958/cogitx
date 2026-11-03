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

  // Play real authentic Diwali crackers audio uploaded by user
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!audioRef.current) {
      const audio = new Audio("/fireworks.mp3");
      audio.loop = true;
      audio.volume = 0.85;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    if (active && soundEnabled) {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.log("Audio autoplay note:", err);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
    };
  }, [active, soundEnabled]);

  // Canvas-based Diwali Firework display with willow/palm trailing streaks
  // matches reference image (deep dark sky, glowing rising tracers, radiating falling streamers)
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

    // Color palettes matching the reference image:
    // Magenta/Violet, Amber/Orange/Coral, Emerald/Bright Green, Cyan/Electric Blue, Golden Yellow
    const colorThemes = [
      { primary: "#d946ef", glow: "#e879f9", light: "#f5d0fe" }, // Violet / Magenta
      { primary: "#f97316", glow: "#fb923c", light: "#ffedd5" }, // Warm Coral / Orange
      { primary: "#22c55e", glow: "#4ade80", light: "#dcfce7" }, // Neon Emerald Green
      { primary: "#06b6d4", glow: "#38bdf8", light: "#e0f2fe" }, // Cyan / Ice Blue
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

    let rockets: AscendingRocket[] = [];
    let streamers: Streamer[] = [];

    const launchRocket = () => {
      if (!isRunning) return;

      const theme =
        colorThemes[Math.floor(Math.random() * colorThemes.length)];
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY =
        Math.random() * (canvas.height * 0.38) + canvas.height * 0.08;

      rockets.push({
        x,
        y: canvas.height + 15,
        targetY,
        vy: -(Math.random() * 4 + 14),
        color: theme.primary,
        glowColor: theme.glow,
        history: [],
      });
    };

    const detonateRocket = (rocket: AscendingRocket) => {
      const theme =
        colorThemes.find((t) => t.primary === rocket.color) ||
        colorThemes[Math.floor(Math.random() * colorThemes.length)];

      // Radiating streamers count (long weeping willow / palm lines)
      const streamerCount = Math.floor(Math.random() * 24) + 68;

      for (let i = 0; i < streamerCount; i++) {
        // Uniform radial distribution with slight randomized spread
        const angle = (Math.PI * 2 * i) / streamerCount + (Math.random() - 0.5) * 0.15;
        const speed = Math.random() * 5.8 + 2.2;
        const isAccent = Math.random() > 0.65;
        const color = isAccent ? theme.glow : theme.primary;

        streamers.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          glowColor: theme.glow,
          alpha: 1,
          decay: Math.random() * 0.009 + 0.007, // Long lived streamers
          gravity: Math.random() * 0.035 + 0.045, // Downward weeping curve
          friction: 0.965,
          lineWidth: Math.random() * 1.5 + 1.2,
          history: [],
          maxHistory: Math.floor(Math.random() * 8) + 14,
          sparkle: Math.random() > 0.4,
        });
      }
    };

    // Staggered launch initial sequence
    launchRocket();
    setTimeout(launchRocket, 280);
    setTimeout(launchRocket, 650);

    const launchInterval = setInterval(() => {
      if (!isRunning) return;
      launchRocket();
      // Double rocket burst occasionally
      if (Math.random() > 0.4) {
        setTimeout(launchRocket, Math.random() * 300 + 150);
      }
    }, 1100);

    const render = () => {
      // Clear with slight trailing blend for smooth luminous motion
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render ascending rockets (thin vertical glowing tracer lines)
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];

        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > 12) r.history.shift();

        r.y += r.vy;

        // Draw ascending tracer tail
        if (r.history.length > 1) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(r.history[0].x, r.history[0].y);
          for (let h = 1; h < r.history.length; h++) {
            ctx.lineTo(r.history[h].x, r.history[h].y);
          }
          ctx.strokeStyle = r.glowColor;
          ctx.lineWidth = 2.2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = r.color;
          ctx.stroke();
          ctx.restore();
        }

        // Rocket tip (glowing spark)
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.shadowColor = r.glowColor;
        ctx.fill();
        ctx.restore();

        // Apex reached -> Detonate into weeping willow streamers!
        if (r.y <= r.targetY || r.vy >= -1) {
          detonateRocket(r);
          rockets.splice(i, 1);
        }
      }

      // 2. Render radiating weeping willow streamers
      for (let i = streamers.length - 1; i >= 0; i--) {
        const s = streamers[i];

        // Store trail point
        s.history.push({ x: s.x, y: s.y, alpha: s.alpha });
        if (s.history.length > s.maxHistory) {
          s.history.shift();
        }

        // Physics: friction + gravity = graceful falling curve
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

        // Draw the long glowing trail
        if (s.history.length > 1) {
          ctx.save();
          for (let h = 1; h < s.history.length; h++) {
            const p0 = s.history[h - 1];
            const p1 = s.history[h];
            const segmentAlpha = (h / s.history.length) * s.alpha;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = s.color;
            ctx.globalAlpha = Math.max(0, segmentAlpha);
            ctx.lineWidth = s.lineWidth * (h / s.history.length);
            ctx.lineCap = "round";
            ctx.shadowBlur = 8;
            ctx.shadowColor = s.glowColor;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Glowing streamer head
        const headSparkleAlpha = s.sparkle
          ? s.alpha * (0.6 + Math.random() * 0.4)
          : s.alpha;

        ctx.save();
        ctx.globalAlpha = Math.max(0, headSparkleAlpha);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.lineWidth * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
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
    };
  }, [active]);

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
