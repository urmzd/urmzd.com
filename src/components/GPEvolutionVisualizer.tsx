'use client';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

// ── Simulation ────────────────────────────────────────────────────────────────

const SIM_STEPS = 80;
const NUM_GENS = 4;
const NUM_RUNNERS = 6;

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number): number {
  const u = Math.max(rng(), 1e-10);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function simulate(g: number[]): number[] {
  // Genome: [power, ramp_rate, fatigue_rate, clearance_rate]
  const power = 0.3 + Math.abs(g[0]) * 0.7; // peak output: 0.3–1.0
  const rampRate = 0.03 + Math.abs(g[1]) * 0.17; // effort ramp: 0.03–0.20
  const fatigueK = 0.04 + Math.abs(g[2]) * 0.22; // lactate production per effort unit: 0.04–0.26
  const clearK = 0.02 + Math.abs(g[3]) * 0.13; // lactate clearance rate: 0.02–0.15

  let x = 0;
  let lactate = 0;
  const xs = [0];

  for (let t = 1; t <= SIM_STEPS; t++) {
    // Effort ramps up sigmoidally — "effective start time" varies by rampRate
    const effort = power * (1 - Math.exp(-rampRate * t));
    // Lactate accumulates when production exceeds clearance
    lactate = Math.max(0, lactate + effort * fatigueK - clearK * lactate);
    // Speed is effort attenuated by lactate; floor at 5% so runners never fully stop
    const speed = effort * Math.max(0.05, 1 - lactate);
    x += speed;
    xs.push(x);
  }
  return xs;
}

interface Runner {
  weights: number[];
  positions: number[];
  distance: number;
}

interface GenData {
  runners: Runner[];
  topIndices: number[];
}

function computeAll(n: number, gens: number): GenData[] {
  const rng = mulberry32(42);
  let pop = Array.from({ length: n }, () => Array.from({ length: 4 }, () => rng() * 2 - 1));
  const result: GenData[] = [];

  for (let g = 0; g < gens; g++) {
    const runners: Runner[] = pop.map((w) => {
      const positions = simulate(w);
      return { weights: w, positions, distance: Math.max(0, positions[SIM_STEPS]) };
    });

    const topN = Math.max(1, Math.floor(n / 3));
    const sorted = runners.map((r, i) => ({ d: r.distance, i })).sort((a, b) => b.d - a.d);
    const topIndices = sorted.slice(0, topN).map((r) => r.i);
    result.push({ runners, topIndices });

    const topPop = topIndices.map((i) => pop[i]);
    const newPop: number[][] = [];
    while (newPop.length < n) {
      const parent = topPop[Math.floor(rng() * topPop.length)];
      newPop.push(parent.map((v) => v + gauss(rng) * 0.2));
    }
    pop = newPop;
  }

  return result;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Population', detail: '6 runners' },
  { label: 'Sim Run', detail: '80 timesteps' },
  { label: 'Fitness', detail: 'distance ran' },
  { label: 'Select Top', detail: 'top 2 survive' },
  { label: 'Mutate', detail: 'Gaussian noise' },
] as const;

const LANE_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-400',
  'bg-pink-500',
  'bg-teal-500',
  'bg-yellow-500',
];

const DOT_COLORS = ['#3b82f6', '#a855f7', '#fb923c', '#ec4899', '#14b8a6', '#eab308'];

type Phase = 'idle' | 'running' | 'selecting' | 'mutating';

// ── Chart helpers ─────────────────────────────────────────────────────────────

const CHART_W = 200;
const CHART_H = 120;
const PAD_L = 20;
const PAD_R = 10;
const PAD_T = 10;
const PAD_B = 20;
const INNER_W = CHART_W - PAD_L - PAD_R;
const INNER_H = CHART_H - PAD_T - PAD_B;

function colX(g: number, numGens: number): number {
  return PAD_L + (numGens <= 1 ? INNER_W / 2 : (g * INNER_W) / (numGens - 1));
}

