// =============================================================================
// Shape generators for plexus-background
// Pure functions with no React dependencies.
// =============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ShapeConfig {
  generate: (n: number) => Point3D[];
  /** Rotation speeds (rad/s) around each axis — gives each shape a unique tumble */
  spinX: number;
  spinY: number;
  spinZ: number;
  /** Multiplier on FRACTAL_SCALE — >1 enlarges footprint (less dense), <1 tightens */
  spread?: number;
  /** Multiplier on MICRO_JITTER — >1 adds more breathing motion, <1 tightens */
  jitter?: number;
  /** Multiplier on FRACTAL_LERP_SPEED — <1 slows convergence (more drift), >1 snaps faster */
  lerpMul?: number;
}

export interface CodexEntry {
  shape: ShapeConfig;
  quote: string;
  holdMs: number;
}

// =============================================================================
// Helpers
// =============================================================================

/** Box-Muller transform: returns a standard-normal random variate */
function gaussRandom(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Normalize 3D points into [-1,1] range using a single uniform scale factor */
function normalize3D(pts: Point3D[]): Point3D[] {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  return pts.map((p) => ({
    x: ((p.x - cx) / span) * 2,
    y: ((p.y - cy) / span) * 2,
    z: ((p.z - cz) / span) * 2,
  }));
}

/**
 * Normalize galaxy points preserving the thin disk shape
 * (generic normalize3D would inflate Z independently).
 */
function normalizeGalaxy(pts: Point3D[]): Point3D[] {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  return pts.map((p) => ({
    x: ((p.x - cx) / span) * 2,
    y: ((p.y - cy) / span) * 2,
    z: ((p.z - cz) / span) * 2,
  }));
}

/** Sample n evenly-spaced points along a 3D polyline path */
function sampleAlongPath3D(path: Point3D[], n: number): Point3D[] {
  if (path.length < 2 || n <= 0) return [];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const dz = path[i].z - path[i - 1].z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return Array.from({ length: n }, () => ({ ...path[0] }));
  const pts: Point3D[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    let acc = 0;
    for (let j = 0; j < segLens.length; j++) {
      if (acc + segLens[j] >= d || j === segLens.length - 1) {
        const t = segLens[j] > 0 ? (d - acc) / segLens[j] : 0;
        pts.push({
          x: path[j].x + (path[j + 1].x - path[j].x) * t,
          y: path[j].y + (path[j + 1].y - path[j].y) * t,
          z: path[j].z + (path[j + 1].z - path[j].z) * t,
        });
        break;
      }
      acc += segLens[j];
    }
  }
  return pts;
}

/** Sample n points across multiple 3D polyline paths, proportional to path length */
function sampleMultiPath3D(paths: Point3D[][], n: number): Point3D[] {
  const lens: number[] = [];
  let total = 0;
  for (const path of paths) {
    let len = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const dz = path[i].z - path[i - 1].z;
      len += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    lens.push(len);
    total += len;
  }
  if (total === 0) return [];
  const pts: Point3D[] = [];
  let remaining = n;
  for (let i = 0; i < paths.length; i++) {
    const count =
      i === paths.length - 1 ? remaining : Math.max(2, Math.round((n * lens[i]) / total));
    const actual = Math.min(count, remaining);
    if (actual > 0) {
      pts.push(...sampleAlongPath3D(paths[i], actual));
      remaining -= actual;
    }
    if (remaining <= 0) break;
  }
  return pts;
}

// =============================================================================
// Shape generators
// =============================================================================

// --- 1. Faravahar (Zoroastrian winged sun disc) ---

function generateFaravahar(n: number): Point3D[] {
  const paths: Point3D[][] = [];
  // Central disc
  const disc: Point3D[] = [];
  for (let i = 0; i <= 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    disc.push({ x: 0.12 * Math.cos(a), y: 0.12 * Math.sin(a), z: 0 });
  }
  paths.push(disc);
  // Three layers of wings
  for (let layer = 0; layer < 3; layer++) {
    const r = 0.35 + layer * 0.22;
    const sweep = 0.7 + layer * 0.2;
    const yOff = layer * 0.06;
    const left: Point3D[] = [];
    const right: Point3D[] = [];
    for (let i = 0; i <= 25; i++) {
      const t = i / 25;
      const a = Math.PI - sweep + t * sweep;
      left.push({ x: -0.15 + r * Math.cos(a), y: yOff + r * Math.sin(a) * 0.35, z: 0 });
      const a2 = sweep - t * sweep;
      right.push({ x: 0.15 + r * Math.cos(a2), y: yOff + r * Math.sin(a2) * 0.35, z: 0 });
    }
    paths.push(left, right);
  }
  // Tail streamers
  paths.push(
    [
      { x: 0, y: -0.15, z: 0 },
      { x: 0, y: -0.6, z: 0 },
    ],
    [
      { x: -0.05, y: -0.15, z: 0 },
      { x: -0.2, y: -0.55, z: 0 },
    ],
    [
      { x: 0.05, y: -0.15, z: 0 },
      { x: 0.2, y: -0.55, z: 0 },
    ],
  );
  return normalize3D(sampleMultiPath3D(paths, n));
}

// --- 2. Heptagram (Tajik {7/2} star polygon) ---

function generateHeptagram(n: number): Point3D[] {
  const paths: Point3D[][] = [];
  // {7/2} star polygon — connects every 2nd vertex
  const star: Point3D[] = [];
  for (let i = 0; i <= 7; i++) {
    const vertIdx = (i * 2) % 7;
    const angle = (vertIdx / 7) * Math.PI * 2 - Math.PI / 2;
    star.push({ x: Math.cos(angle), y: Math.sin(angle), z: 0 });
  }
  paths.push(star);
  // {7/3} inner star polygon for visual density
  const inner: Point3D[] = [];
  for (let i = 0; i <= 7; i++) {
    const vertIdx = (i * 3) % 7;
    const angle = (vertIdx / 7) * Math.PI * 2 - Math.PI / 2;
    inner.push({ x: 0.55 * Math.cos(angle), y: 0.55 * Math.sin(angle), z: 0 });
  }
  paths.push(inner);
  // Circumscribing circle
  const ring: Point3D[] = [];
  for (let i = 0; i <= 70; i++) {
    const a = (i / 70) * Math.PI * 2;
    ring.push({ x: Math.cos(a), y: Math.sin(a), z: 0 });
  }
  paths.push(ring);
  return normalize3D(sampleMultiPath3D(paths, n));
}

// --- 3. Girih Decagon (Persian geometric tile) ---

function generateGirihDecagon(n: number): Point3D[] {
  const paths: Point3D[][] = [];
  // Outer decagon
  const decVerts: Point3D[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    decVerts.push({ x: Math.cos(angle), y: Math.sin(angle), z: 0 });
  }
  paths.push([...decVerts, decVerts[0]]);
  // Internal {10/3} star lines — the classic girih strapwork
  for (let i = 0; i < 10; i++) {
    paths.push([decVerts[i], decVerts[(i + 3) % 10]]);
  }
  return normalize3D(sampleMultiPath3D(paths, n));
}

// --- 4. Flower of Life (sacred geometry) ---

function generateFlowerOfLife(n: number): Point3D[] {
  const paths: Point3D[][] = [];
  const r = 0.35;
  const makeCircle = (cx: number, cy: number): Point3D[] => {
    const c: Point3D[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      c.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), z: 0 });
    }
    return c;
  };
  // Center circle
  paths.push(makeCircle(0, 0));
  // First ring of 6
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    paths.push(makeCircle(r * Math.cos(a), r * Math.sin(a)));
  }
  return normalize3D(sampleMultiPath3D(paths, n));
}

