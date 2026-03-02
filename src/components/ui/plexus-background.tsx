'use client';

import { useCallback, useEffect, useRef } from 'react';

// =============================================================================
// Interfaces
// =============================================================================

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  twinkleSpeed: number;
  twinklePhase: number;
  twinkleMin: number;
  twinkleMax: number;
  radius: number;
  baseRadius: number;
  id: number;
  layer: 'distant' | 'medium' | 'foreground';
  depth: number;
  colorTint: { r: number; g: number; b: number };
  hexColor: string;
  shape: ParticleShape;
  life: number;
  maxLife: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trailLength: number;
  brightness: number;
}

interface WaveEmitter {
  baseFracX: number;
  baseFracY: number;
  x: number;
  y: number;
  wavelength: number;
  period: number;
  phase: number;
  radialAmplitude: number;
  tangentialAmplitude: number;
  decayAlpha: number;
  flarePeriod: number;
  flarePhase: number;
  flareBaseLevel: number;
  flarePeakLevel: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

type GalaxyState = 'drifting' | 'collapsing' | 'shape_forming' | 'expanding';

// =============================================================================
// Particle Shapes
// =============================================================================

type ParticleShape = 'circle' | 'diamond' | 'triangle' | 'square' | 'hexagon';

type ShapeDrawFn = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => void;

// Step 1: Precomputed trig constants for triangle and hexagon
const TRI_COS = Math.cos(Math.PI / 6);
const TRI_SIN = Math.sin(Math.PI / 6);
const HEX_VERTICES: Array<{ cos: number; sin: number }> = [];
for (let i = 0; i < 6; i++) {
  const angle = (Math.PI / 3) * i - Math.PI / 2;
  HEX_VERTICES.push({ cos: Math.cos(angle), sin: Math.sin(angle) });
}

const SHAPE_DRAW: Record<ParticleShape, ShapeDrawFn> = {
  circle: (ctx, x, y, r) => {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  },
  diamond: (ctx, x, y, r) => {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
  },
  triangle: (ctx, x, y, r) => {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * TRI_COS, y + r * TRI_SIN);
    ctx.lineTo(x - r * TRI_COS, y + r * TRI_SIN);
    ctx.closePath();
  },
  square: (ctx, x, y, r) => {
    const s = r * 0.85;
    ctx.rect(x - s, y - s, s * 2, s * 2);
  },
  hexagon: (ctx, x, y, r) => {
    const v0 = HEX_VERTICES[0];
    ctx.moveTo(x + r * v0.cos, y + r * v0.sin);
    for (let i = 1; i < 6; i++) {
      const v = HEX_VERTICES[i];
      ctx.lineTo(x + r * v.cos, y + r * v.sin);
    }
    ctx.closePath();
  },
};

const SHAPE_WEIGHTS: { shape: ParticleShape; weight: number }[] = [
  { shape: 'circle', weight: 50 },
  { shape: 'diamond', weight: 15 },
  { shape: 'triangle', weight: 12 },
  { shape: 'square', weight: 12 },
  { shape: 'hexagon', weight: 11 },
];

function pickRandomShape(): ParticleShape {
  const total = SHAPE_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let roll = Math.random() * total;
  for (const { shape, weight } of SHAPE_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return shape;
  }
  return 'circle';
}

// =============================================================================
// Spatial Grid Partitioning (Step 5: flat array grid)
// =============================================================================

interface FlatSpatialGrid {
  cells: (Particle[] | null)[];
  cols: number;
  rows: number;
  cellSize: number;
}

const buildSpatialGrid = (
  particles: Particle[],
  cellSize: number,
  width: number,
  height: number,
): FlatSpatialGrid => {
  const cols = Math.ceil(width / cellSize) + 2;
  const rows = Math.ceil(height / cellSize) + 2;
  const cells = new Array<Particle[] | null>(cols * rows).fill(null);
  for (const particle of particles) {
    const cx = Math.max(0, Math.min(Math.floor(particle.x / cellSize), cols - 1));
    const cy = Math.max(0, Math.min(Math.floor(particle.y / cellSize), rows - 1));
    const idx = cy * cols + cx;
    if (cells[idx] === null) cells[idx] = [particle];
    else cells[idx]!.push(particle);
  }
  return { cells, cols, rows, cellSize };
};

// =============================================================================
// Batched Line Drawing
// =============================================================================

const OPACITY_BANDS = 5;
const MAX_LINE_OPACITY = 0.3;

const getOpacityBand = (opacity: number): number =>
  Math.min(Math.floor((opacity / MAX_LINE_OPACITY) * OPACITY_BANDS), OPACITY_BANDS - 1);

// =============================================================================
// Constants
// =============================================================================

const COLLAPSE_DURATION = 1500;
const EXPAND_DURATION = 1200;

const SHAPE_NAMES = ['sphere', 'cube', 'pyramid', 'torus', 'helix', 'brain'] as const;
type ShapeName = (typeof SHAPE_NAMES)[number];
const SHAPE_CYCLE_DURATION = 8000;
const SHAPE_TRANSITION_DURATION = 2000;
const SHAPE_SPRING_STIFFNESS = 0.02;
const SHAPE_SPRING_DAMPING = 0.9;
const SHAPE_ROTATION_SPEED_Y = 0.3;
const SHAPE_ROTATION_SPEED_X = 0.15;

const HINT_DELAY_MS = 12000;
const HINT_PULSE_DURATION_MS = 400;
const HINT_PULSE_STRENGTH = 0.015;

// Step 9: Pre-computed squared radii
const REPULSE_RADIUS = 60;
const REPULSE_RADIUS_SQ = REPULSE_RADIUS * REPULSE_RADIUS;
const REPULSE_STRENGTH = 0.002;
const MOUSE_INTERACT_DIST = 200;
const MOUSE_INTERACT_DIST_SQ = MOUSE_INTERACT_DIST * MOUSE_INTERACT_DIST;

const EMITTER_CONFIGS = [
  {
    fracX: 0.5,
    fracY: 0.5,
    period: 8,
    wavelengthFrac: 0.25,
    flarePeriod: 12,
    radialAmp: 0.043,
    tangentialAmp: 0.023,
    decayAlpha: 1.5,
    flareBase: 0.3,
    flarePeak: 0.7,
    orbitRadiusFrac: 0.04,
    orbitSpeed: 0.15,
    phase: 0,
    flarePhase: 0,
    orbitPhase: 0,
  },
  {
    fracX: 0.25,
    fracY: 0.3,
    period: 11,
    wavelengthFrac: 0.2,
    flarePeriod: 17,
    radialAmp: 0.034,
    tangentialAmp: 0.029,
    decayAlpha: 1.8,
    flareBase: 0.25,
    flarePeak: 0.75,
    orbitRadiusFrac: 0.035,
    orbitSpeed: 0.12,
    phase: Math.PI * 0.7,
    flarePhase: Math.PI * 0.5,
    orbitPhase: Math.PI * 0.3,
  },
  {
    fracX: 0.75,
    fracY: 0.7,
    period: 15,
    wavelengthFrac: 0.33,
    flarePeriod: 21,
    radialAmp: 0.029,
    tangentialAmp: 0.017,
    decayAlpha: 1.2,
    flareBase: 0.35,
    flarePeak: 0.65,
    orbitRadiusFrac: 0.045,
    orbitSpeed: 0.1,
    phase: Math.PI * 1.3,
    flarePhase: Math.PI * 1.1,
    orbitPhase: Math.PI * 0.8,
  },
  {
    fracX: 0.8,
    fracY: 0.2,
    period: 7,
    wavelengthFrac: 0.15,
    flarePeriod: 10,
    radialAmp: 0.051,
    tangentialAmp: 0.034,
    decayAlpha: 2.0,
    flareBase: 0.2,
    flarePeak: 0.8,
    orbitRadiusFrac: 0.03,
    orbitSpeed: 0.18,
    phase: Math.PI * 0.4,
    flarePhase: Math.PI * 1.7,
    orbitPhase: Math.PI * 1.5,
  },
];

