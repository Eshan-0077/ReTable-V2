import React, { useEffect, useRef } from 'react';
import type { AccentPalette } from '../types/timetable';

interface HexWaveBackdropProps {
  accentPalette: AccentPalette;
  isDark: boolean;
  isProMax: boolean;
}

type RGB = [number, number, number];

interface HexThemeSpec {
  key: string;
  base: RGB;
  crest: RGB;
  trough: RGB;
  glow: RGB;
  stroke: RGB;
  strokeAlpha: number;
  fillAlpha: number;
}

interface TouchRipple {
  x: number;
  y: number;
  startTime: number;
  strength: number;
}

interface HexCell {
  cx: number;
  cy: number;
}

const STANDARD_LIGHT_THEMES: Record<AccentPalette, Omit<HexThemeSpec, 'key'>> = {
  sage: {
    base: [224, 238, 231],
    crest: [188, 224, 207],
    trough: [236, 244, 240],
    glow: [111, 185, 155],
    stroke: [92, 148, 124],
    strokeAlpha: 0.24,
    fillAlpha: 0.72,
  },
  lavender: {
    base: [232, 227, 246],
    crest: [204, 192, 239],
    trough: [241, 239, 248],
    glow: [152, 131, 208],
    stroke: [122, 102, 182],
    strokeAlpha: 0.24,
    fillAlpha: 0.72,
  },
  sky: {
    base: [223, 236, 248],
    crest: [184, 216, 244],
    trough: [237, 244, 250],
    glow: [102, 168, 224],
    stroke: [84, 138, 188],
    strokeAlpha: 0.24,
    fillAlpha: 0.72,
  },
  peach: {
    base: [246, 232, 221],
    crest: [242, 204, 178],
    trough: [249, 242, 236],
    glow: [222, 145, 102],
    stroke: [182, 118, 82],
    strokeAlpha: 0.23,
    fillAlpha: 0.72,
  },
  rose: {
    base: [245, 228, 235],
    crest: [238, 194, 210],
    trough: [249, 239, 243],
    glow: [212, 124, 152],
    stroke: [172, 98, 122],
    strokeAlpha: 0.23,
    fillAlpha: 0.72,
  },
};

const STANDARD_DARK_THEMES: Record<AccentPalette, Omit<HexThemeSpec, 'key'>> = {
  sage: {
    base: [16, 28, 24],
    crest: [36, 74, 60],
    trough: [10, 17, 15],
    glow: [122, 212, 182],
    stroke: [120, 200, 172],
    strokeAlpha: 0.22,
    fillAlpha: 0.78,
  },
  lavender: {
    base: [22, 19, 34],
    crest: [54, 44, 92],
    trough: [13, 12, 20],
    glow: [185, 166, 244],
    stroke: [168, 150, 230],
    strokeAlpha: 0.22,
    fillAlpha: 0.78,
  },
  sky: {
    base: [15, 25, 36],
    crest: [34, 68, 104],
    trough: [10, 16, 22],
    glow: [138, 198, 246],
    stroke: [124, 184, 234],
    strokeAlpha: 0.22,
    fillAlpha: 0.78,
  },
  peach: {
    base: [30, 21, 17],
    crest: [78, 48, 34],
    trough: [18, 13, 11],
    glow: [242, 180, 140],
    stroke: [220, 158, 120],
    strokeAlpha: 0.22,
    fillAlpha: 0.78,
  },
  rose: {
    base: [30, 18, 24],
    crest: [78, 40, 56],
    trough: [18, 12, 15],
    glow: [240, 156, 184],
    stroke: [220, 138, 166],
    strokeAlpha: 0.22,
    fillAlpha: 0.78,
  },
};