// --- 5. Sierpinski Triangle (fractal) ---

function generateSierpinski(n: number): Point3D[] {
  const verts: Point3D[] = [
    { x: 0, y: -1, z: 0 },
    { x: -Math.sqrt(3) / 2, y: 0.5, z: 0 },
    { x: Math.sqrt(3) / 2, y: 0.5, z: 0 },
  ];
  const pts: Point3D[] = [];
  let x = 0,
    y = 0;
  for (let i = 0; i < n + 20; i++) {
    const v = verts[Math.floor(Math.random() * 3)];
    x = (x + v.x) / 2;
    y = (y + v.y) / 2;
    if (i >= 20) pts.push({ x, y, z: 0 });
  }
  return normalize3D(pts);
}

// --- 6. Lorenz Attractor (chaos theory) ---

function generateLorenzAttractor(n: number): Point3D[] {
  const pts: Point3D[] = [];
  let x = 0.1,
    y = 0,
    z = 0;
  const sigma = 10,
    rho = 28,
    beta = 8 / 3;
  const dt = 0.005;
  const warmup = 500;
  const steps = n + warmup;
  for (let i = 0; i < steps; i++) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    if (i >= warmup) {
      pts.push({ x, y, z });
    }
  }
  return normalize3D(pts);
}

// --- 7. Golden Spiral (Fibonacci / nature) ---