// =============================================================================
// Helpers
// =============================================================================

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function assignStarColorTint(isDark: boolean): { r: number; g: number; b: number } {
  if (!isDark) return { r: 0, g: 0, b: 0 };
  const roll = Math.random();
  if (roll < 0.85) return { r: 255, g: 255, b: 255 };
  if (roll < 0.95) return { r: 200, g: 220, b: 255 };
  return { r: 255, g: 220, b: 180 };
}

// Step 2: Convert color tint to hex string
function colorTintToHex(c: { r: number; g: number; b: number }): string {
  return '#' + ((1 << 24) | (c.r << 16) | (c.g << 8) | c.b).toString(16).slice(1);
}

// Step 8: Pre-computed per-emitter wave data (hoisted out of particle loop)
interface PrecomputedWave {
  x: number;
  y: number;
  k: number;
  omegaTimeSec: number;
  phase: number;
  radialAmplitude: number;
  tangentialAmplitude: number;
  decayAlphaOverMaxDist: number;
  envelope: number;
}

function precomputeWaveData(
  emitters: WaveEmitter[],
  timeSec: number,
  maxDist: number,
): PrecomputedWave[] {
  const result: PrecomputedWave[] = [];
  for (const e of emitters) {
    const k = (2 * Math.PI) / e.wavelength;
    const omega = (2 * Math.PI) / e.period;
    const omegaFlare = (2 * Math.PI) / e.flarePeriod;
    const halfSin = 0.5 + 0.5 * Math.sin(omegaFlare * timeSec + e.flarePhase);
    const envelope = e.flareBaseLevel + e.flarePeakLevel * halfSin * halfSin;
    result.push({
      x: e.x,
      y: e.y,
      k,
      omegaTimeSec: omega * timeSec,
      phase: e.phase,
      radialAmplitude: e.radialAmplitude,
      tangentialAmplitude: e.tangentialAmplitude,
      decayAlphaOverMaxDist: e.decayAlpha / maxDist,
      envelope,
    });
  }
  return result;
}

function computeWaveForcePrecomputed(
  pw: PrecomputedWave,
  px: number,
  py: number,
): { fx: number; fy: number } {
  const dx = px - pw.x;
  const dy = py - pw.y;
  const distSq = dx * dx + dy * dy;
  if (distSq < 1) return { fx: 0, fy: 0 };

  const dist = Math.sqrt(distSq);
  const invDist = 1 / dist;
  const radialX = dx * invDist;
  const radialY = dy * invDist;
  const tangentialX = -dy * invDist;
  const tangentialY = dx * invDist;

  const theta = pw.k * dist - pw.omegaTimeSec + pw.phase;
  const decay = Math.exp(-pw.decayAlphaOverMaxDist * dist);

  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const fr = pw.radialAmplitude * pw.envelope * sinTheta * decay;
  const ft = pw.tangentialAmplitude * pw.envelope * cosTheta * decay;

  return {
    fx: fr * radialX + ft * tangentialX,
    fy: fr * radialY + ft * tangentialY,
  };
}

// Step 3: Glow sprite cache (one white, one black)
let glowSpriteWhite: HTMLCanvasElement | null = null;
let glowSpriteBlack: HTMLCanvasElement | null = null;

function createGlowSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function getGlowSprite(isDark: boolean): HTMLCanvasElement {
  if (isDark) {
    if (!glowSpriteWhite) glowSpriteWhite = createGlowSprite(255, 255, 255);
    return glowSpriteWhite;
  }
  if (!glowSpriteBlack) glowSpriteBlack = createGlowSprite(0, 0, 0);
  return glowSpriteBlack;
}

// =============================================================================
// Nebula Buffer
// =============================================================================

function createNebulaBuffer(width: number, height: number, isDark: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const blobs = isDark
    ? [
        { x: 0.25, y: 0.3, r: 0.35, color: [100, 50, 150], opacity: 0.03 },
        { x: 0.75, y: 0.25, r: 0.3, color: [50, 80, 150], opacity: 0.025 },
        { x: 0.5, y: 0.75, r: 0.4, color: [150, 100, 50], opacity: 0.02 },
        { x: 0.8, y: 0.6, r: 0.25, color: [50, 150, 180], opacity: 0.025 },
      ]
    : [
        { x: 0.25, y: 0.3, r: 0.35, color: [180, 150, 220], opacity: 0.02 },
        { x: 0.75, y: 0.25, r: 0.3, color: [150, 180, 220], opacity: 0.015 },
        { x: 0.5, y: 0.75, r: 0.4, color: [220, 200, 150], opacity: 0.02 },
        { x: 0.8, y: 0.6, r: 0.25, color: [150, 200, 220], opacity: 0.015 },
      ];

  const maxDim = Math.max(width, height);

  for (const blob of blobs) {
    const cx = blob.x * width;
    const cy = blob.y * height;
    const radius = blob.r * maxDim;
    const [cr, cg, cb] = blob.color;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${blob.opacity})`);
    grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  return canvas;
}

// =============================================================================
// Shooting Stars
// =============================================================================

function spawnShootingStar(width: number, height: number): ShootingStar {
  const angle = Math.PI / 4 + (Math.random() - 0.5) * Math.PI * 0.4;
  const speed = 3 + Math.random() * 5;
  const edge = Math.random();
  let x: number, y: number;
  if (edge < 0.5) {
    x = Math.random() * width * 0.7;
    y = -10;
  } else {
    x = -10;
    y = Math.random() * height * 0.5;
  }
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 60 + Math.random() * 60,
    trailLength: 30 + Math.random() * 50,
    brightness: 0.4 + Math.random() * 0.6,
  };
}

function updateAndDrawShootingStars(
  ctx: CanvasRenderingContext2D,
  stars: ShootingStar[],
  width: number,
  height: number,
  isDark: boolean,
): ShootingStar[] {
  const surviving: ShootingStar[] = [];
  for (const star of stars) {
    star.x += star.vx;
    star.y += star.vy;
    star.life++;

    if (star.life >= star.maxLife) continue;
    if (star.x < -50 || star.x > width + 50 || star.y < -50 || star.y > height + 50) continue;

    const lifeRatio = star.life / star.maxLife;
    let alpha: number;
    if (lifeRatio < 0.1) {
      alpha = lifeRatio / 0.1;
    } else if (lifeRatio > 0.7) {
      alpha = (1 - lifeRatio) / 0.3;
    } else {
      alpha = 1;
    }
    alpha *= star.brightness;

    const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
    const nx = star.vx / speed;
    const ny = star.vy / speed;
    const tailX = star.x - nx * star.trailLength;
    const tailY = star.y - ny * star.trailLength;

    // Keep shooting star gradients (only 0-3 active at once)
    const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
    const c = isDark ? '255,255,255' : '0,0,0';
    grad.addColorStop(0, `rgba(${c}, 0)`);
    grad.addColorStop(1, `rgba(${c}, ${alpha})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(star.x, star.y);
    ctx.stroke();

    surviving.push(star);
  }
  return surviving;
}

// =============================================================================
// Bioluminescent Ripples (light mode)
// =============================================================================

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
}

function spawnRipple(particles: Particle[]): Ripple {
  const p = particles[Math.floor(Math.random() * particles.length)];
  return {
    x: p.x,
    y: p.y,
    radius: 0,
    maxRadius: 60 + Math.random() * 80,
    life: 0,
    maxLife: 80 + Math.random() * 60,
    hue: 160 + Math.random() * 60,
    brightness: 0.3 + Math.random() * 0.4,
  };
}

