'use client';

import { useCallback, useEffect, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number; // depth: 0 = screen plane, positive = further away (world space)
  vx: number;
  vy: number;
  vz: number;
  radius: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface PlexusBackgroundProps {
  className?: string;
  onQuoteChange?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const CONNECTION_DIST = 120;
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
const MOUSE_REPULSE_RADIUS = 120;
const MOUSE_REPULSE_RADIUS_SQ = MOUSE_REPULSE_RADIUS * MOUSE_REPULSE_RADIUS;
const MOUSE_REPULSE_FORCE = 2;
const PARTICLE_SPEED = 0.3;
const PARTICLE_RADIUS_MIN = 0.5;
const PARTICLE_RADIUS_MAX = 2.5;
const RIPPLE_SPEED = 3;
const RIPPLE_MAX_RADIUS = 150;
const RIPPLE_SCATTER_RADIUS = 120;
const RIPPLE_SCATTER_FORCE = 4;
const DPR_CAP = 1.5;
const MAX_RIPPLES = 3;

function particleCount(w: number, h: number): number {
  const area = w * h;
  const refArea = 1920 * 1080;
  return Math.round(Math.min(300, Math.max(100, 250 * (area / refArea))));
}

// =============================================================================
// Pattern generators (pre-computed at init, not per-frame)
// =============================================================================

const FRACTAL_LERP_SPEED = 3.0;
const FRACTAL_SCALE = 0.35;
const FRACTAL_SPIN_SPEED = 0.15;
const MICRO_JITTER = 0.3;
const Z_NEAR = 0;
const Z_FAR = 500; // max depth
const PERSPECTIVE = 600; // focal length — lower = more dramatic 3D
const Z_CONNECTION_MAX = 150; // max z gap for connections (avoids cross-layer links)

// --- Helpers ---

function normalize(pts: Point2D[]): Point2D[] {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  return pts.map((p) => ({ x: ((p.x - cx) / span) * 2, y: ((p.y - cy) / span) * 2 }));
}

function sampleAlongPath(path: Point2D[], n: number): Point2D[] {
  if (path.length < 2 || n <= 0) return [];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return Array.from({ length: n }, () => ({ ...path[0] }));
  const pts: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    let acc = 0;
    for (let j = 0; j < segLens.length; j++) {
      if (acc + segLens[j] >= d || j === segLens.length - 1) {
        const t = segLens[j] > 0 ? (d - acc) / segLens[j] : 0;
        pts.push({
          x: path[j].x + (path[j + 1].x - path[j].x) * t,
          y: path[j].y + (path[j + 1].y - path[j].y) * t,
        });
        break;
      }
      acc += segLens[j];
    }
  }
  return pts;
}

function sampleMultiPath(paths: Point2D[][], n: number): Point2D[] {
  const lens: number[] = [];
  let total = 0;
  for (const path of paths) {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    lens.push(len);
    total += len;
  }
  if (total === 0) return [];
  const pts: Point2D[] = [];
  let remaining = n;
  for (let i = 0; i < paths.length; i++) {
    const count =
      i === paths.length - 1 ? remaining : Math.max(2, Math.round((n * lens[i]) / total));
    const actual = Math.min(count, remaining);
    if (actual > 0) {
      pts.push(...sampleAlongPath(paths[i], actual));
      remaining -= actual;
    }
    if (remaining <= 0) break;
  }
  return pts;
}

// --- Fractals ---

function generateSierpinski(n: number): Point2D[] {
  const verts: Point2D[] = [
    { x: 0, y: -1 },
    { x: -Math.sqrt(3) / 2, y: 0.5 },
    { x: Math.sqrt(3) / 2, y: 0.5 },
  ];
  const pts: Point2D[] = [];
  let x = 0,
    y = 0;
  for (let i = 0; i < n + 20; i++) {
    const v = verts[Math.floor(Math.random() * 3)];
    x = (x + v.x) / 2;
    y = (y + v.y) / 2;
    if (i >= 20) pts.push({ x, y });
  }
  return normalize(pts);
}

function generateBarnsleyFern(n: number): Point2D[] {
  const pts: Point2D[] = [];
  let x = 0,
    y = 0;
  for (let i = 0; i < n + 20; i++) {
    const r = Math.random();
    let nx: number, ny: number;
    if (r < 0.01) {
      nx = 0;
      ny = 0.16 * y;
    } else if (r < 0.86) {
      nx = 0.85 * x + 0.04 * y;
      ny = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      nx = 0.2 * x - 0.26 * y;
      ny = 0.23 * x + 0.22 * y + 1.6;
    } else {
      nx = -0.15 * x + 0.28 * y;
      ny = 0.26 * x + 0.24 * y + 0.44;
    }
    x = nx;
    y = ny;
    if (i >= 20) pts.push({ x, y });
  }
  return normalize(pts);
}

function generateKochSnowflake(n: number): Point2D[] {
  function subdivide(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    depth: number,
    out: Point2D[],
  ) {
    if (depth === 0) {
      out.push({ x: ax, y: ay });
      return;
    }
    const dx = bx - ax,
      dy = by - ay;
    const p1x = ax + dx / 3,
      p1y = ay + dy / 3;
    const p2x = ax + (2 * dx) / 3,
      p2y = ay + (2 * dy) / 3;
    const peakX = (ax + bx) / 2 - (dy * Math.sqrt(3)) / 6;
    const peakY = (ay + by) / 2 + (dx * Math.sqrt(3)) / 6;
    subdivide(ax, ay, p1x, p1y, depth - 1, out);
    subdivide(p1x, p1y, peakX, peakY, depth - 1, out);
    subdivide(peakX, peakY, p2x, p2y, depth - 1, out);
    subdivide(p2x, p2y, bx, by, depth - 1, out);
  }
  const tri: Point2D[] = [
    { x: 0, y: -1 },
    { x: Math.sqrt(3) / 2, y: 0.5 },
    { x: -Math.sqrt(3) / 2, y: 0.5 },
  ];
  const curve: Point2D[] = [];
  for (let i = 0; i < 3; i++) {
    const a = tri[i],
      b = tri[(i + 1) % 3];
    subdivide(a.x, a.y, b.x, b.y, 4, curve);
  }
  const pts: Point2D[] = [];
  const total = curve.length;
  for (let i = 0; i < n; i++) {
    pts.push(curve[Math.floor((i / n) * total) % total]);
  }
  return normalize(pts);
}

function generateDragonCurve(n: number): Point2D[] {
  const turns: number[] = [];
  for (let iter = 0; iter < 14; iter++) {
    const prev = [...turns];
    turns.push(1);
    for (let i = prev.length - 1; i >= 0; i--) {
      turns.push(prev[i] === 1 ? -1 : 1);
    }
  }
  const dirs = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let dir = 0,
    x = 0,
    y = 0;
  const path: Point2D[] = [{ x, y }];
  for (const turn of turns) {
    dir = (((dir + turn) % 4) + 4) % 4;
    x += dirs[dir][0];
    y += dirs[dir][1];
    path.push({ x, y });
  }
  const pts: Point2D[] = [];
  const total = path.length;
  for (let i = 0; i < n; i++) {
    pts.push(path[Math.floor((i / n) * total) % total]);
  }
  return normalize(pts);
}

// --- Tribal: Spiral ---

function generateSpiral(n: number): Point2D[] {
  const pts: Point2D[] = [];
  const turns = 3;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * turns * Math.PI * 2;
    const r = 0.05 + 0.95 * (t / (turns * Math.PI * 2));
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
  }
  return normalize(pts);
}