function generateGoldenSpiral(n: number): Point3D[] {
  const pts: Point3D[] = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  const b = Math.log(phi) / (Math.PI / 2);
  const maxTheta = 6 * Math.PI;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * maxTheta;
    const r = 0.02 * Math.exp(b * t);
    pts.push({ x: r * Math.cos(t), y: r * Math.sin(t), z: 0 });
  }
  return normalize3D(pts);
}

// --- 8. Galaxy Spiral (cosmic identity) ---

function generateGalaxySpiral(n: number): Point3D[] {
  const pts: Point3D[] = [];

  const numMajorArms = 4;
  const numMinorArms = 2;
  const pitchDeg = 12;
  const b = Math.tan((pitchDeg * Math.PI) / 180);

  const bulgeFrac = 0.15;
  const fieldFrac = 0.2;
  const armFrac = 1 - bulgeFrac - fieldFrac;

  const nBulge = Math.round(n * bulgeFrac);
  const nField = Math.round(n * fieldFrac);
  const nArms = n - nBulge - nField;

  const majorWeight = 2;
  const minorWeight = 1;
  const totalWeight = numMajorArms * majorWeight + numMinorArms * minorWeight;
  const nPerMajor = Math.round((nArms * majorWeight) / totalWeight);
  const nPerMinor = Math.round((nArms * minorWeight) / totalWeight);

  // Spiral arms
  const totalArms = numMajorArms + numMinorArms;
  for (let arm = 0; arm < totalArms; arm++) {
    const isMajor = arm < numMajorArms;
    const count = isMajor ? nPerMajor : nPerMinor;
    const baseAngle = isMajor
      ? (arm / numMajorArms) * Math.PI * 2
      : ((arm - numMajorArms) / numMinorArms) * Math.PI * 2 + Math.PI / 4;
    const armWidth = isMajor ? 0.12 : 0.08;

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      const r = 0.1 + t * 0.9;
      const theta = baseAngle + Math.log(r / 0.02 + 1) / b;
      const scatter = gaussRandom() * armWidth * (0.5 + r * 0.5);
      const px = r * Math.cos(theta) + scatter * Math.cos(theta + Math.PI / 2);
      const py = r * Math.sin(theta) + scatter * Math.sin(theta + Math.PI / 2);
      const zScale = 0.04 * Math.exp(-r * 2.5);
      const pz = gaussRandom() * zScale;
      pts.push({ x: px, y: py, z: pz });
    }
  }

  // Central bulge
  for (let i = 0; i < nBulge; i++) {
    const r = Math.abs(gaussRandom()) * 0.15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pts.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi) * 0.4,
    });
  }

  // Field stars
  for (let i = 0; i < nField; i++) {
    const r = -0.3 * Math.log(1 - Math.random() * 0.99);
    const theta = Math.random() * Math.PI * 2;
    const zScale = 0.03 * Math.exp(-r * 2);
    pts.push({
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
      z: gaussRandom() * zScale,
    });
  }

  return normalizeGalaxy(pts);
}