function updateAndDrawRipples(ctx: CanvasRenderingContext2D, ripples: Ripple[]): Ripple[] {
  const surviving: Ripple[] = [];
  for (const ripple of ripples) {
    ripple.life++;
    if (ripple.life >= ripple.maxLife) continue;

    const lifeRatio = ripple.life / ripple.maxLife;
    ripple.radius = ripple.maxRadius * lifeRatio;

    // Fade in then out
    let alpha: number;
    if (lifeRatio < 0.15) {
      alpha = lifeRatio / 0.15;
    } else {
      alpha = 1 - (lifeRatio - 0.15) / 0.85;
    }
    alpha *= ripple.brightness;

    // Expanding ring that thins as it grows
    const lineWidth = Math.max(0.5, 3 * (1 - lifeRatio));
    ctx.strokeStyle = `hsla(${ripple.hue}, 80%, 60%, ${alpha * 0.6})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow during early life (< 30%)
    if (lifeRatio < 0.3) {
      const glowAlpha = alpha * 0.15 * (1 - lifeRatio / 0.3);
      const grad = ctx.createRadialGradient(
        ripple.x,
        ripple.y,
        0,
        ripple.x,
        ripple.y,
        ripple.radius,
      );
      grad.addColorStop(0, `hsla(${ripple.hue}, 80%, 70%, ${glowAlpha})`);
      grad.addColorStop(1, `hsla(${ripple.hue}, 80%, 60%, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    surviving.push(ripple);
  }
  return surviving;
}

// =============================================================================
// 3D Shape Generators
// =============================================================================

function generateSpherePoints(n: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / n);
    const phi = (2 * Math.PI * i) / goldenRatio;
    points.push({
      x: radius * Math.sin(theta) * Math.cos(phi),
      y: radius * Math.sin(theta) * Math.sin(phi),
      z: radius * Math.cos(theta),
    });
  }
  return points;
}

function generateCubePoints(n: number, halfSize: number): Point3D[] {
  const points: Point3D[] = [];
  const perFace = Math.ceil(n / 6);
  const faces: Array<(u: number, v: number) => Point3D> = [
    (u, v) => ({ x: halfSize, y: u, z: v }),
    (u, v) => ({ x: -halfSize, y: u, z: v }),
    (u, v) => ({ x: u, y: halfSize, z: v }),
    (u, v) => ({ x: u, y: -halfSize, z: v }),
    (u, v) => ({ x: u, y: v, z: halfSize }),
    (u, v) => ({ x: u, y: v, z: -halfSize }),
  ];
  for (const face of faces) {
    for (let i = 0; i < perFace && points.length < n; i++) {
      const u = (Math.random() * 2 - 1) * halfSize;
      const v = (Math.random() * 2 - 1) * halfSize;
      points.push(face(u, v));
    }
  }
  return points;
}

function generatePyramidPoints(n: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const height = radius * 1.5;
  const apex: Point3D = { x: 0, y: -height / 2, z: 0 };
  const baseY = height / 2;
  const baseCorners: Point3D[] = [
    { x: -radius, y: baseY, z: -radius },
    { x: radius, y: baseY, z: -radius },
    { x: radius, y: baseY, z: radius },
    { x: -radius, y: baseY, z: radius },
  ];

  const baseCount = Math.floor(n * 0.3);
  for (let i = 0; i < baseCount; i++) {
    const u = Math.random();
    const v = Math.random();
    points.push({
      x: -radius + u * 2 * radius,
      y: baseY,
      z: -radius + v * 2 * radius,
    });
  }

  const faceCount = n - baseCount;
  const perFace = Math.ceil(faceCount / 4);
  for (let f = 0; f < 4; f++) {
    const c1 = baseCorners[f];
    const c2 = baseCorners[(f + 1) % 4];
    for (let i = 0; i < perFace && points.length < n; i++) {
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      points.push({
        x: apex.x * w + c1.x * u + c2.x * v,
        y: apex.y * w + c1.y * u + c2.y * v,
        z: apex.z * w + c1.z * u + c2.z * v,
      });
    }
  }
  return points;
}

function generateTorusPoints(n: number, majorRadius: number): Point3D[] {
  const points: Point3D[] = [];
  const minorRadius = majorRadius * 0.35;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const theta = (2 * Math.PI * i) / n;
    const phi = (2 * Math.PI * i) / goldenRatio;
    const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
    const y = minorRadius * Math.sin(phi);
    const z = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);
    points.push({ x, y, z });
  }
  return points;
}

function generateHelixPoints(n: number, radius: number): Point3D[] {
  const points: Point3D[] = [];
  const height = radius * 3;
  const turns = 3;
  const half = Math.floor(n / 2);
  for (let strand = 0; strand < 2; strand++) {
    const offset = strand * Math.PI;
    for (let i = 0; i < half && points.length < n; i++) {
      const t = i / (half - 1);
      const theta = turns * 2 * Math.PI * t + offset;
      points.push({
        x: radius * Math.cos(theta),
        y: -height / 2 + height * t,
        z: radius * Math.sin(theta),
      });
    }
  }
  return points;
}

function generateBrainPoints(n: number, baseSize: number): Point3D[] {
  const points: Point3D[] = [];
  const scale = baseSize * 0.85;
  const phi = (1 + Math.sqrt(5)) / 2;
  const mainCount = Math.floor(n * 0.92);
  const stemCount = n - mainCount;

  for (let i = 0; i < mainCount; i++) {
    const theta = (2 * Math.PI * i) / phi;
    const cosLat = 1 - (2 * (i + 0.5)) / mainCount;
    const sinLat = Math.sqrt(1 - cosLat * cosLat);

    let x = sinLat * Math.cos(theta) * 1.25;
    let y = cosLat * 0.95;
    let z = sinLat * Math.sin(theta) * 1.05;

    // Longitudinal fissure between hemispheres
    const topness = Math.max(0, y);
    const fissure = 0.18 * topness * topness;
    x += x >= 0 ? fissure : -fissure;

    // Cortex folds
    const wrinkle =
      0.06 * (Math.sin(8 * theta + 4 * y) * 0.6 + Math.sin(13 * y * Math.PI + 5 * theta) * 0.4);
    const dist = Math.sqrt(x * x + y * y + z * z);
    if (dist > 0) {
      x += (x / dist) * wrinkle;
      y += (y / dist) * wrinkle;
      z += (z / dist) * wrinkle;
    }

    // Flatten bottom
    if (y < -0.4) y = -0.4 + (y + 0.4) * 0.3;

    // Cerebellum bulge at back-bottom
    if (y < -0.1 && z < -0.3) {
      z -= Math.max(0, -y - 0.1) * Math.max(0, -z - 0.3) * 0.8;
    }

    points.push({ x: x * scale, y: y * scale, z: z * scale });
  }

  // Brain stem
  for (let i = 0; i < stemCount; i++) {
    const t = i / (stemCount - 1);
    const angle = 2 * Math.PI * t * 3;
    const r = 0.12;
    points.push({
      x: r * Math.cos(angle) * scale,
      y: (-0.5 - 0.5 * t) * scale,
      z: (-0.3 + r * Math.sin(angle)) * scale,
    });
  }

  return points;
}

function generateShapePoints(shape: ShapeName, n: number, baseSize: number): Point3D[] {
  switch (shape) {
    case 'sphere':
      return generateSpherePoints(n, baseSize);
    case 'cube':
      return generateCubePoints(n, baseSize);
    case 'pyramid':
      return generatePyramidPoints(n, baseSize);
    case 'torus':
      return generateTorusPoints(n, baseSize);
    case 'helix':
      return generateHelixPoints(n, baseSize);
    case 'brain':
      return generateBrainPoints(n, baseSize);
  }
}