// --- Tribal: Sun Wheel ---

function generateSunWheel(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  const ring: Point2D[] = [];
  for (let i = 0; i <= 50; i++) {
    const a = (i / 50) * Math.PI * 2;
    ring.push({ x: 0.9 * Math.cos(a), y: 0.9 * Math.sin(a) });
  }
  paths.push(ring);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    paths.push([
      { x: 0.15 * Math.cos(a), y: 0.15 * Math.sin(a) },
      { x: 0.85 * Math.cos(a), y: 0.85 * Math.sin(a) },
    ]);
  }
  return normalize(sampleMultiPath(paths, n));
}

// --- Mesopotamian: Star of Ishtar (8-pointed star) ---

function generateIshtarStar(n: number): Point2D[] {
  const path: Point2D[] = [];
  for (let i = 0; i <= 16; i++) {
    const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 1.0 : 0.38;
    path.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return normalize(sampleAlongPath(path, n));
}

// --- Egyptian: Ankh ---

function generateAnkh(n: number): Point2D[] {
  const loop: Point2D[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    loop.push({ x: 0.3 * Math.cos(a), y: -0.55 + 0.35 * Math.sin(a) });
  }
  const stem: Point2D[] = [
    { x: 0, y: -0.2 },
    { x: 0, y: 1.0 },
  ];
  const cross: Point2D[] = [
    { x: -0.4, y: 0.1 },
    { x: 0.4, y: 0.1 },
  ];
  return normalize(sampleMultiPath([loop, stem, cross], n));
}

// --- Zoroastrian: Faravahar (winged sun disc) ---

function generateFaravahar(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  const disc: Point2D[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    disc.push({ x: 0.12 * Math.cos(a), y: 0.12 * Math.sin(a) });
  }
  paths.push(disc);
  for (let layer = 0; layer < 3; layer++) {
    const r = 0.35 + layer * 0.22;
    const sweep = 0.7 + layer * 0.2;
    const yOff = layer * 0.06;
    const left: Point2D[] = [];
    const right: Point2D[] = [];
    for (let i = 0; i <= 25; i++) {
      const t = i / 25;
      const a = Math.PI - sweep + t * sweep;
      left.push({ x: -0.15 + r * Math.cos(a), y: yOff + r * Math.sin(a) * 0.35 });
      const a2 = sweep - t * sweep;
      right.push({ x: 0.15 + r * Math.cos(a2), y: yOff + r * Math.sin(a2) * 0.35 });
    }
    paths.push(left, right);
  }
  paths.push(
    [
      { x: 0, y: -0.15 },
      { x: 0, y: -0.6 },
    ],
    [
      { x: -0.05, y: -0.15 },
      { x: -0.2, y: -0.55 },
    ],
    [
      { x: 0.05, y: -0.15 },
      { x: 0.2, y: -0.55 },
    ],
  );
  return normalize(sampleMultiPath(paths, n));
}

// --- Music: Treble Clef ---

function generateTrebleClef(n: number): Point2D[] {
  const path: Point2D[] = [];
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let x: number, y: number;
    if (t < 0.2) {
      const a = (t / 0.2) * Math.PI * 1.5 + Math.PI * 0.5;
      x = 0.2 * Math.cos(a);
      y = 0.65 + 0.18 * Math.sin(a);
    } else if (t < 0.6) {
      const s = (t - 0.2) / 0.4;
      x = 0.18 * Math.sin(s * Math.PI);
      y = 0.65 - s * 1.5;
    } else if (t < 0.8) {
      const a = ((t - 0.6) / 0.2) * Math.PI * 1.5;
      x = -0.22 * Math.sin(a);
      y = -0.85 + 0.18 * (1 - Math.cos(a));
    } else {
      const s = (t - 0.8) / 0.2;
      x = -0.1 * (1 - s);
      y = -0.5 + s * 0.3;
    }
    path.push({ x, y });
  }
  return normalize(sampleAlongPath(path, n));
}

