'use client';

import { useEffect, useRef, useCallback } from 'react';

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
  id: number;
  layer: 'distant' | 'medium' | 'foreground';
  depth: number;
  colorTint: { r: number; g: number; b: number };
  shape: ParticleShape;
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
    ctx.lineTo(x + r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
    ctx.lineTo(x - r * Math.cos(Math.PI / 6), y + r * Math.sin(Math.PI / 6));
    ctx.closePath();
  },
  square: (ctx, x, y, r) => {
    const s = r * 0.85;
    ctx.rect(x - s, y - s, s * 2, s * 2);
  },
  hexagon: (ctx, x, y, r) => {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
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
// Spatial Grid Partitioning
// =============================================================================

type SpatialGrid = Map<string, Particle[]>;

const buildSpatialGrid = (particles: Particle[], cellSize: number): SpatialGrid => {
  const grid: SpatialGrid = new Map();
  for (const particle of particles) {
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);
    const key = `${cellX},${cellY}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(particle);
  }
  return grid;
};

const getNeighborParticles = (grid: SpatialGrid, cellX: number, cellY: number): Particle[] => {
  const neighbors: Particle[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cell = grid.get(`${cellX + dx},${cellY + dy}`);
      if (cell) neighbors.push(...cell);
    }
  }
  return neighbors;
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

const SHAPE_NAMES = ['sphere', 'cube', 'pyramid', 'torus'] as const;
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
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function assignStarColorTint(isDark: boolean): { r: number; g: number; b: number } {
  if (!isDark) return { r: 0, g: 0, b: 0 };
  const roll = Math.random();
  if (roll < 0.85) return { r: 255, g: 255, b: 255 };
  if (roll < 0.95) return { r: 200, g: 220, b: 255 };
  return { r: 255, g: 220, b: 180 };
}

function computeWaveForce(
  emitter: WaveEmitter,
  px: number,
  py: number,
  timeSec: number,
  maxDist: number
): { fx: number; fy: number } {
  const dx = px - emitter.x;
  const dy = py - emitter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return { fx: 0, fy: 0 };

  const invDist = 1 / dist;
  const radialX = dx * invDist;
  const radialY = dy * invDist;
  const tangentialX = -dy * invDist;
  const tangentialY = dx * invDist;

  const k = (2 * Math.PI) / emitter.wavelength;
  const omega = (2 * Math.PI) / emitter.period;
  const theta = k * dist - omega * timeSec + emitter.phase;
  const decay = Math.exp((-emitter.decayAlpha * dist) / maxDist);

  const omegaFlare = (2 * Math.PI) / emitter.flarePeriod;
  const halfSin = 0.5 + 0.5 * Math.sin(omegaFlare * timeSec + emitter.flarePhase);
  const envelope = emitter.flareBaseLevel + emitter.flarePeakLevel * halfSin * halfSin;

  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const fr = emitter.radialAmplitude * envelope * sinTheta * decay;
  const ft = emitter.tangentialAmplitude * envelope * cosTheta * decay;

  return {
    fx: fr * radialX + ft * tangentialX,
    fy: fr * radialY + ft * tangentialY,
  };
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
  isDark: boolean
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
        ripple.radius
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
  focalLength: number
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
  focalLen: number
): Array<{ x: number; y: number }> {
  return shape3D.map((p) => {
    const rotated = rotatePoint(p, rotY, rotX);
    return projectTo2D(rotated, cx, cy, focalLen);
  });
}

// =============================================================================
// Connection Drawing
// =============================================================================

function drawConnections(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  connDist: number,
  lineColor: string
) {
  const connDistSq = connDist * connDist;
  const grid = buildSpatialGrid(particles, connDist);

  const batches: Array<Array<[Particle, Particle]>> = Array.from(
    { length: OPACITY_BANDS },
    () => []
  );
  const seen = new Set<string>();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cx = Math.floor(p.x / connDist);
    const cy = Math.floor(p.y / connDist);

    for (const n of getNeighborParticles(grid, cx, cy)) {
      if (p === n) continue;
      const j = n.id;
      const pId = p.id;
      const key = pId < j ? `${pId}-${j}` : `${j}-${pId}`;
      if (seen.has(key)) continue;
      seen.add(key);

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
  beatIntensityRef?: React.RefObject<number>;
}

export function PlexusBackground({
  className = '',
  particleCount = 300,
  connectionDistance = 120,
  gravityStrength = 800,
  autoCollapseDelay,
  onAutoCollapse,
  beatIntensityRef,
}: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<number>(0);
  const channelRef = useRef('255, 255, 255');
  const lineColorRef = useRef('rgba(255, 255, 255,');
  const isDarkRef = useRef(true);

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

  // Gravitational pulse hint
  const hintFiredRef = useRef(false);
  const hintActiveRef = useRef<{ startTime: number } | null>(null);
  const hintTimerRef = useRef<number>(0);

  // Auto-collapse timer
  const autoCollapseTimerRef = useRef<number>(0);

  // Theme detection + nebula/colorTint updates
  useEffect(() => {
    const checkDarkMode = () => document.documentElement.classList.contains('dark');
    const updateTheme = (dark: boolean) => {
      isDarkRef.current = dark;
      channelRef.current = dark ? '255, 255, 255' : '0, 0, 0';
      lineColorRef.current = dark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';
      // Update particle color tints
      for (const p of particlesRef.current) {
        p.colorTint = assignStarColorTint(dark);
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

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.04 * velScale,
          vy: (Math.random() - 0.5) * 0.04 * velScale,
          baseX: 0,
          baseY: 0,
          twinkleSpeed: 0.5 + Math.random() * 2.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleMin,
          twinkleMax,
          radius,
          id: i,
          layer,
          depth,
          colorTint: assignStarColorTint(isDark),
          shape: pickRandomShape(),
        });
      }
      return particles;
    },
    [particleCount]
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
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle, now: number) => {
      const beat = beatIntensityRef?.current ?? 0;
      const t = Math.sin(now * 0.001 * p.twinkleSpeed + p.twinklePhase);
      const baseOpacity = p.twinkleMin + (t * 0.5 + 0.5) * (p.twinkleMax - p.twinkleMin);
      const opacity = Math.min(baseOpacity * (1 + beat * 0.3), 1);
      const { r, g, b } = p.colorTint;

      // Foreground star glow — beat expands radius
      if (p.layer === 'foreground' && opacity > 0.5) {
        const glowRadius = p.radius * (3 + beat * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.15})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      SHAPE_DRAW[p.shape](ctx, p.x, p.y, p.radius);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.fill();
    },
    [beatIntensityRef]
  );

  const updateParticle = useCallback(
    (
      particle: Particle,
      width: number,
      height: number,
      now: number,
      centerX: number,
      centerY: number
    ) => {
      const state = stateRef.current;
      const elapsed = now - stateStartTimeRef.current;
      const depthResponse = 1 - particle.depth;

      if (state === 'drifting') {
        // Mouse interaction (scaled by depth)
        const mouse = mouseRef.current;
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 200) {
          if (isDarkRef.current) {
            // Dark: uniform gravity attract
            const force = (gravityStrength / 80000) * (1 - dist / 200) * depthResponse;
            particle.vx += (dx / dist) * force;
            particle.vy += (dy / dist) * force;
          } else {
            // Light: two-zone wake effect
            if (dist < 80) {
              // Inner zone: repel outward
              const force = (gravityStrength / 40000) * (1 - dist / 80) * depthResponse;
              particle.vx -= (dx / dist) * force;
              particle.vy -= (dy / dist) * force;
            } else {
              // Outer zone (80-200px): weak attract inward
              const force = (gravityStrength / 200000) * (1 - (dist - 80) / 120) * depthResponse;
              particle.vx += (dx / dist) * force;
              particle.vy += (dy / dist) * force;
            }
          }
        }

        // Wave drift — light mode gets full strength (ocean currents), dark is subtle stardust
        const emitters = emittersRef.current;
        const maxDist = Math.sqrt(width * width + height * height);
        const timeSec = now * 0.001;
        const waveMult = isDarkRef.current ? 0.3 : 1.0;
        for (let e = 0; e < emitters.length; e++) {
          const wf = computeWaveForce(emitters[e], particle.x, particle.y, timeSec, maxDist);
          particle.vx += wf.fx * depthResponse * waveMult;
          particle.vy += wf.fy * depthResponse * waveMult;
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

        // Ocean: slow rightward current + gentle vertical bob
        if (!isDarkRef.current) {
          particle.vx += 0.002;
          particle.vy += Math.sin(now * 0.0008 + particle.id * 0.5) * 0.0005;
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
        // Wave perturbations
        const emitters = emittersRef.current;
        const maxDist = Math.sqrt(width * width + height * height);
        const timeSec = now * 0.001;
        for (let e = 0; e < emitters.length; e++) {
          const wf = computeWaveForce(emitters[e], particle.x, particle.y, timeSec, maxDist);
          particle.vx += wf.fx * 0.5 * ease;
          particle.vy += wf.fy * 0.5 * ease;
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

      // Edge wrapping only during drifting/expanding
      if (state === 'drifting' || state === 'expanding') {
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }
    },
    [gravityStrength]
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

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      return { width: rect.width, height: rect.height };
    };

    let { width, height } = setupCanvas();
    dimensionsRef.current = { width, height };

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

    const initShapeForming = (w: number, h: number) => {
      shapeIndexRef.current = 0;
      rotationRef.current = { y: 0, x: 0 };
      prevShapePoints3DRef.current = [];
      shapeTransitionStartRef.current = 0;
      const minDim = Math.min(w, h);
      const baseSize = minDim * (minDim < 500 ? 0.32 : 0.2);
      shapePoints3DRef.current = generateShapePoints(
        SHAPE_NAMES[0],
        particlesRef.current.length,
        baseSize
      );
      shapeTimerRef.current = Date.now();
      const focalLen = Math.min(w, h) * 2;
      shapeTargets2DRef.current = computeShapeTargets(
        shapePoints3DRef.current,
        rotationRef.current.y,
        rotationRef.current.x,
        w / 2,
        h / 2,
        focalLen
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
          shapePoints3DRef.current = generateShapePoints(
            SHAPE_NAMES[shapeIndexRef.current],
            particlesRef.current.length,
            baseSize
          );
          if (prevShapePoints3DRef.current.length > 0) {
            const prevIndex = (shapeIndexRef.current - 1 + SHAPE_NAMES.length) % SHAPE_NAMES.length;
            prevShapePoints3DRef.current = generateShapePoints(
              SHAPE_NAMES[prevIndex],
              particlesRef.current.length,
              baseSize
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
      for (const p of distantRef.current) drawParticle(ctx, p, now);
      for (const p of mediumRef.current) drawParticle(ctx, p, now);
      drawConnections(ctx, connectableRef.current, effectiveConnDist, lineColorRef.current);
      for (const p of foregroundRef.current) drawParticle(ctx, p, now);
      return;
    }

    const animate = () => {
      const now = Date.now();
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

      // State transitions
      if (stateRef.current === 'collapsing' && elapsed >= COLLAPSE_DURATION) {
        stateRef.current = 'shape_forming';
        stateStartTimeRef.current = now;
        initShapeForming(width, height);
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
          shapePoints3DRef.current = generateShapePoints(
            SHAPE_NAMES[shapeIndexRef.current],
            particlesRef.current.length,
            baseSize
          );
          shapeTransitionStartRef.current = now;
          shapeTimerRef.current = now;
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
          focalLen
        );
      }

      // Update emitter positions
      updateEmitterPositions(emittersRef.current, width, height, now * 0.001);

      const particles = particlesRef.current;
      const state = stateRef.current;

      // Update all particles
      for (let i = 0; i < particles.length; i++) {
        updateParticle(particles[i], width, height, now, centerX, centerY);
      }

      // Clear hint after pulse duration
      if (
        hintActiveRef.current &&
        now - hintActiveRef.current.startTime >= HINT_PULSE_DURATION_MS
      ) {
        hintActiveRef.current = null;
      }

      // Cosmic shape glow (drawn before particles for background effect)
      if (state === 'shape_forming') {
        const shapeBeat = beatIntensityRef?.current ?? 0;
        const glowRadius = Math.min(width, height) * (0.35 + shapeBeat * 0.1);
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        if (isDarkRef.current) {
          const alpha = 0.06 + shapeBeat * 0.04;
          grad.addColorStop(0, `rgba(80, 60, 180, ${alpha})`);
          grad.addColorStop(1, 'rgba(80, 60, 180, 0)');
        } else {
          const alpha = 0.04 + shapeBeat * 0.03;
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

      for (let i = 0; i < distant.length; i++) drawParticle(ctx, distant[i], now);
      for (let i = 0; i < medium.length; i++) drawParticle(ctx, medium[i], now);

      // Connections (medium + foreground only) — light mode: 20% longer range
      const beat = beatIntensityRef?.current ?? 0;
      const baseConnDist =
        (isDarkRef.current ? effectiveConnDist : effectiveConnDist * 1.2) * (1 + beat * 0.3);
      const connDist =
        state === 'collapsing' || state === 'shape_forming' ? baseConnDist * 0.6 : baseConnDist;
      let lineColor = lineColorRef.current;
      if (state === 'shape_forming' && isDarkRef.current) {
        lineColor = 'rgba(150, 170, 255,';
      }
      drawConnections(ctx, connectableRef.current, connDist, lineColor);

      for (let i = 0; i < foreground.length; i++) drawParticle(ctx, foreground[i], now);

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
          true
        );
      } else {
        if (state === 'drifting' && Math.random() < 0.001) {
          ripplesRef.current.push(spawnRipple(particlesRef.current));
        }
        ripplesRef.current = updateAndDrawRipples(ctx, ripplesRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    animate();

    return () => {
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
    beatIntensityRef,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