function lerpPoint3D(a: Point3D, b: Point3D, t: number): Point3D {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function rotatePoint(p: Point3D, rotY: number, rotX: number): Point3D {
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = p.x * cosY + p.z * sinY;
  const z1 = -p.x * sinY + p.z * cosY;
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y1 = p.y * cosX - z1 * sinX;
  const z2 = p.y * sinX + z1 * cosX;
  return { x: x1, y: y1, z: z2 };
}

function projectTo2D(
  p: Point3D,
  centerX: number,
  centerY: number,
  focalLength: number,
): { x: number; y: number } {
  const scale = focalLength / (focalLength + p.z);
  return {
    x: centerX + p.x * scale,
    y: centerY + p.y * scale,
  };
}

function computeShapeTargets(
  shape3D: Point3D[],
  rotY: number,
  rotX: number,
  cx: number,
  cy: number,
  focalLen: number,
): Array<{ x: number; y: number }> {
  return shape3D.map((p) => {
    const rotated = rotatePoint(p, rotY, rotX);
    return projectTo2D(rotated, cx, cy, focalLen);
  });
}

// =============================================================================
// Connection Drawing (Steps 5-7: flat grid, unified grid, Uint8Array dedup)
// =============================================================================

function drawConnections(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  connDist: number,
  lineColor: string,
  grid: FlatSpatialGrid,
  dedupBuf: Uint8Array,
) {
  const connDistSq = connDist * connDist;
  const { cells, cols, rows, cellSize } = grid;

  const batches: Array<Array<[Particle, Particle]>> = Array.from(
    { length: OPACITY_BANDS },
    () => [],
  );

  // Step 7: Clear Uint8Array dedup buffer
  dedupBuf.fill(0);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cx = Math.max(0, Math.min(Math.floor(p.x / cellSize), cols - 1));
    const cy = Math.max(0, Math.min(Math.floor(p.y / cellSize), rows - 1));

    // Step 5: Inline neighbor iteration (no temporary array allocation)
    const minDx = Math.max(0, cx - 1);
    const maxDx = Math.min(cols - 1, cx + 1);
    const minDy = Math.max(0, cy - 1);
    const maxDy = Math.min(rows - 1, cy + 1);

    for (let ny = minDy; ny <= maxDy; ny++) {
      for (let nx = minDx; nx <= maxDx; nx++) {
        const cell = cells[ny * cols + nx];
        if (!cell) continue;
        for (let ci = 0; ci < cell.length; ci++) {
          const n = cell[ci];
          if (p === n) continue;
          const j = n.id;
          const pId = p.id;

          // Step 7: Uint8Array dedup instead of Set<string>
          const lo = pId < j ? pId : j;
          const hi = pId < j ? j : pId;
          const dedupKey = lo * 512 + hi;
          if (dedupBuf[dedupKey]) continue;
          dedupBuf[dedupKey] = 1;

          const dx = p.x - n.x;
          const dy = p.y - n.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < connDistSq) {
            const d = Math.sqrt(dSq);
            const opacity = (1 - d / connDist) * MAX_LINE_OPACITY;
            batches[getOpacityBand(opacity)].push([p, n]);
          }
        }
      }
    }
  }

  ctx.lineWidth = 1;
  for (let b = 0; b < OPACITY_BANDS; b++) {
    if (batches[b].length === 0) continue;
    ctx.strokeStyle = `${lineColor} ${((b + 0.5) / OPACITY_BANDS) * MAX_LINE_OPACITY})`;
    ctx.beginPath();
    for (const [p1, p2] of batches[b]) {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }
}

// =============================================================================
// Component
// =============================================================================

interface PlexusBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  gravityStrength?: number;
  autoCollapseDelay?: number;
  onAutoCollapse?: () => void;
  onShapeChange?: () => void;
  logoLightUrl?: string;
}