// =============================================================================
// Shape configurations
// =============================================================================

const faravaharShape: ShapeConfig = {
  generate: generateFaravahar,
  spinX: 0.02,
  spinY: 0.04,
  spinZ: 0.06,
  spread: 1.2,
};

const heptagramShape: ShapeConfig = {
  generate: generateHeptagram,
  spinX: 0.03,
  spinY: 0.06,
  spinZ: 0.08,
};

const girihDecagonShape: ShapeConfig = {
  generate: generateGirihDecagon,
  spinX: 0,
  spinY: 0.05,
  spinZ: 0.1,
  spread: 1.1,
};

const flowerOfLifeShape: ShapeConfig = {
  generate: generateFlowerOfLife,
  spinX: 0.02,
  spinY: 0.06,
  spinZ: 0.04,
};

const sierpinskiShape: ShapeConfig = {
  generate: generateSierpinski,
  spinX: 0.05,
  spinY: 0.08,
  spinZ: 0,
  spread: 1.1,
};

const lorenzShape: ShapeConfig = {
  generate: generateLorenzAttractor,
  spinX: 0.04,
  spinY: 0.06,
  spinZ: 0.03,
};

const goldenSpiralShape: ShapeConfig = {
  generate: generateGoldenSpiral,
  spinX: 0,
  spinY: 0.03,
  spinZ: 0.1,
  spread: 1.1,
};

const galaxyShape: ShapeConfig = {
  generate: generateGalaxySpiral,
  spinX: 0,
  spinY: 0,
  spinZ: 0.12,
  spread: 1.4,
  jitter: 0.6,
  lerpMul: 0.6,
};

// =============================================================================
// Codex — the curated narrative sequence
// =============================================================================

export const CODEX: CodexEntry[] = [
  {
    shape: faravaharShape,
    quote: '\u201CGOOD THOUGHTS, GOOD WORDS, GOOD DEEDS\u201D \u2014 ZARATHUSTRA',
    holdMs: 10_000,
  },
  {
    shape: heptagramShape,
    quote: '\u201CTHE WOUND IS THE PLACE WHERE THE LIGHT ENTERS YOU\u201D \u2014 RUMI',
    holdMs: 10_000,
  },
  {
    shape: girihDecagonShape,
    quote: '\u201CWHERE THERE IS RUIN, THERE IS HOPE FOR A TREASURE\u201D \u2014 RUMI',
    holdMs: 10_000,
  },
  {
    shape: flowerOfLifeShape,
    quote: '\u201CMUSIC IS THE UNIVERSAL LANGUAGE OF MANKIND\u201D \u2014 LONGFELLOW',
    holdMs: 10_000,
  },
  {
    shape: sierpinskiShape,
    quote: '\u201CTHE UNIVERSE IS WRITTEN IN THE LANGUAGE OF MATHEMATICS\u201D \u2014 GALILEO',
    holdMs: 10_000,
  },
  {
    shape: lorenzShape,
    quote: '\u201CTHE UNEXAMINED LIFE IS NOT WORTH LIVING\u201D \u2014 SOCRATES',
    holdMs: 10_000,
  },
  {
    shape: goldenSpiralShape,
    quote: '\u201CNO MAN IS FREE WHO IS NOT MASTER OF HIMSELF\u201D \u2014 EPICTETUS',
    holdMs: 10_000,
  },
  {
    shape: galaxyShape,
    quote: '/\u028A\u0259r\u02C8mu\u02D0zd m\u028A\u02CChɑ\u02D0m\u0251d\u02C8na\u026Am/',
    holdMs: 15_000,
  },
];