function resolveHexTheme(
  accentPalette: AccentPalette,
  isDark: boolean,
  isProMax: boolean,
): HexThemeSpec {
  const key = `${accentPalette}-${isDark ? 'dark' : 'light'}-${isProMax ? 'promax' : 'std'}`;
  const paletteSpec = isDark
    ? STANDARD_DARK_THEMES[accentPalette]
    : STANDARD_LIGHT_THEMES[accentPalette];

  if (isProMax) {
    if (isDark) {
      return {
        key,
        base: mixRgb([8, 26, 52], paletteSpec.base, 0.16),
        crest: mixRgb([30, 96, 158], paletteSpec.crest, 0.22),
        trough: [4, 12, 26],
        glow: mixRgb([130, 222, 255], paletteSpec.glow, 0.25),
        stroke: mixRgb([148, 226, 255], paletteSpec.stroke, 0.2),
        strokeAlpha: 0.34,
        fillAlpha: 0.84,
      };
    }
    return {
      key,
      base: mixRgb([194, 224, 246], paletteSpec.base, 0.24),
      crest: mixRgb([242, 251, 255], paletteSpec.crest, 0.18),
      trough: mixRgb([156, 198, 234], paletteSpec.trough, 0.2),
      glow: mixRgb([255, 255, 255], paletteSpec.glow, 0.22),
      stroke: [255, 255, 255],
      strokeAlpha: 0.58,
      fillAlpha: 0.78,
    };
  }

  return { key, ...paletteSpec };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(lerp(a[0], b[0], k)),
    Math.round(lerp(a[1], b[1], k)),
    Math.round(lerp(a[2], b[2], k)),
  ];
}

// Precomputed pointy-top unit hexagon vertices
const HEX_VERTS: [number, number][] = Array.from({ length: 6 }, (_, i) => {
  const angle = (Math.PI / 3) * i - Math.PI / 6;
  return [Math.cos(angle), Math.sin(angle)];
});

const FLIP_AXIS_ANGLE = 0.34; // ~19.5deg diagonal tilt for tactile 3D tile flip
const FLIP_COS = Math.cos(FLIP_AXIS_ANGLE);
const FLIP_SIN = Math.sin(FLIP_AXIS_ANGLE);