// --- Music: Eighth Notes ---

function generateEighthNotes(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  for (const sx of [-0.3, 0.3]) {
    const head: Point2D[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      head.push({ x: sx + 0.15 * Math.cos(a) * 1.3, y: 0.7 + 0.1 * Math.sin(a) });
    }
    paths.push(head);
    paths.push([
      { x: sx + 0.18, y: 0.7 },
      { x: sx + 0.18, y: -0.5 },
    ]);
  }
  paths.push([
    { x: -0.12, y: -0.5 },
    { x: 0.48, y: -0.7 },
  ]);
  return normalize(sampleMultiPath(paths, n));
}

// --- Greek: Phi (φ) ---

function generatePhi(n: number): Point2D[] {
  const line: Point2D[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];
  const oval: Point2D[] = [];
  for (let i = 0; i <= 50; i++) {
    const a = (i / 50) * Math.PI * 2;
    oval.push({ x: 0.55 * Math.cos(a), y: 0.35 * Math.sin(a) });
  }
  return normalize(sampleMultiPath([line, oval], n));
}

// --- Greek: Omega (Ω) ---

function generateOmega(n: number): Point2D[] {
  const arc: Point2D[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = Math.PI * 0.15 + (i / 60) * Math.PI * 1.7;
    arc.push({ x: 0.6 * Math.cos(a), y: -0.5 * Math.sin(a) });
  }
  const lFoot: Point2D[] = [arc[0], { x: arc[0].x - 0.25, y: arc[0].y }];
  const last = arc[arc.length - 1];
  const rFoot: Point2D[] = [last, { x: last.x + 0.25, y: last.y }];
  return normalize(sampleMultiPath([lFoot, arc, rFoot], n));
}

