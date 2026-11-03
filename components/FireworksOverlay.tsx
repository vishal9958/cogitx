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
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Authentic Diwali Sky-Rocket sound: Whistle/Whoosh launch -> Concussive blast -> Crackles
  const playDiwaliRocketSound = () => {
    if (!soundEnabled) return;

    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Rocket launch hiss & rising whistle (0 to 0.65s)
      const noiseLen = Math.floor(ctx.sampleRate * 0.7);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const output = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.Q.setValueAtTime(5, now);
      bandpass.frequency.setValueAtTime(550, now);
      bandpass.frequency.exponentialRampToValueAtTime(3200, now + 0.6);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, now);
      noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

      noiseSrc.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now);
      noiseSrc.stop(now + 0.7);

      // Whistling tone of rising rocket
      const whistle = ctx.createOscillator();
      const whistleGain = ctx.createGain();
      whistle.type = "sawtooth";
      whistle.frequency.setValueAtTime(450, now);
      whistle.frequency.exponentialRampToValueAtTime(2400, now + 0.6);

      whistleGain.gain.setValueAtTime(0.02, now);
      whistleGain.gain.linearRampToValueAtTime(0.14, now + 0.45);
      whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

      whistle.connect(whistleGain);
      whistleGain.connect(ctx.destination);
      whistle.start(now);
      whistle.stop(now + 0.65);

      // 2. Blast explosion at 0.6s (concussive thump + crackles)
      setTimeout(() => {
        if (!ctx || ctx.state === "closed") return;
        const t = ctx.currentTime;

        // Concussive bass thud (felt in chest)
        const boomOsc = ctx.createOscillator();
        const boomGain = ctx.createGain();
        boomOsc.type = "sine";
        boomOsc.frequency.setValueAtTime(180, t);
        boomOsc.frequency.exponentialRampToValueAtTime(32, t + 0.45);
        boomGain.gain.setValueAtTime(0.65, t);
        boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        boomOsc.connect(boomGain);
        boomGain.connect(ctx.destination);
        boomOsc.start(t);
        boomOsc.stop(t + 0.55);

        // Explosion body blast
        const blastLen = Math.floor(ctx.sampleRate * 0.45);
        const blastBuf = ctx.createBuffer(1, blastLen, ctx.sampleRate);
        const blastData = blastBuf.getChannelData(0);
        for (let i = 0; i < blastLen; i++) {
          blastData[i] = Math.random() * 2 - 1;
        }
        const blastSrc = ctx.createBufferSource();
        blastSrc.buffer = blastBuf;
        const blastFilter = ctx.createBiquadFilter();
        blastFilter.type = "lowpass";
        blastFilter.frequency.setValueAtTime(1500, t);
        blastFilter.frequency.exponentialRampToValueAtTime(140, t + 0.35);

        const blastGain = ctx.createGain();
        blastGain.gain.setValueAtTime(0.45, t);
        blastGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

        blastSrc.connect(blastFilter);
        blastFilter.connect(blastGain);
        blastGain.connect(ctx.destination);
        blastSrc.start(t);
        blastSrc.stop(t + 0.45);

        // Sizzling sparkler crackles (charr-pat-pat-pat)
        const crackleCount = 10;
        for (let c = 0; c < crackleCount; c++) {
          const crackleDelay = 0.06 + Math.random() * 0.45;
          const cTime = t + crackleDelay;
          const popLen = Math.floor(ctx.sampleRate * 0.035);
          const popBuf = ctx.createBuffer(1, popLen, ctx.sampleRate);
          const pData = popBuf.getChannelData(0);
          for (let k = 0; k < popLen; k++) {
            pData[k] =
              (Math.random() * 2 - 1) *
              Math.exp(-k / (ctx.sampleRate * 0.004));
          }
          const popSrc = ctx.createBufferSource();
          popSrc.buffer = popBuf;

          const pGain = ctx.createGain();
          pGain.gain.setValueAtTime(0.12 + Math.random() * 0.15, cTime);

          popSrc.connect(pGain);
          pGain.connect(ctx.destination);
          popSrc.start(cTime);
        }
      }, 580);
    } catch (e) {
      console.warn("Audio note:", e);
    }
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

    const festiveColors = [
      "#f59e0b", // Golden Amber
      "#ef4444", // Ruby Red
      "#fbbf24", // Golden Yellow
      "#c026d3", // Royal Violet
      "#ec4899", // Saffron Pink
      "#10b981", // Emerald Green
      "#38bdf8", // Sky Blue
      "#ffffff", // Glitter White
      "#f97316", // Deep Orange
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      decay: number;
      radius: number;
      flicker: boolean;
    }

    interface SparkTrail {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
    }

    interface Rocket {
      x: number;
      y: number;
      targetY: number;
      vx: number;
      vy: number;
      color: string;
      sparks: SparkTrail[];
    }

    let rockets: Rocket[] = [];
    let particles: Particle[] = [];

    const launchRocket = () => {
      if (!isRunning) return;

      // Launch points across screen (left, center-left, center-right, right)
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY =
        Math.random() * (canvas.height * 0.45) + canvas.height * 0.08;
      const color =
        festiveColors[Math.floor(Math.random() * festiveColors.length)];

      rockets.push({
        x,
        y: canvas.height + 10,
        targetY,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(Math.random() * 3 + 13),
        color,
        sparks: [],
      });

      playDiwaliRocketSound();
    };

    const explodeRocket = (rocket: Rocket) => {
      const count = 90;
      const baseHue = rocket.color;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 1.5;
        const color =
          Math.random() > 0.35
            ? baseHue
            : festiveColors[Math.floor(Math.random() * festiveColors.length)];

        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.016 + 0.011,
          radius: Math.random() * 2.8 + 1.6,
          flicker: Math.random() > 0.4,
        });
      }
    };

    // Rapid initial barrage
    launchRocket();
    setTimeout(launchRocket, 350);

    const intervalId = setInterval(() => {
      if (!isRunning) return;
      launchRocket();
      // Occasional simultaneous twin launch
      if (Math.random() > 0.45) {
        setTimeout(launchRocket, 250);
      }
    }, 1200);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & Draw Rockets with burning fiery exhaust trail
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];

        // Emit exhaust sparks
        for (let s = 0; s < 3; s++) {
          r.sparks.push({
            x: r.x + (Math.random() - 0.5) * 4,
            y: r.y + Math.random() * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: Math.random() * 3 + 1,
            alpha: 1,
            size: Math.random() * 2.5 + 1.2,
          });
        }

        r.x += r.vx;
        r.y += r.vy;

        // Render burning spark exhaust
        for (let s = r.sparks.length - 1; s >= 0; s--) {
          const sp = r.sparks[s];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.alpha -= 0.07;
          if (sp.alpha <= 0) {
            r.sparks.splice(s, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${sp.alpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#f59e0b";
          ctx.fill();
        }

        // Rocket head (bright glowing missile)
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.shadowColor = r.color;
        ctx.fill();
        ctx.restore();

        // Apex check -> Detonate!
        if (r.y <= r.targetY || r.vy >= -1) {
          explodeRocket(r);
          rockets.splice(i, 1);
        }
      }

      // Update & Draw Exploding Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.vy += 0.07; // Gravity
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const currentAlpha = p.flicker
          ? Math.max(0, p.alpha * (0.5 + Math.random() * 0.5))
          : p.alpha;

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      clearInterval(intervalId);
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
        zIndex: 75, // Above backdrop (70), right behind modal card (80)
      }}
    />
  );
}