export const HexWaveBackdrop: React.FC<HexWaveBackdropProps> = ({
  accentPalette,
  isDark,
  isProMax,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nextTheme = resolveHexTheme(accentPalette, isDark, isProMax);
  const currentThemeRef = useRef<HexThemeSpec>(nextTheme);
  const flipStateRef = useRef<{
    active: boolean;
    from: HexThemeSpec;
    to: HexThemeSpec;
    startTime: number;
    originX: number;
    originY: number;
  }>({
    active: false,
    from: nextTheme,
    to: nextTheme,
    startTime: 0,
    originX: 0,
    originY: 0,
  });

  const ripplesRef = useRef<TouchRipple[]>([]);
  const lastPointerRef = useRef<{ x: number; y: number; hasValue: boolean }>({
    x: 0,
    y: 0,
    hasValue: false,
  });
  const cellsRef = useRef<HexCell[]>([]);
  const viewportRef = useRef<{ width: number; height: number; dpr: number; radius: number }>({
    width: 1280,
    height: 720,
    dpr: 1,
    radius: 33,
  });
  const redrawOnceRef = useRef<(() => void) | null>(null);

  // Trigger staggered 3D tile flip whenever color scheme changes
  useEffect(() => {
    const prev = currentThemeRef.current;
    if (prev.key === nextTheme.key) return;

    const { width, height } = viewportRef.current;
    const originX = lastPointerRef.current.hasValue
      ? lastPointerRef.current.x
      : width * 0.5;
    const originY = lastPointerRef.current.hasValue
      ? lastPointerRef.current.y
      : height * 0.35;

    flipStateRef.current = {
      active: true,
      from: prev,
      to: nextTheme,
      startTime: performance.now(),
      originX,
      originY,
    };
    currentThemeRef.current = nextTheme;

    // Add a subtle pulse ripple along with the color flip
    ripplesRef.current.push({
      x: originX,
      y: originY,
      startTime: performance.now(),
      strength: 0.75,
    });
    if (ripplesRef.current.length > 10) {
      ripplesRef.current.shift();
    }

    redrawOnceRef.current?.();
  }, [nextTheme.key, nextTheme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotionMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = Boolean(reducedMotionMq?.matches);

    const buildGrid = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const radius = width < 640 ? 32 : 40;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      viewportRef.current = { width, height, dpr, radius };

      const hexW = Math.sqrt(3) * radius;
      const rowH = 1.5 * radius;
      const cols = Math.ceil(width / hexW) + 2;
      const rows = Math.ceil(height / rowH) + 2;

      const cells: HexCell[] = [];
      for (let row = -1; row <= rows; row++) {
        const y = row * rowH;
        const xOffset = (row & 1) === 1 ? hexW * 0.5 : 0;
        for (let col = -1; col <= cols; col++) {
          const x = col * hexW + xOffset;
          cells.push({ cx: x, cy: y });
        }
      }
      cellsRef.current = cells;
    };

    buildGrid();

    let lastTouchRippleAt = 0;
    let lastMoveAt = 0;
    let lastMoveX = 0;
    let lastMoveY = 0;

    const spawnRipple = (x: number, y: number, strength: number) => {
      lastPointerRef.current = { x, y, hasValue: true };
      const now = performance.now();
      ripplesRef.current.push({ x, y, startTime: now, strength });
      if (ripplesRef.current.length > 10) {
        ripplesRef.current.shift();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const now = performance.now();
      if (e.pointerType === 'touch' && now - lastTouchRippleAt < 40) return;
      spawnRipple(e.clientX, e.clientY, 1.0);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveAt < 38) return;
      const distMoved = Math.hypot(e.clientX - lastMoveX, e.clientY - lastMoveY);
      if (distMoved < 16) return;
      lastMoveAt = now;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;
      spawnRipple(e.clientX, e.clientY, e.buttons > 0 ? 0.65 : 0.36);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      lastTouchRippleAt = performance.now();
      spawnRipple(touch.clientX, touch.clientY, 1.0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const now = performance.now();
      if (now - lastMoveAt < 36) return;
      const distMoved = Math.hypot(touch.clientX - lastMoveX, touch.clientY - lastMoveY);
      if (distMoved < 14) return;
      lastMoveAt = now;
      lastMoveX = touch.clientX;
      lastMoveY = touch.clientY;
      spawnRipple(touch.clientX, touch.clientY, 0.72);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    const drawFrame = (nowMs: number) => {
      const { width, height, dpr, radius } = viewportRef.current;
      const cells = cellsRef.current;
      const flip = flipStateRef.current;
      const t = reducedMotion ? 0 : nowMs * 0.001;

      // Prune finished ripples (> 2.2s)
      const activeRipples = ripplesRef.current.filter(
        (r) => nowMs - r.startTime < 2200,
      );
      ripplesRef.current = activeRipples;

      const maxDiag = Math.max(300, Math.hypot(width, height));
      const flipCascadeDuration = 460;
      const flipTileDuration = 380;

      if (flip.active) {
        if (
          reducedMotion ||
          nowMs - flip.startTime > flipCascadeDuration + flipTileDuration + 60
        ) {
          flip.active = false;
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const baseDrawRadius = radius - 1.6;

      for (let i = 0; i < cells.length; i++) {
        const { cx, cy } = cells[i];

        // Continuous travelling wave field across honeycomb
        const waveA = Math.sin(cx * 0.0085 + cy * 0.0045 - t * 1.35);
        const waveB = Math.cos(cy * 0.0092 - cx * 0.0036 - t * 0.95);
        const ambientWave = waveA * 0.58 + waveB * 0.42; // [-1, 1]

        // Touch ripple interference
        let rippleSum = 0;
        let rippleHighlight = 0;
        for (let rIdx = 0; rIdx < activeRipples.length; rIdx++) {
          const r = activeRipples[rIdx];
          const ageSec = (nowMs - r.startTime) * 0.001;
          const dist = Math.hypot(cx - r.x, cy - r.y);
          const waveFront = ageSec * 430;
          const delta = dist - waveFront;
          // Early exit outside wave band (~170px)
          if (delta > 170 || delta < -170) continue;

          const envelope =
            Math.exp(-(delta * delta) / (2 * 56 * 56)) *
            Math.exp(-ageSec * 1.45) *
            r.strength;
          const osc = Math.cos(delta * 0.055);
          rippleSum += envelope * osc;
          rippleHighlight += Math.max(0, envelope * (0.65 + 0.35 * osc));
        }

        // Flip transform if color scheme transition is in flight
        let tileTheme = currentThemeRef.current;
        let flipCompress = 1;
        let flipGlint = 0;

        if (flip.active) {
          const distFromOrigin = Math.hypot(cx - flip.originX, cy - flip.originY);
          const delay = (distFromOrigin / maxDiag) * flipCascadeDuration;
          const localP = Math.max(
            0,
            Math.min(1, (nowMs - flip.startTime - delay) / flipTileDuration),
          );
          const eased = 0.5 - 0.5 * Math.cos(localP * Math.PI);
          const angle = eased * Math.PI;
          flipCompress = Math.max(0.05, Math.abs(Math.cos(angle)));
          tileTheme = angle < Math.PI * 0.5 ? flip.from : flip.to;
          flipGlint = Math.pow(Math.sin(angle), 2) * 0.45;
        }

        const combinedWave = Math.max(-1.1, Math.min(1.4, ambientWave + rippleSum * 1.35));
        const tileScale = Math.max(
          0.84,
          Math.min(1.06, 0.965 + combinedWave * 0.038),
        );
        const drawR = baseDrawRadius * tileScale;

        // Compute fill color from trough -> base -> crest -> touch glow
        let rgb: RGB;
        if (combinedWave >= 0) {
          rgb = mixRgb(tileTheme.base, tileTheme.crest, Math.min(1, combinedWave * 0.85));
        } else {
          rgb = mixRgb(tileTheme.base, tileTheme.trough, Math.min(1, -combinedWave * 0.85));
        }

        const glowBlend = Math.min(0.82, rippleHighlight * 0.55 + flipGlint * 0.5);
        if (glowBlend > 0.01) {
          rgb = mixRgb(rgb, tileTheme.glow, glowBlend);
        }

        // Draw hexagon rotated onto flip axis if flipping, fast direct path otherwise
        ctx.beginPath();
        if (flip.active && flipCompress < 0.995) {
          for (let v = 0; v < 6; v++) {
            const vx = HEX_VERTS[v][0] * drawR;
            const vy = HEX_VERTS[v][1] * drawR;
            // Project onto flip axis, compress perpendicular component, rotate back
            const along = vx * FLIP_COS + vy * FLIP_SIN;
            const perp = (-vx * FLIP_SIN + vy * FLIP_COS) * flipCompress;
            const px = cx + along * FLIP_COS - perp * FLIP_SIN;
            const py = cy + along * FLIP_SIN + perp * FLIP_COS;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else {
          for (let v = 0; v < 6; v++) {
            const px = cx + HEX_VERTS[v][0] * drawR;
            const py = cy + HEX_VERTS[v][1] * drawR;
            if (v === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.closePath();

        ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${tileTheme.fillAlpha})`;
        ctx.fill();

        const edgeAlpha = Math.min(
          0.85,
          tileTheme.strokeAlpha +
            Math.max(0, combinedWave) * 0.14 +
            rippleHighlight * 0.35 +
            flipGlint * 0.4,
        );
        ctx.strokeStyle = `rgba(${tileTheme.stroke[0]}, ${tileTheme.stroke[1]}, ${tileTheme.stroke[2]}, ${edgeAlpha})`;
        ctx.lineWidth = rippleHighlight > 0.15 || flipGlint > 0.1 ? 1.25 : 0.9;
        ctx.stroke();
      }
    };

    redrawOnceRef.current = () => {
      drawFrame(performance.now());
    };

    let rafId = 0;
    let isRunning = false;
    let lastDrawAt = 0;

    const tick = (nowMs: number) => {
      if (!isRunning) return;
      const activeInteraction =
        flipStateRef.current.active || ripplesRef.current.length > 0;
      const minInterval = activeInteraction ? 14 : 34;
      if (nowMs - lastDrawAt >= minInterval) {
        lastDrawAt = nowMs;
        drawFrame(nowMs);
      }
      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        isRunning = false;
      }
    };

    const startLoop = () => {
      if (reducedMotion) {
        drawFrame(performance.now());
        return;
      }
      if (!isRunning && document.visibilityState === 'visible') {
        isRunning = true;
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      isRunning = false;
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const handleResize = () => {
      buildGrid();
      drawFrame(performance.now());
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startLoop();
      } else {
        stopLoop();
      }
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      stopLoop();
      startLoop();
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotionMq?.addEventListener('change', handleReducedMotionChange);

    startLoop();

    return () => {
      stopLoop();
      redrawOnceRef.current = null;
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      reducedMotionMq?.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
    />
  );
};