function dotY(dist: number, globalMax: number): number {
  return PAD_T + INNER_H - (dist / globalMax) * INNER_H;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GPEvolutionVisualizer() {
  const [data, setData] = useState<GenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [stripStep, setStripStep] = useState(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Precompute all generation data once
  useEffect(() => {
    const tid = setTimeout(() => {
      setData(computeAll(NUM_RUNNERS, NUM_GENS));
      setLoading(false);
    }, 0);
    return () => clearTimeout(tid);
  }, []);

  // Phase state machine
  useEffect(() => {
    if (!playing || !data.length || phase === 'idle') return;

    const tickMs = Math.max(15, Math.round(50 / speed));
    const pauseMs = Math.max(300, Math.round(900 / speed));
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'running') {
      timer =
        step < SIM_STEPS
          ? setTimeout(() => setStep((s) => s + 1), tickMs)
          : setTimeout(() => setPhase('selecting'), pauseMs);
    } else if (phase === 'selecting') {
      timer = setTimeout(() => setPhase('mutating'), pauseMs * 1.3);
    } else if (phase === 'mutating') {
      timer =
        gen < data.length - 1
          ? setTimeout(() => {
              setGen((g) => g + 1);
              setStep(0);
              setPhase('running');
            }, pauseMs)
          : setTimeout(() => {
              setPlaying(false);
              setPhase('idle');
            }, pauseMs);
    }

    return () => clearTimeout(timer);
  }, [playing, phase, step, gen, speed, data]);

  // Derive strip step from phase (replaces custom-event bridge)
  useEffect(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
    }

    if (phase === 'running') {
      setStripStep(0);
      pendingRef.current = setTimeout(
        () => setStripStep(1),
        Math.max(120, Math.round(400 / speed)),
      );
    } else if (phase === 'selecting') {
      setStripStep(2);
      pendingRef.current = setTimeout(
        () => setStripStep(3),
        Math.max(120, Math.round(500 / speed)),
      );
    } else if (phase === 'mutating') {
      setStripStep(4);
    } else {
      setStripStep(0);
    }

    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
    };
  }, [phase, speed]);

  function handlePlay() {
    if (phase === 'idle' && data.length) {
      setPhase('running');
      setStep(0);
    }
    setPlaying((p) => !p);
  }

  function handleReset() {
    setPlaying(false);
    setPhase('idle');
    setGen(0);
    setStep(0);
  }

  if (loading) {
    return (
      <div className="not-prose flex items-center justify-center rounded-lg border border-border p-8 text-sm text-muted-foreground">
        Initialising simulation…
      </div>
    );
  }

  const { runners, topIndices } = data[gen];
  const maxDist = Math.max(...runners.map((r) => Math.max(...r.positions)), 1);
  const bestDist = Math.max(...runners.map((r) => r.distance));

  // Global max distance — y-axis shared across all generations
  const globalMaxDist = Math.max(...data.flatMap((gd) => gd.runners.map((r) => r.distance)), 1);

  // How many generations have fully completed
  const completedGens = (() => {
    if (phase === 'selecting' || phase === 'mutating') return gen + 1;
    if (phase === 'idle' && gen > 0) return data.length;
    return gen;
  })();

  // Best-dot positions for connecting line
  const bestPoints = Array.from({ length: completedGens }, (_, g) => {
    const gd = data[g];
    const idx = gd.topIndices[0];
    return {
      x: colX(g, data.length),
      y: dotY(gd.runners[idx].distance, globalMaxDist),
    };
  });

  const statusText: Record<Phase, string> = {
    idle: 'Press ▶ to start',
    running: `Running… ${Math.round((step / SIM_STEPS) * 100)}%`,
    selecting: 'Selecting survivors…',
    mutating: gen < data.length - 1 ? 'Breeding next generation…' : 'Evolution complete',
  };

  return (
    <div className="not-prose my-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4">
      {/* Phase strip */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: stripStep === i ? 1.06 : 1, y: stripStep === i ? -2 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'flex min-w-[76px] flex-col items-center rounded-md px-2 py-1.5 text-center transition-colors duration-300',
                stripStep === i
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-muted-foreground',
              )}
            >
              <span className="text-[11px] font-semibold leading-tight">{s.label}</span>
              <span className="mt-0.5 text-[10px] opacity-75">{s.detail}</span>
            </motion.div>
            <span
              className={cn(
                'text-sm transition-opacity duration-300',
                stripStep === i ? 'text-primary opacity-100' : 'text-muted-foreground opacity-35',
              )}
            >
              {i < STEPS.length - 1 ? '→' : '↩'}
            </span>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-mono font-semibold">
          Gen {gen + 1} / {data.length}
          {phase !== 'idle' ? ` | Best: ${bestDist.toFixed(1)} u` : ''}
        </span>
        <span className="text-muted-foreground">{statusText[phase]}</span>
      </div>

      {/* Race track + Fitness chart */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Race track */}
        <div className="min-w-0 flex-1 space-y-2">
          {runners.map((runner, i) => {
            const curX = runner.positions[Math.min(step, SIM_STEPS)];
            const pct = Math.max(0, Math.min(curX / maxDist, 1));
            const dotLeft = 5 + pct * 85;
            const isTop = topIndices.includes(i);
            const fading = (phase === 'selecting' || phase === 'mutating') && !isTop;
            const rising = (phase === 'selecting' || phase === 'mutating') && isTop;

            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  G{i + 1}
                </span>

                <div className="relative h-6 flex-1 rounded bg-muted/40">
                  {/* Trail */}
                  <motion.div
                    className={cn(
                      'absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full',
                      LANE_COLORS[i],
                    )}
                    animate={{ width: `${dotLeft}%`, opacity: fading ? 0.1 : 0.35 }}
                    transition={{ duration: phase === 'running' ? 0.04 : 0.35, ease: 'linear' }}
                  />
                  {/* Runner dot */}
                  <motion.div
                    className={cn(
                      'absolute top-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[8px] font-bold text-white shadow',
                      LANE_COLORS[i],
                      rising && 'ring-2 ring-green-400',
                    )}
                    animate={{
                      left: `${dotLeft}%`,
                      opacity: fading ? 0.2 : 1,
                      scale: rising ? 1.2 : 1,
                    }}
                    transition={{ duration: phase === 'running' ? 0.04 : 0.35, ease: 'linear' }}
                  >
                    {i + 1}
                  </motion.div>
                </div>

                <span className="w-14 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {phase !== 'idle' ? `${Math.max(0, curX).toFixed(1)} u` : ''}
                </span>
              </div>
            );
          })}

          {/* Track scale */}
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="w-5 shrink-0" />
            <div className="flex flex-1 justify-between px-1">
              <span>0</span>
              <span>{(maxDist / 2).toFixed(0)} u</span>
              <span>{maxDist.toFixed(0)} u</span>
            </div>
            <span className="w-14 shrink-0" />
          </div>
        </div>

        {/* Fitness history chart */}
        <div className="shrink-0">
          <div className="mb-1 text-center text-[10px] text-muted-foreground">Fitness history</div>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            width={CHART_W}
            height={CHART_H}
            className="overflow-visible"
          >
            {/* Axes */}
            <line
              x1={PAD_L}
              y1={PAD_T}
              x2={PAD_L}
              y2={PAD_T + INNER_H}
              stroke="currentColor"
              strokeOpacity={0.15}
            />
            <line
              x1={PAD_L}
              y1={PAD_T + INNER_H}
              x2={PAD_L + INNER_W}
              y2={PAD_T + INNER_H}
              stroke="currentColor"
              strokeOpacity={0.15}
            />

            {/* X-axis generation labels */}
            {data.map((_, g) => (
              <text
                key={g}
                x={colX(g, data.length)}
                y={CHART_H - 4}
                textAnchor="middle"
                fontSize={8}
                fill="currentColor"
                fillOpacity={0.5}
              >
                G{g + 1}
              </text>
            ))}

            {/* Connecting line through best dots */}
            {bestPoints.length > 1 && (
              <polyline
                points={bestPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth={1.5}
                strokeOpacity={0.75}
              />
            )}

            {/* Dots per completed generation */}
            {Array.from({ length: completedGens }, (_, g) => {
              const gd = data[g];
              const bestIdx = gd.topIndices[0];
              const cx = colX(g, data.length);

              return gd.runners.map((runner, ri) => {
                const cy = dotY(runner.distance, globalMaxDist);
                const isBest = ri === bestIdx;

                return (
                  <motion.circle
                    key={`${g}-${ri}`}
                    cx={cx}
                    cy={cy}
                    r={isBest ? 4 : 2.5}
                    fill={DOT_COLORS[ri]}
                    fillOpacity={isBest ? 1 : 0.65}
                    stroke={isBest ? '#22c55e' : 'none'}
                    strokeWidth={isBest ? 1.5 : 0}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
                  />
                );
              });
            })}
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={handlePlay}
          className="rounded border border-border bg-card px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
        >
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={handleReset}
          className="rounded border border-border bg-card px-3 py-1 text-sm font-medium transition-colors hover:bg-muted"
        >
          ↺ Reset
        </button>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          Speed
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="w-20 accent-primary"
          />
          <span className="w-6 font-mono">{speed}×</span>
        </label>
      </div>
    </div>
  );
}
