import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface WarpTunnelLoaderProps {
  onCancel: () => void;
}

interface Streak {
  angle: number;
  radialOffset: number;
  z: number;
  speed: number;
  length: number;
  color: string;
  width: number;
}

const NEON_COLORS = [
  '#EC4899', // magenta
  '#A3E635', // lime green
  '#22D3EE', // cyan
  '#A855F7', // violet
  '#FBBF24', // amber
];

const STATUS_MESSAGES = [
  'Identificazione modello, marca e condizioni visive',
  'Confronto prezzi reali su Subito, eBay e Vinted',
  'Calcolo probabilità di vendita e margini netti',
];

export function WarpTunnelLoader({ onCancel }: WarpTunnelLoaderProps) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasEl) {
      return;
    }
    const ctx = canvasEl.getContext('2d');
    if (!ctx) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasEl.width = Math.floor(width * dpr);
      canvasEl.height = Math.floor(height * dpr);
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const streakCount = 96;
    const streaks: Streak[] = Array.from({ length: streakCount }, (_, i) => ({
      angle: ((i / streakCount) * Math.PI * 2) + ((i % 5) * 0.14),
      radialOffset: 0.22 + ((i * 37) % 100) / 105,
      z: 0.08 + ((i * 19) % 100) / 100,
      speed: 0.012 + ((i % 7) * 0.0024),
      length: 0.18 + ((i % 4) * 0.06),
      color: NEON_COLORS[i % NEON_COLORS.length],
      width: 1.6 + (i % 3) * 0.75,
    }));

    const ringCount = 12;
    const rings = Array.from({ length: ringCount }, (_, i) => i / ringCount);
    const rayAngles = Array.from({ length: 20 }, (_, i) => (i / 20) * Math.PI * 2);

    let rafId = 0;
    let lastTime = performance.now();

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const stepFactor = reducedMotion ? 0 : dt * 60;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseScale = Math.max(width, height) * 0.56;

      // Subtle receding perspective grid rays
      ctx.save();
      ctx.lineWidth = 1;
      for (let i = 0; i < rayAngles.length; i++) {
        const angle = rayAngles[i];
        const innerR = baseScale * 0.045;
        const outerR = baseScale * 1.4;
        const grad = ctx.createLinearGradient(
          cx + Math.cos(angle) * innerR,
          cy + Math.sin(angle) * innerR,
          cx + Math.cos(angle) * outerR,
          cy + Math.sin(angle) * outerR,
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
        grad.addColorStop(0.35, 'rgba(148, 163, 184, 0.12)');
        grad.addColorStop(1, 'rgba(148, 163, 184, 0.03)');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.stroke();
      }

      // Advancing 3D perspective rectangular tunnel frames
      for (let i = 0; i < rings.length; i++) {
        if (!reducedMotion) {
          rings[i] -= 0.0048 * stepFactor;
          if (rings[i] <= 0.04) {
            rings[i] += 0.96;
          }
        }
        const z = rings[i];
        const invZ = 0.085 / Math.max(0.05, z);
        const halfW = width * 0.52 * invZ;
        const halfH = height * 0.52 * invZ;
        const alpha = Math.min(0.22, (1 - z) * 0.25);

        ctx.strokeStyle = `rgba(226, 232, 240, ${alpha.toFixed(3)})`;
        ctx.lineWidth = Math.max(0.75, 1.4 * (1 - z));
        ctx.strokeRect(cx - halfW, cy - halfH, halfW * 2, halfH * 2);
      }

      // Colorful neon light streaks rushing toward the viewer
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        if (!reducedMotion) {
          s.z -= s.speed * stepFactor;
          if (s.z <= 0.05) {
            s.z = 1.0 + (i % 5) * 0.06;
          }
        }

        const zHead = Math.max(0.05, s.z);
        const zTail = Math.min(1.25, zHead + s.length);

        const headScale = (s.radialOffset * baseScale * 0.18) / zHead;
        const tailScale = (s.radialOffset * baseScale * 0.18) / zTail;

        const x1 = cx + Math.cos(s.angle) * tailScale;
        const y1 = cy + Math.sin(s.angle) * tailScale;
        const x2 = cx + Math.cos(s.angle) * headScale;
        const y2 = cy + Math.sin(s.angle) * headScale;

        const brightness = Math.min(1, Math.max(0.15, (1.1 - zHead) * 1.1));
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, 'rgba(5, 5, 5, 0)');
        grad.addColorStop(0.4, s.color);
        grad.addColorStop(1, '#FFFFFF');

        ctx.globalAlpha = brightness;
        ctx.strokeStyle = grad;
        ctx.lineCap = 'round';
        ctx.lineWidth = s.width * Math.min(2.4, 0.55 / zHead);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Central depth vignette for crisp white typography readability
      const centerGlow = ctx.createRadialGradient(cx, cy, 8, cx, cy, Math.min(width, height) * 0.36);
      centerGlow.addColorStop(0, 'rgba(5, 5, 5, 0.92)');
      centerGlow.addColorStop(0.55, 'rgba(5, 5, 5, 0.65)');
      centerGlow.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);
    return () => {
      window.removeEventListener('resize', resize);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [canvasEl]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Analisi di mercato in corso"
      data-testid="warp-tunnel-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] px-6 text-center"
    >
      <canvas
        ref={setCanvasEl}
        data-testid="warp-tunnel-canvas"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <p className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
          Scansione visiva e analisi di mercato in corso...
        </p>

        <p
          aria-live="polite"
          className="mt-2 min-h-[1.5rem] text-sm font-normal tracking-wide text-white/75"
        >
          {STATUS_MESSAGES[statusIndex]}
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0"
        >
          Annulla
        </button>
      </div>
    </motion.div>
  );
}