export function PlexusBackground({
  className = '',
  particleCount = 300,
  connectionDistance = 120,
  gravityStrength = 800,
  autoCollapseDelay,
  onAutoCollapse,
  onShapeChange,
  logoLightUrl,
}: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const targetFpsRef = useRef(
    typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency != null &&
      navigator.hardwareConcurrency <= 4
      ? 24
      : 30,
  );
  const channelRef = useRef('255, 255, 255');
  const lineColorRef = useRef('rgba(255, 255, 255,');
  const isDarkRef = useRef(true);
  const logoShapePointsRef = useRef<{ x: number; y: number }[]>([]);

  const emittersRef = useRef<WaveEmitter[]>([]);

  const stateRef = useRef<GalaxyState>('drifting');
  const stateStartTimeRef = useRef<number>(Date.now());
  const lastFrameTimeRef = useRef(0);

  // Shape formation refs
  const shapeIndexRef = useRef(0);
  const shapePoints3DRef = useRef<Point3D[]>([]);
  const shapeTimerRef = useRef(0);
  const rotationRef = useRef({ y: 0, x: 0 });
  const shapeTargets2DRef = useRef<Array<{ x: number; y: number }>>([]);
  const prevShapePoints3DRef = useRef<Point3D[]>([]);
  const shapeTransitionStartRef = useRef(0);

  // Layer buckets (pre-sorted at init, avoids per-frame filtering)
  const distantRef = useRef<Particle[]>([]);
  const mediumRef = useRef<Particle[]>([]);
  const foregroundRef = useRef<Particle[]>([]);
  const connectableRef = useRef<Particle[]>([]);

  // Nebula
  const nebulaRef = useRef<HTMLCanvasElement | null>(null);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  // Shooting stars
  const shootingStarsRef = useRef<ShootingStar[]>([]);

  // Bioluminescent ripples (light mode)
  const ripplesRef = useRef<Ripple[]>([]);

  // Step 7: Uint8Array dedup buffer for connections
  const dedupBufRef = useRef<Uint8Array>(new Uint8Array(512 * 512));

  // Step 8: Cached maxDist (updated on resize)
  const maxDistRef = useRef(0);

  // Gravitational pulse hint
  const hintFiredRef = useRef(false);
  const hintActiveRef = useRef<{ startTime: number } | null>(null);
  const hintTimerRef = useRef<number>(0);

  // Auto-collapse timer
  const autoCollapseTimerRef = useRef<number>(0);

  // Shape change callback ref (avoids re-init of animation loop)
  const onShapeChangeRef = useRef(onShapeChange);
  onShapeChangeRef.current = onShapeChange;

  // Pixel-sample logo-mark for shape formation
  useEffect(() => {
    if (!logoLightUrl) return;
    const img = new Image();
    img.src = logoLightUrl;
    img.onload = () => {
      const SIZE = 256;
      const offscreen = document.createElement('canvas');
      offscreen.width = SIZE;
      offscreen.height = SIZE;
      const ctx2 = offscreen.getContext('2d');
      if (!ctx2) return;
      ctx2.drawImage(img, 0, 0, SIZE, SIZE);
      const data = ctx2.getImageData(0, 0, SIZE, SIZE).data;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          if (data[(y * SIZE + x) * 4 + 3] > 128) {
            pts.push({ x: x / SIZE - 0.5, y: y / SIZE - 0.5 });
          }
        }
      }
      logoShapePointsRef.current = pts;
    };
  }, [logoLightUrl]);

  // Theme detection + nebula/colorTint updates
  useEffect(() => {
    const checkDarkMode = () => document.documentElement.classList.contains('dark');
    const updateTheme = (dark: boolean) => {
      isDarkRef.current = dark;
      channelRef.current = dark ? '255, 255, 255' : '0, 0, 0';
      lineColorRef.current = dark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';
      // Update particle color tints + hex colors
      for (const p of particlesRef.current) {
        p.colorTint = assignStarColorTint(dark);
        p.hexColor = colorTintToHex(p.colorTint);
      }
      // Clear theme-specific ambient effects
      shootingStarsRef.current = [];
      ripplesRef.current = [];
      // Regenerate nebula if canvas is set up
      const { width, height } = dimensionsRef.current;
      if (width > 0 && height > 0) {
        nebulaRef.current = createNebulaBuffer(width, height, dark);
      }
    };
    updateTheme(checkDarkMode());

    const observer = new MutationObserver(() => updateTheme(checkDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const initParticles = useCallback(
    (width: number, height: number): Particle[] => {
      const isDark = isDarkRef.current;
      // Scale particle count by viewport area relative to 1920×1080 reference
      const refArea = 1920 * 1080;
      const viewportArea = width * height;
      const scale = Math.sqrt(viewportArea / refArea);
      const count = Math.max(60, Math.round(particleCount * Math.min(scale, 1.6)));
      const cols = Math.max(1, Math.ceil(Math.sqrt(count * (width / height))));
      const rows = Math.max(1, Math.ceil(count / cols));
      const cellW = width / cols;
      const cellH = height / rows;

      const particles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const roll = i / count;
        let layer: Particle['layer'];
        let depth: number;
        let radius: number;
        let twinkleMin: number;
        let twinkleMax: number;
        let velScale: number;

        if (roll < 0.4) {
          // Distant (40%) — tiny, dim, barely drifting
          layer = 'distant';
          depth = 0.8 + Math.random() * 0.2;
          radius = 0.3 + Math.random() * 0.5;
          twinkleMin = 0.05 + Math.random() * 0.1;
          twinkleMax = 0.3 + Math.random() * 0.2;
          velScale = 0.15;
        } else if (roll < 0.75) {
          // Medium (35%)
          layer = 'medium';
          depth = 0.4 + Math.random() * 0.2;
          radius = 0.6 + Math.random() * 0.8;
          twinkleMin = 0.1 + Math.random() * 0.1;
          twinkleMax = 0.5 + Math.random() * 0.2;
          velScale = 0.35;
        } else {
          // Foreground (25%) — larger, brighter, gentle drift
          layer = 'foreground';
          depth = Math.random() * 0.2;
          radius = 1.0 + Math.random() * 1.5;
          twinkleMin = 0.15 + Math.random() * 0.15;
          twinkleMax = 0.7 + Math.random() * 0.3;
          velScale = 0.5;
        }

        const tint = assignStarColorTint(isDark);
        particles.push({
          x: ((i % cols) + Math.random()) * cellW,
          y: (Math.floor(i / cols) + Math.random()) * cellH,
          vx: (Math.random() - 0.5) * 0.04 * velScale,
          vy: (Math.random() - 0.5) * 0.04 * velScale,
          baseX: 0,
          baseY: 0,
          twinkleSpeed: 0.5 + Math.random() * 2.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleMin,
          twinkleMax,
          radius,
          baseRadius: radius,
          id: i,
          layer,
          depth,
          colorTint: tint,
          hexColor: colorTintToHex(tint),
          shape: pickRandomShape(),
          life: Math.random() * 20000,
          maxLife: 15000 + Math.random() * 15000,
        });
      }
      return particles;
    },
    [particleCount],
  );

  const bucketParticles = useCallback((particles: Particle[]) => {
    const distant: Particle[] = [];
    const medium: Particle[] = [];
    const foreground: Particle[] = [];
    for (const p of particles) {
      if (p.layer === 'distant') distant.push(p);
      else if (p.layer === 'medium') medium.push(p);
      else foreground.push(p);
    }
    distantRef.current = distant;
    mediumRef.current = medium;
    foregroundRef.current = foreground;
    connectableRef.current = [...medium, ...foreground];
  }, []);

  const initEmitters = useCallback((width: number, height: number): WaveEmitter[] => {
    const diag = Math.sqrt(width * width + height * height);
    return EMITTER_CONFIGS.map((cfg) => ({
      baseFracX: cfg.fracX,
      baseFracY: cfg.fracY,
      x: cfg.fracX * width,
      y: cfg.fracY * height,
      wavelength: cfg.wavelengthFrac * diag,
      period: cfg.period,
      phase: cfg.phase,
      radialAmplitude: cfg.radialAmp,
      tangentialAmplitude: cfg.tangentialAmp,
      decayAlpha: cfg.decayAlpha,
      flarePeriod: cfg.flarePeriod,
      flarePhase: cfg.flarePhase,
      flareBaseLevel: cfg.flareBase,
      flarePeakLevel: cfg.flarePeak,
      orbitRadius: cfg.orbitRadiusFrac * diag,
      orbitSpeed: cfg.orbitSpeed,
      orbitPhase: cfg.orbitPhase,
    }));
  }, []);

  const updateEmitterPositions = useCallback(
    (emitters: WaveEmitter[], width: number, height: number, timeSec: number) => {
      for (const e of emitters) {
        e.x = e.baseFracX * width + e.orbitRadius * Math.cos(e.orbitSpeed * timeSec + e.orbitPhase);
        e.y =
          e.baseFracY * height + e.orbitRadius * Math.sin(e.orbitSpeed * timeSec + e.orbitPhase);
      }
    },
    [],
  );

  // Step 3: drawParticle with glow sprite + solid streaks + globalAlpha
  const drawParticle = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: Particle,
      now: number,
      state: GalaxyState,
      _centerX: number,
      _centerY: number,
      _maxDim: number,
      beat: number,
    ) => {
      const t = Math.sin(now * 0.001 * p.twinkleSpeed + p.twinklePhase);
      const baseOpacity = p.twinkleMin + (t * 0.5 + 0.5) * (p.twinkleMax - p.twinkleMin);
      const lifeRatio = p.life / p.maxLife;
      const lifeFade =
        state === 'drifting' || state === 'expanding'
          ? lifeRatio < 0.1
            ? lifeRatio / 0.1
            : lifeRatio > 0.85
              ? (1 - lifeRatio) / 0.15
              : 1
          : 1;
      const opacity = Math.min(baseOpacity * (1 + beat * 0.3), 1) * lifeFade;

      const drawRadius = p.radius;

      // Warp streak rendering during collapsing/expanding
      // Step 3: solid line + glow sprite instead of per-particle gradients
      if (state === 'collapsing' || state === 'expanding') {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.1) {
          const streakLen = Math.min(speed * 12, 40);
          const nx = p.vx / speed;
          const ny = p.vy / speed;
          const tailX = p.x - nx * streakLen;
          const tailY = p.y - ny * streakLen;

          // Solid line at reduced opacity instead of gradient
          ctx.globalAlpha = opacity * 0.4;
          ctx.strokeStyle = p.hexColor;
          ctx.lineWidth = drawRadius;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          // Bright head
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, drawRadius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = p.hexColor;
          ctx.fill();

          if (p.layer === 'foreground' && opacity > 0.5) {
            const glowRadius = drawRadius * (3 + beat * 2);
            const sprite = getGlowSprite(isDarkRef.current);
            ctx.globalAlpha = opacity * 0.15;
            ctx.drawImage(
              sprite,
              p.x - glowRadius,
              p.y - glowRadius,
              glowRadius * 2,
              glowRadius * 2,
            );
          }
          ctx.globalAlpha = 1;
          return;
        }
      }

      // Drifting streaks for foreground particles
      // Step 3: solid line instead of gradient
      if (state === 'drifting' && p.layer === 'foreground') {
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.15) {
          const streakLen = Math.min(speed * 6, 12);
          const nx = p.vx / speed;
          const ny = p.vy / speed;
          const tailX = p.x - nx * streakLen;
          const tailY = p.y - ny * streakLen;

          ctx.globalAlpha = opacity * 0.4;
          ctx.strokeStyle = p.hexColor;
          ctx.lineWidth = drawRadius * 0.7;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // Fall through to normal dot rendering
        }
      }

      // Normal dot/shape rendering
      // Step 3: glow sprite instead of per-particle radial gradient
      if (p.layer === 'foreground' && opacity > 0.5) {
        const glowRadius = drawRadius * (3 + beat * 2);
        const sprite = getGlowSprite(isDarkRef.current);
        ctx.globalAlpha = opacity * 0.15;
        ctx.drawImage(sprite, p.x - glowRadius, p.y - glowRadius, glowRadius * 2, glowRadius * 2);
      }

      // Step 2: globalAlpha + hexColor instead of rgba string
      ctx.beginPath();
      SHAPE_DRAW[p.shape](ctx, p.x, p.y, drawRadius);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.hexColor;
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    [],
  );

  // Steps 8-9: updateParticle with optimized wave/distance computations
  const updateParticle = useCallback(
    (
      particle: Particle,
      width: number,
      height: number,
      now: number,
      centerX: number,
      centerY: number,
      precomputedWaves: PrecomputedWave[] | null,
      grid: FlatSpatialGrid | null,
      beat: number,
    ) => {
      const state = stateRef.current;
      const elapsed = now - stateStartTimeRef.current;
      const depthResponse = 1 - particle.depth;

      if (state === 'drifting') {
        // Step 9: Mouse interaction — compare squared distance first
        const mouse = mouseRef.current;
        const mdx = mouse.x - particle.x;
        const mdy = mouse.y - particle.y;
        const mdistSq = mdx * mdx + mdy * mdy;
        if (mdistSq > 0 && mdistSq < MOUSE_INTERACT_DIST_SQ) {
          const mdist = Math.sqrt(mdistSq);
          if (isDarkRef.current) {
            const force =
              (gravityStrength / 80000) * (1 - mdist / MOUSE_INTERACT_DIST) * depthResponse;
            particle.vx += (mdx / mdist) * force;
            particle.vy += (mdy / mdist) * force;
          } else {
            if (mdist < 80) {
              const force = (gravityStrength / 40000) * (1 - mdist / 80) * depthResponse;
              particle.vx -= (mdx / mdist) * force;
              particle.vy -= (mdy / mdist) * force;
            } else {
              const force = (gravityStrength / 200000) * (1 - (mdist - 80) / 120) * depthResponse;
              particle.vx += (mdx / mdist) * force;
              particle.vy += (mdy / mdist) * force;
            }
          }
        }

        // Step 8: Wave drift — skip distant particles, use precomputed wave data
        if (precomputedWaves && particle.layer !== 'distant') {
          const waveMult = isDarkRef.current ? 0.15 : 1.0;
          for (let e = 0; e < precomputedWaves.length; e++) {
            const wf = computeWaveForcePrecomputed(precomputedWaves[e], particle.x, particle.y);
            particle.vx += wf.fx * depthResponse * waveMult;
            particle.vy += wf.fy * depthResponse * waveMult;
          }
        }

        // Step 5/6: Repulsion using flat grid, inlined neighbor iteration
        if (grid) {
          const { cells, cols, rows, cellSize } = grid;
          const cx = Math.max(0, Math.min(Math.floor(particle.x / cellSize), cols - 1));
          const cy = Math.max(0, Math.min(Math.floor(particle.y / cellSize), rows - 1));
          const minDx = Math.max(0, cx - 1);
          const maxDx = Math.min(cols - 1, cx + 1);
          const minDy = Math.max(0, cy - 1);
          const maxDy = Math.min(rows - 1, cy + 1);

          for (let ny = minDy; ny <= maxDy; ny++) {
            for (let nx = minDx; nx <= maxDx; nx++) {
              const cell = cells[ny * cols + nx];
              if (!cell) continue;
              for (let n = 0; n < cell.length; n++) {
                const other = cell[n];
                if (other.id === particle.id) continue;
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distSq = dx * dx + dy * dy;
                // Step 9: compare squared distance, only sqrt when inside range
                if (distSq < REPULSE_RADIUS_SQ && distSq > 1) {
                  const dist = Math.sqrt(distSq);
                  const force = REPULSE_STRENGTH * (1 - dist / REPULSE_RADIUS);
                  particle.vx += (dx / dist) * force;
                  particle.vy += (dy / dist) * force;
                }
              }
            }
          }
        }

        // Gravitational pulse hint
        const hint = hintActiveRef.current;
        if (hint) {
          const hintElapsed = now - hint.startTime;
          if (hintElapsed < HINT_PULSE_DURATION_MS) {
            const pulseT = hintElapsed / HINT_PULSE_DURATION_MS;
            const pulseStrength = HINT_PULSE_STRENGTH * Math.sin(Math.PI * pulseT);
            const hdx = centerX - particle.x;
            const hdy = centerY - particle.y;
            const hdist = Math.sqrt(hdx * hdx + hdy * hdy) || 1;
            particle.vx += (hdx / hdist) * pulseStrength;
            particle.vy += (hdy / hdist) * pulseStrength;
          }
        }

        // Damping — light mode has more drag (water resistance vs vacuum)
        const damp = isDarkRef.current ? 0.997 : 0.994;
        particle.vx *= damp;
        particle.vy *= damp;
      } else if (state === 'collapsing') {
        const t = Math.min(elapsed / COLLAPSE_DURATION, 1);
        const ease = easeInOutCubic(t);
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          // Enhanced gravitational feel: far particles accelerate faster, capped at 3x
          const maxDim = Math.max(width, height);
          const normalizedDist = dist / (maxDim * 0.5);
          const distanceFactor = Math.min(1 + normalizedDist * 2, 3);
          const radialForce = 0.15 * ease * distanceFactor;
          particle.vx += (dx / dist) * radialForce;
          particle.vy += (dy / dist) * radialForce;
          // Tangential spin — light mode: 2x for whirlpool effect
          const tangentialMult = isDarkRef.current ? 0.08 : 0.16;
          particle.vx += (-dy / dist) * tangentialMult * ease;
          particle.vy += (dx / dist) * tangentialMult * ease;
        }
        // Wave perturbations during collapse
        if (precomputedWaves) {
          for (let e = 0; e < precomputedWaves.length; e++) {
            const wf = computeWaveForcePrecomputed(precomputedWaves[e], particle.x, particle.y);
            particle.vx += wf.fx * 0.5 * ease;
            particle.vy += wf.fy * 0.5 * ease;
          }
        }
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      } else if (state === 'shape_forming') {
        const targets = shapeTargets2DRef.current;
        if (targets.length > 0) {
          const target = targets[particle.id % targets.length];
          const dx = target.x - particle.x;
          const dy = target.y - particle.y;
          particle.vx += dx * SHAPE_SPRING_STIFFNESS;
          particle.vy += dy * SHAPE_SPRING_STIFFNESS;
          particle.vx *= SHAPE_SPRING_DAMPING;
          particle.vy *= SHAPE_SPRING_DAMPING;
        }
      } else if (state === 'expanding') {
        const t = Math.min(elapsed / EXPAND_DURATION, 1);
        const damping = 0.97 + 0.02 * t;
        particle.vx *= damping;
        particle.vy *= damping;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      // Lifecycle — age and respawn
      if (state === 'drifting' || state === 'expanding') {
        particle.life += 16;
        if (particle.life >= particle.maxLife) {
          particle.x = Math.random() * width;
          particle.y = Math.random() * height;
          particle.vx = 0;
          particle.vy = 0;
          particle.life = 0;
          particle.maxLife = 15000 + Math.random() * 15000;
          particle.twinklePhase = Math.random() * Math.PI * 2;
        }
      }

      // Drifting: respawn when particles exit viewport
      if (state === 'drifting') {
        const margin = 50;
        if (
          particle.x < -margin ||
          particle.x > width + margin ||
          particle.y < -margin ||
          particle.y > height + margin
        ) {
          particle.x = Math.random() * width;
          particle.y = Math.random() * height;
          particle.vx = 0;
          particle.vy = 0;
          particle.twinklePhase = Math.random() * Math.PI * 2;
        }
      } else if (state === 'expanding') {
        // Edge wrapping only during expanding
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }
    },
    [gravityStrength],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stateRef.current = 'drifting';
    stateStartTimeRef.current = Date.now();
    lastFrameTimeRef.current = Date.now();

    // Step 4: Cap DPR at 1.5
    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      return { width: rect.width, height: rect.height };
    };

    let { width, height } = setupCanvas();
    dimensionsRef.current = { width, height };
    // Step 8: Cache maxDist
    maxDistRef.current = Math.sqrt(width * width + height * height);

    // Scale connection distance with viewport so density feels consistent
    const refDiag = Math.sqrt(1920 * 1920 + 1080 * 1080);
    const scaledConnDist = () => {
      const diag = Math.sqrt(width * width + height * height);
      return connectionDistance * Math.max(0.7, Math.min(diag / refDiag, 1.4));
    };
    let effectiveConnDist = scaledConnDist();

    particlesRef.current = initParticles(width, height);
    bucketParticles(particlesRef.current);
    emittersRef.current = initEmitters(width, height);
    nebulaRef.current = createNebulaBuffer(width, height, isDarkRef.current);
    shootingStarsRef.current = [];
    ripplesRef.current = [];

    const generateLogoAwareShape = (
      shape: ShapeName | 'logo',
      n: number,
      baseSize: number,
    ): Point3D[] => {
      if (shape === 'logo') {
        const pts = logoShapePointsRef.current;
        if (!pts.length) return generateShapePoints('sphere', n, baseSize);
        return Array.from({ length: n }, () => {
          const p = pts[Math.floor(Math.random() * pts.length)];
          return { x: p.x * baseSize * 1.5, y: p.y * baseSize * 1.5, z: 0 };
        });
      }
      return generateShapePoints(shape, n, baseSize);
    };

    const initShapeForming = (w: number, h: number) => {
      shapeIndexRef.current = 0;
      rotationRef.current = { y: 0, x: 0 };
      prevShapePoints3DRef.current = [];
      shapeTransitionStartRef.current = 0;
      const minDim = Math.min(w, h);
      const baseSize = minDim * (minDim < 500 ? 0.32 : 0.2);
      shapePoints3DRef.current = generateLogoAwareShape(
        SHAPE_NAMES[0],
        particlesRef.current.length,
        baseSize,
      );
      shapeTimerRef.current = Date.now();
      const focalLen = Math.min(w, h) * 2;
      shapeTargets2DRef.current = computeShapeTargets(
        shapePoints3DRef.current,
        rotationRef.current.y,
        rotationRef.current.x,
        w / 2,
        h / 2,
        focalLen,
      );
    };

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = window.setTimeout(() => {
        const oldWidth = width;
        const oldHeight = height;
        const dims = setupCanvas();
        width = dims.width;
        height = dims.height;
        dimensionsRef.current = { width, height };
        // Step 8: Update cached maxDist
        maxDistRef.current = Math.sqrt(width * width + height * height);
        // Scale particle positions proportionally
        for (const p of particlesRef.current) {
          p.x = (p.x / oldWidth) * width;
          p.y = (p.y / oldHeight) * height;
        }
        // Scale emitter properties by diagonal ratio
        const oldDiag = Math.sqrt(oldWidth * oldWidth + oldHeight * oldHeight);
        const newDiag = Math.sqrt(width * width + height * height);
        const diagRatio = newDiag / oldDiag;
        for (const e of emittersRef.current) {
          e.wavelength *= diagRatio;
          e.orbitRadius *= diagRatio;
        }
        // Update connection distance for new viewport size
        effectiveConnDist = scaledConnDist();
        // Regenerate nebula buffer
        nebulaRef.current = createNebulaBuffer(width, height, isDarkRef.current);
        // Regenerate shape points on resize during shape_forming
        if (stateRef.current === 'shape_forming') {
          const minDim = Math.min(width, height);
          const baseSize = minDim * (minDim < 500 ? 0.32 : 0.2);
          shapePoints3DRef.current = generateLogoAwareShape(
            SHAPE_NAMES[shapeIndexRef.current],
            particlesRef.current.length,
            baseSize,
          );
          if (prevShapePoints3DRef.current.length > 0) {
            const prevIndex = (shapeIndexRef.current - 1 + SHAPE_NAMES.length) % SHAPE_NAMES.length;
            prevShapePoints3DRef.current = generateLogoAwareShape(
              SHAPE_NAMES[prevIndex],
              particlesRef.current.length,
              baseSize,
            );
          }
        }
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleClick = () => {
      // Cancel timers on any click
      clearTimeout(hintTimerRef.current);
      clearTimeout(autoCollapseTimerRef.current);
      hintActiveRef.current = null;

      const state = stateRef.current;
      if (state === 'drifting') {
        stateRef.current = 'collapsing';
        stateStartTimeRef.current = Date.now();
      } else if (state === 'shape_forming') {
        const cx = width / 2;
        const cy = height / 2;
        for (const p of particlesRef.current) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const magnitude = 3 + Math.random() * 5;
          p.vx = (dx / dist) * magnitude;
          p.vy = (dy / dist) * magnitude;
        }
        stateRef.current = 'expanding';
        stateStartTimeRef.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Hint timer: gravitational pulse after 12s of inactivity
    if (!prefersReducedMotion) {
      hintTimerRef.current = window.setTimeout(() => {
        if (stateRef.current === 'drifting' && !hintFiredRef.current) {
          hintActiveRef.current = { startTime: Date.now() };
          hintFiredRef.current = true;
        }
      }, HINT_DELAY_MS);
    }

    // Auto-collapse: trigger collapsing after delay
    if (!prefersReducedMotion && autoCollapseDelay != null) {
      autoCollapseTimerRef.current = window.setTimeout(() => {
        if (stateRef.current === 'drifting') {
          stateRef.current = 'collapsing';
          stateStartTimeRef.current = Date.now();
          onAutoCollapse?.();
        }
      }, autoCollapseDelay);
    }

    // Reduced motion: static starfield with nebula, drawn once
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      if (nebulaRef.current) {
        ctx.drawImage(nebulaRef.current, 0, 0, width, height);
      }
      const now = Date.now();
      const staticCX = width / 2;
      const staticCY = height / 2;
      const staticMaxDim = Math.max(width, height);
      for (const p of distantRef.current)
        drawParticle(ctx, p, now, 'drifting', staticCX, staticCY, staticMaxDim, 0);
      for (const p of mediumRef.current)
        drawParticle(ctx, p, now, 'drifting', staticCX, staticCY, staticMaxDim, 0);
      // Build grid for static connections
      const staticGrid = buildSpatialGrid(connectableRef.current, effectiveConnDist, width, height);
      drawConnections(
        ctx,
        connectableRef.current,
        effectiveConnDist,
        lineColorRef.current,
        staticGrid,
        dedupBufRef.current,
      );
      for (const p of foregroundRef.current)
        drawParticle(ctx, p, now, 'drifting', staticCX, staticCY, staticMaxDim, 0);
      return;
    }

    const animate = () => {
      if (pausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      const frameBudget = 1000 / targetFpsRef.current;
      if (now - lastRenderTimeRef.current < frameBudget) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastRenderTimeRef.current = now;

      const dtSec = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;
      ctx.clearRect(0, 0, width, height);

      // Draw nebula background
      if (nebulaRef.current) {
        ctx.drawImage(nebulaRef.current, 0, 0, width, height);
      }

      const elapsed = now - stateStartTimeRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // Step 10: Inline pulse computation (replaces separate rAF loop)
      const tSec = now * 0.001;
      const TAU = Math.PI * 2;
      const pulseRaw =
        (Math.sin(tSec * 0.23 * TAU) +
          Math.sin(tSec * 0.37 * TAU) +
          Math.sin(tSec * 0.71 * TAU) +
          3) /
        6;
      const beat = pulseRaw * pulseRaw;

      // State transitions
      if (stateRef.current === 'collapsing' && elapsed >= COLLAPSE_DURATION) {
        stateRef.current = 'shape_forming';
        stateStartTimeRef.current = now;
        initShapeForming(width, height);
        onShapeChangeRef.current?.();
      } else if (stateRef.current === 'expanding' && elapsed >= EXPAND_DURATION) {
        stateRef.current = 'drifting';
        stateStartTimeRef.current = now;
      }

      // Shape cycling and rotation
      if (stateRef.current === 'shape_forming') {
        const shapeElapsed = now - shapeTimerRef.current;
        if (shapeElapsed >= SHAPE_CYCLE_DURATION) {
          prevShapePoints3DRef.current = shapePoints3DRef.current;
          shapeIndexRef.current = (shapeIndexRef.current + 1) % SHAPE_NAMES.length;
          const minDim = Math.min(width, height);
          const baseSize = minDim * (minDim < 500 ? 0.32 : 0.2);
          shapePoints3DRef.current = generateLogoAwareShape(
            SHAPE_NAMES[shapeIndexRef.current],
            particlesRef.current.length,
            baseSize,
          );
          shapeTransitionStartRef.current = now;
          shapeTimerRef.current = now;
          onShapeChangeRef.current?.();
        }

        rotationRef.current.y += SHAPE_ROTATION_SPEED_Y * dtSec;
        rotationRef.current.x += SHAPE_ROTATION_SPEED_X * dtSec;

        let activePoints3D: Point3D[];
        if (shapeTransitionStartRef.current > 0) {
          const rawT = (now - shapeTransitionStartRef.current) / SHAPE_TRANSITION_DURATION;
          const easedT = easeInOutCubic(Math.min(rawT, 1));
          if (rawT >= 1) {
            prevShapePoints3DRef.current = [];
            shapeTransitionStartRef.current = 0;
            activePoints3D = shapePoints3DRef.current;
          } else {
            const prev = prevShapePoints3DRef.current;
            const next = shapePoints3DRef.current;
            activePoints3D = new Array(next.length);
            for (let i = 0; i < next.length; i++) {
              activePoints3D[i] = lerpPoint3D(prev[i % prev.length], next[i], easedT);
            }
          }
        } else {
          activePoints3D = shapePoints3DRef.current;
        }

        const focalLen = Math.min(width, height) * 2;
        shapeTargets2DRef.current = computeShapeTargets(
          activePoints3D,
          rotationRef.current.y,
          rotationRef.current.x,
          centerX,
          centerY,
          focalLen,
        );
      }

      // Update emitter positions
      updateEmitterPositions(emittersRef.current, width, height, now * 0.001);

      const particles = particlesRef.current;
      const state = stateRef.current;

      // Step 6: Build a single unified grid using connection distance as cell size
      // (larger than repulsion radius, so all repulsion neighbors are still found)
      const baseConnDist =
        (isDarkRef.current ? effectiveConnDist : effectiveConnDist * 1.2) * (1 + beat * 0.3);
      const connDist =
        state === 'collapsing' || state === 'shape_forming'
          ? baseConnDist * 0.6
          : baseConnDist * 0.7;
      const gridCellSize = Math.max(connDist, REPULSE_RADIUS);
      const unifiedGrid =
        state === 'drifting' ? buildSpatialGrid(particles, gridCellSize, width, height) : null;

      // Step 8: Precompute wave data once per frame (hoisted out of particle loop)
      const timeSec = now * 0.001;
      const precomputedWaves =
        state === 'drifting' || state === 'collapsing'
          ? precomputeWaveData(emittersRef.current, timeSec, maxDistRef.current)
          : null;

      // Update all particles
      for (let i = 0; i < particles.length; i++) {
        updateParticle(
          particles[i],
          width,
          height,
          now,
          centerX,
          centerY,
          precomputedWaves,
          unifiedGrid,
          beat,
        );
      }

      // Clear hint after pulse duration
      if (
        hintActiveRef.current &&
        now - hintActiveRef.current.startTime >= HINT_PULSE_DURATION_MS
      ) {
        hintActiveRef.current = null;
      }

      // Warp tunnel vignette (drawn before particles for background effect)
      if (state === 'collapsing' || state === 'expanding') {
        const warpElapsed = now - stateStartTimeRef.current;
        const duration = state === 'collapsing' ? COLLAPSE_DURATION : EXPAND_DURATION;
        const progress = Math.min(warpElapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);
        // Collapsing: vignette increases; expanding: vignette decreases
        const vignetteAlpha =
          state === 'collapsing' ? easedProgress * 0.15 : (1 - easedProgress) * 0.15;
        if (vignetteAlpha > 0.001) {
          const maxDim = Math.max(width, height);
          const grad = ctx.createRadialGradient(
            centerX,
            centerY,
            maxDim * 0.15,
            centerX,
            centerY,
            maxDim * 0.75,
          );
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          grad.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Cosmic shape glow (drawn before particles for background effect)
      if (state === 'shape_forming') {
        const glowRadius = Math.min(width, height) * (0.35 + beat * 0.1);
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        if (isDarkRef.current) {
          const alpha = 0.06 + beat * 0.04;
          grad.addColorStop(0, `rgba(80, 60, 180, ${alpha})`);
          grad.addColorStop(1, 'rgba(80, 60, 180, 0)');
        } else {
          const alpha = 0.04 + beat * 0.03;
          grad.addColorStop(0, `rgba(100, 120, 160, ${alpha})`);
          grad.addColorStop(1, 'rgba(100, 120, 160, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw layers back-to-front: distant → medium → connections → foreground
      const distant = distantRef.current;
      const medium = mediumRef.current;
      const foreground = foregroundRef.current;
      const maxDim = Math.max(width, height);

      for (let i = 0; i < distant.length; i++)
        drawParticle(ctx, distant[i], now, state, centerX, centerY, maxDim, beat);
      for (let i = 0; i < medium.length; i++)
        drawParticle(ctx, medium[i], now, state, centerX, centerY, maxDim, beat);

      // Connections (medium + foreground only)
      let lineColor = lineColorRef.current;
      if (state === 'shape_forming' && isDarkRef.current) {
        lineColor = 'rgba(150, 170, 255,';
      }
      // Step 6: Build connection grid (reuse unified grid if available, else build fresh)
      const connGrid =
        unifiedGrid ?? buildSpatialGrid(connectableRef.current, connDist, width, height);
      drawConnections(
        ctx,
        connectableRef.current,
        connDist,
        lineColor,
        connGrid,
        dedupBufRef.current,
      );

      for (let i = 0; i < foreground.length; i++)
        drawParticle(ctx, foreground[i], now, state, centerX, centerY, maxDim, beat);

      // Ambient effects: dark = shooting stars, light = bioluminescent ripples
      if (isDarkRef.current) {
        if (state === 'drifting' && Math.random() < 0.002) {
          shootingStarsRef.current.push(spawnShootingStar(width, height));
        }
        shootingStarsRef.current = updateAndDrawShootingStars(
          ctx,
          shootingStarsRef.current,
          width,
          height,
          true,
        );
      } else {
        if (state === 'drifting' && Math.random() < 0.001) {
          ripplesRef.current.push(spawnRipple(particlesRef.current));
        }
        ripplesRef.current = updateAndDrawRipples(ctx, ripplesRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Visibility pausing — stop rAF when tab is hidden
    const handleVisibility = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // IntersectionObserver — pause when canvas is off-screen
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!document.hidden) {
            pausedRef.current = !entry.isIntersecting;
          }
        },
        { threshold: 0 },
      );
      observer.observe(canvas);
    }

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    animate();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      observer?.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(resizeTimeoutRef.current);
      clearTimeout(hintTimerRef.current);
      clearTimeout(autoCollapseTimerRef.current);
    };
  }, [
    initParticles,
    bucketParticles,
    initEmitters,
    updateEmitterPositions,
    drawParticle,
    updateParticle,
    connectionDistance,
    autoCollapseDelay,
    onAutoCollapse,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