// --- Eastern: Yin-Yang ---

function generateYinYang(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  const outer: Point2D[] = [];
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    outer.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  paths.push(outer);
  const upper: Point2D[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = Math.PI / 2 + (i / 30) * Math.PI;
    upper.push({ x: 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) });
  }
  paths.push(upper);
  const lower: Point2D[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = -Math.PI / 2 + (i / 30) * Math.PI;
    lower.push({ x: 0.5 * Math.cos(a), y: -0.5 + 0.5 * Math.sin(a) });
  }
  paths.push(lower);
  for (const cy of [0.5, -0.5]) {
    const dot: Point2D[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      dot.push({ x: 0.12 * Math.cos(a), y: cy + 0.12 * Math.sin(a) });
    }
    paths.push(dot);
  }
  return normalize(sampleMultiPath(paths, n));
}

// --- Celtic: Triquetra (Trinity Knot) ---

function generateTriquetra(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  const r = 0.6;
  for (let k = 0; k < 3; k++) {
    const ca = (k / 3) * Math.PI * 2 - Math.PI / 2;
    const cx = r * 0.35 * Math.cos(ca);
    const cy = r * 0.35 * Math.sin(ca);
    const arc: Point2D[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      arc.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    paths.push(arc);
  }
  return normalize(sampleMultiPath(paths, n));
}

// --- Pythagorean: Pentagram ---

function generatePentagram(n: number): Point2D[] {
  const verts: Point2D[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    verts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  const path = [verts[0], verts[2], verts[4], verts[1], verts[3], verts[0]];
  return normalize(sampleAlongPath(path, n));
}

// --- Sacred Geometry: Flower of Life ---

function generateFlowerOfLife(n: number): Point2D[] {
  const paths: Point2D[][] = [];
  const r = 0.35;
  const makeCircle = (cx: number, cy: number): Point2D[] => {
    const c: Point2D[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      c.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return c;
  };
  paths.push(makeCircle(0, 0));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    paths.push(makeCircle(r * Math.cos(a), r * Math.sin(a)));
  }
  return normalize(sampleMultiPath(paths, n));
}

// --- All patterns ---

const FRACTALS = [
  generateSierpinski,
  generateBarnsleyFern,
  generateKochSnowflake,
  generateDragonCurve,
  generateSpiral,
  generateSunWheel,
  generateIshtarStar,
  generateAnkh,
  generateFaravahar,
  generateTrebleClef,
  generateEighthNotes,
  generatePhi,
  generateOmega,
  generateYinYang,
  generateTriquetra,
  generatePentagram,
  generateFlowerOfLife,
];

// =============================================================================
// Component
// =============================================================================

export function PlexusBackground({ className = '', onQuoteChange }: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const channelRef = useRef('255, 255, 255,');
  const isDarkRef = useRef(true);
  const onQuoteChangeRef = useRef(onQuoteChange);
  onQuoteChangeRef.current = onQuoteChange;

  // ---- Helpers ----

  const initParticles = useCallback((w: number, h: number): Particle[] => {
    const count = particleCount(w, h);
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const z = Z_NEAR + Math.random() * Z_FAR;
      // World-space coords centered at (0,0). 1.5× spread ensures coverage at all depths.
      particles.push({
        id: i,
        x: (Math.random() - 0.5) * w * 1.5,
        y: (Math.random() - 0.5) * h * 1.5,
        z,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        vz: (Math.random() - 0.5) * 10,
        radius: PARTICLE_RADIUS_MIN + Math.random() * (PARTICLE_RADIUS_MAX - PARTICLE_RADIUS_MIN),
      });
    }
    return particles;
  }, []);

  // ---- Main effect ----

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let reducedMotion = false;
    let fractalIndex = -1;
    let fractalTargets: Point2D[] = [];
    let fractalTimer = 0;
    let rotationAngle = 0;
    let lastTime = 0;

    const FRACTAL_INTERVAL = 8.0;

    const advanceFractal = () => {
      fractalIndex = (fractalIndex + 1) % FRACTALS.length;
      fractalTargets = FRACTALS[fractalIndex](particlesRef.current.length);
      fractalTimer = 0;
      onQuoteChangeRef.current?.();
    };

    // -- Theme detection --
    const checkDarkMode = () => document.documentElement.classList.contains('dark');
    const updateTheme = (dark: boolean) => {
      isDarkRef.current = dark;
      channelRef.current = dark ? '255, 255, 255,' : '0, 0, 0,';
    };
    updateTheme(checkDarkMode());

    const themeObserver = new MutationObserver(() => updateTheme(checkDarkMode()));
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // -- Reduced motion --
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = motionQuery.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', onMotionChange);

    // -- Resize --
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = initParticles(width, height);
      ripplesRef.current = [];
      lastTime = 0;
      advanceFractal();
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    // -- Visibility --
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const onVisChange = () => {
      if (document.hidden) visible = false;
    };
    document.addEventListener('visibilitychange', onVisChange);

    // -- Mouse --
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onPointerLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    // -- Click --
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const halfW = width / 2;
      const halfH = height / 2;

      // Add ripple (screen space)
      if (ripplesRef.current.length < MAX_RIPPLES) {
        ripplesRef.current.push({
          x: clickX,
          y: clickY,
          radius: 0,
          maxRadius: RIPPLE_MAX_RADIUS,
          life: 1,
        });
      }

      // Scatter nearby particles (compare in projected screen space)
      for (const p of particlesRef.current) {
        const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
        const sx = halfW + p.x * scale;
        const sy = halfH + p.y * scale;
        const dx = sx - clickX;
        const dy = sy - clickY;
        const distSq = dx * dx + dy * dy;
        if (distSq < RIPPLE_SCATTER_RADIUS * RIPPLE_SCATTER_RADIUS && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = RIPPLE_SCATTER_FORCE * (1 - dist / RIPPLE_SCATTER_RADIUS);
          // Apply force in world space (divide by scale so far particles move enough)
          p.vx += ((dx / dist) * force) / scale;
          p.vy += ((dy / dist) * force) / scale;
        }
      }

      // Cycle to next fractal (resets auto-timer)
      advanceFractal();
    };
    canvas.addEventListener('click', onClick);

    // -- Animation loop --
    let drewStaticFrame = false;
    // Projection cache: screen coords + scale for each particle
    const proj: { sx: number; sy: number; scale: number }[] = [];

    const frame = (now: number) => {
      rafRef.current = requestAnimationFrame(frame);

      if (!visible) {
        lastTime = now;
        return;
      }

      if (reducedMotion) {
        if (drewStaticFrame) return;
        drewStaticFrame = true;
      } else {
        drewStaticFrame = false;
      }

      const particles = particlesRef.current;
      const ripples = ripplesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const ch = channelRef.current;
      const dt = lastTime === 0 ? 1 / 60 : Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const halfW = width / 2;
      const halfH = height / 2;

      // Auto-advance fractal
      fractalTimer += dt;
      if (fractalTimer >= FRACTAL_INTERVAL) {
        advanceFractal();
      }

      ctx.clearRect(0, 0, width, height);

      // --- Update particles (world space) ---
      if (!reducedMotion) {
        for (const p of particles) {
          // Mouse repulsion: project particle to screen, compare with mouse
          const pScale = PERSPECTIVE / (PERSPECTIVE + p.z);
          const sx = halfW + p.x * pScale;
          const sy = halfH + p.y * pScale;
          const dmx = sx - mx;
          const dmy = sy - my;
          const mdSq = dmx * dmx + dmy * dmy;
          if (mdSq < MOUSE_REPULSE_RADIUS_SQ && mdSq > 0) {
            const md = Math.sqrt(mdSq);
            const force = MOUSE_REPULSE_FORCE * (1 - md / MOUSE_REPULSE_RADIUS);
            // Apply in world space (divide by scale so far particles move enough)
            p.vx += ((dmx / md) * force) / pScale;
            p.vy += ((dmy / md) * force) / pScale;
          }

          // Damping
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.vz *= 0.98;

          p.x += p.vx;
          p.y += p.vy;
          p.z += p.vz;

          // Clamp z and bounce
          if (p.z < Z_NEAR) {
            p.z = Z_NEAR;
            p.vz = Math.abs(p.vz) * 0.5;
          } else if (p.z > Z_FAR) {
            p.z = Z_FAR;
            p.vz = -Math.abs(p.vz) * 0.5;
          }
        }
      }

      // --- Fractal formation (world space — projection handles depth) ---
      if (!reducedMotion && fractalTargets.length > 0) {
        rotationAngle += FRACTAL_SPIN_SPEED * dt;
        const cosA = Math.cos(rotationAngle);
        const sinA = Math.sin(rotationAngle);
        const sc = Math.min(width, height) * FRACTAL_SCALE;
        const t = 1 - Math.exp(-FRACTAL_LERP_SPEED * dt);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const tgt = fractalTargets[p.id % fractalTargets.length];
          // Rotate target around origin (world space)
          const rx = tgt.x * cosA - tgt.y * sinA;
          const ry = tgt.x * sinA + tgt.y * cosA;
          // Per-particle micro-jitter
          const phase = p.id * 2.399 + now * 0.002;
          const jx = Math.sin(phase) * MICRO_JITTER;
          const jy = Math.cos(phase * 1.37) * MICRO_JITTER;
          // Target in world space (centered at 0,0). NO pScale here —
          // the perspective projection at render time handles the 3D effect.
          p.x += (rx * sc + jx - p.x) * t;
          p.y += (ry * sc + jy - p.y) * t;
          // Lerp z towards a deterministic depth band
          const targetZ = (((p.id * 137) % 1000) / 1000) * Z_FAR;
          p.z += (targetZ - p.z) * t * 0.3;
          p.vx *= 0.9;
          p.vy *= 0.9;
          p.vz *= 0.9;
        }
      }

      // --- Project all particles: world → screen ---
      proj.length = particles.length;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const scale = PERSPECTIVE / (PERSPECTIVE + p.z);
        proj[i] = {
          sx: halfW + p.x * scale,
          sy: halfH + p.y * scale,
          scale,
        };
      }

      // --- Draw connections (projected screen positions + z proximity) ---
      const bands: [number, number][][] = [[], [], []];
      for (let i = 0; i < particles.length; i++) {
        const pa = proj[i];
        const za = particles[i].z;
        for (let j = i + 1; j < particles.length; j++) {
          // Skip if too far apart in depth
          const dz = Math.abs(za - particles[j].z);
          if (dz > Z_CONNECTION_MAX) continue;
          const pb = proj[j];
          const dx = pa.sx - pb.sx;
          const dy = pa.sy - pb.sy;
          const dSq = dx * dx + dy * dy;
          if (dSq < CONNECTION_DIST_SQ) {
            const ratio = 1 - Math.sqrt(dSq) / CONNECTION_DIST;
            const avgScale = (pa.scale + pb.scale) / 2;
            const adjusted = ratio * avgScale;
            const band = adjusted < 0.1 ? 0 : adjusted < 0.3 ? 1 : 2;
            bands[band].push([i, j]);
          }
        }
      }

      const bandAlphas = [0.05, 0.12, 0.25];
      for (let b = 0; b < 3; b++) {
        const lines = bands[b];
        if (lines.length === 0) continue;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${ch} ${bandAlphas[b]})`;
        ctx.lineWidth = 0.5;
        for (const [i, j] of lines) {
          ctx.moveTo(proj[i].sx, proj[i].sy);
          ctx.lineTo(proj[j].sx, proj[j].sy);
        }
        ctx.stroke();
      }

      // --- Draw particle glow (projected) ---
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const { sx, sy, scale } = proj[i];
        const gr = (4 + 5 * scale) * scale;
        const glowAlpha = 0.15 + scale * 0.25;
        const color = p.id % 2 === 0 ? '59, 130, 246' : '245, 158, 11';
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
        grad.addColorStop(0, `rgba(${color}, ${glowAlpha})`);
        grad.addColorStop(1, `rgba(${color}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(sx - gr, sy - gr, gr * 2, gr * 2);
      }

      // --- Draw particles (sorted back-to-front, projected) ---
      const sortedIdx = Array.from({ length: particles.length }, (_, i) => i).sort(
        (a, b) => particles[b].z - particles[a].z,
      );
      for (const i of sortedIdx) {
        const p = particles[i];
        const { sx, sy, scale } = proj[i];
        const alpha = 0.2 + scale * 0.6;
        const r = p.radius * scale;
        ctx.fillStyle = `rgba(${ch} ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Draw & update ripples (screen space) ---
      if (!reducedMotion) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += RIPPLE_SPEED;
          r.life = 1 - r.radius / r.maxRadius;
          if (r.life <= 0) {
            ripples.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${ch} ${r.life * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    rafRef.current = requestAnimationFrame(frame);

    // -- Cleanup --
    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisChange);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click', onClick);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ touchAction: 'manipulation' }}
    />
  );
}
