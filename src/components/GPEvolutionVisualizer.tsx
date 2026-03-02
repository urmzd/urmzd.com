'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

// ── Simulation ────────────────────────────────────────────────────────────────

const SIM_STEPS = 80;
const NUM_GENS = 100;
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
  { label: 'Test', detail: 'Run & Score' },
  { label: 'Select', detail: 'Keep the Best' },
  { label: 'Breed', detail: 'Mix Winners' },
  { label: 'Mutate', detail: 'Add Variation' },
] as const;

const DOT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
];

type Phase = 'idle' | 'evaluating' | 'selecting' | 'crossover' | 'mutating';

// ── Chart helpers ─────────────────────────────────────────────────────────────

const CHART_W = 500;
const CHART_H = 210;
const PAD_L = 30;
const PAD_R = 10;
const PAD_T = 15;
const PAD_B = 35;
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
  const [speed, setSpeed] = useState(4);
  const [stripStep, setStripStep] = useState(0);

  // Precompute all generation data once
  useEffect(() => {
    const tid = setTimeout(() => {
      setData(computeAll(NUM_RUNNERS, NUM_GENS));
      setLoading(false);
    }, 0);
    return () => clearTimeout(tid);
  }, []);

  // Phase state machine: eval fitness → select → crossover → mutate → repeat
  useEffect(() => {
    if (!playing || !data.length || phase === 'idle') return;

    const tickMs = Math.max(1, Math.round(8 / speed));
    const pauseMs = Math.max(10, Math.round(100 / speed));
    const stepsPerTick = Math.max(1, Math.floor(speed * 3));
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'evaluating') {
      timer =
        step < SIM_STEPS
          ? setTimeout(() => setStep((s) => Math.min(s + stepsPerTick, SIM_STEPS)), tickMs)
          : setTimeout(() => setPhase('selecting'), pauseMs);
    } else if (phase === 'selecting') {
      timer = setTimeout(() => setPhase('crossover'), pauseMs * 1.3);
    } else if (phase === 'crossover') {
      timer = setTimeout(() => setPhase('mutating'), pauseMs * 1.3);
    } else if (phase === 'mutating') {
      timer =
        gen < data.length - 1
          ? setTimeout(() => {
              setGen((g) => g + 1);
              setStep(0);
              setPhase('evaluating');
            }, pauseMs)
          : setTimeout(() => {
              setPlaying(false);
              setPhase('idle');
            }, pauseMs);
    }

    return () => clearTimeout(timer);
  }, [playing, phase, step, gen, speed, data]);

  // Each phase maps directly to a strip step
  useEffect(() => {
    if (phase === 'evaluating') setStripStep(0);
    else if (phase === 'selecting') setStripStep(1);
    else if (phase === 'crossover') setStripStep(2);
    else if (phase === 'mutating') setStripStep(3);
    else setStripStep(0);
  }, [phase]);

  function handlePlay() {
    if (phase === 'idle' && data.length) {
      setPhase('evaluating');
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
  const bestDist = Math.max(...runners.map((r) => r.distance));

  // Global max distance — y-axis shared across all generations
  const globalMaxDist = Math.max(...data.flatMap((gd) => gd.runners.map((r) => r.distance)), 1);

  // How many generations have fully completed
  const completedGens = (() => {
    if (phase === 'selecting' || phase === 'crossover' || phase === 'mutating') return gen + 1;
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
    evaluating: `Evaluating… ${Math.round((step / SIM_STEPS) * 100)}%`,
    selecting: 'Selecting…',
    crossover: 'Crossing over…',
    mutating: gen < data.length - 1 ? 'Mutating…' : 'Evolution complete',
  };

  return (
    <div className="not-prose my-4 space-y-3 rounded-lg border border-border bg-muted/20">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
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
            max={8}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="w-20 accent-primary"
          />
          <span className="w-6 font-mono">{speed}×</span>
        </label>
        <span className="ml-auto text-[12px] text-muted-foreground">{statusText[phase]}</span>
      </div>

      <div className="space-y-3 px-4 pb-4">
        {/* Status bar */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-mono font-semibold">
            Gen {gen + 1} / {data.length}
            {phase !== 'idle' ? ` | Best: ${bestDist.toFixed(1)} u` : ''}
          </span>
        </div>

        {/* Fitness history chart */}
        <div>
          <div className="mb-1 text-center text-[10px] text-muted-foreground">Fitness History</div>
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full">
            {/* Y-axis label */}
            <text
              x={10}
              y={PAD_T + INNER_H / 2}
              textAnchor="middle"
              transform={`rotate(-90 10 ${PAD_T + INNER_H / 2})`}
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.5}
            >
              Fitness
            </text>

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

            {/* X-axis generation labels — show every 10th */}
            {data.map((_, g) =>
              g === 0 || (g + 1) % 10 === 0 ? (
                <text
                  key={g}
                  x={colX(g, data.length)}
                  y={PAD_T + INNER_H + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fill="currentColor"
                  fillOpacity={0.5}
                >
                  {g + 1}
                </text>
              ) : null,
            )}

            {/* Connecting line through best dots */}
            {bestPoints.length > 1 && (
              <polyline
                points={bestPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="var(--success)"
                strokeWidth={1.5}
                strokeOpacity={0.75}
              />
            )}

            {/* Dots per completed generation */}
            {Array.from({ length: completedGens }, (_, g) => {
              const gd = data[g];
              const bestIdx = gd.topIndices[0];
              const cx = colX(g, data.length);
              const isCurrentGen = g === completedGens - 1;

              return gd.runners.map((runner, ri) => {
                const cy = dotY(runner.distance, globalMaxDist);
                const isBest = ri === bestIdx;

                return isCurrentGen ? (
                  <motion.circle
                    key={`${g}-${ri}`}
                    cx={cx}
                    cy={cy}
                    r={isBest ? 4 : 2.5}
                    fill={DOT_COLORS[ri]}
                    fillOpacity={isBest ? 1 : 0.65}
                    stroke={isBest ? 'var(--success)' : 'none'}
                    strokeWidth={isBest ? 1.5 : 0}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center center' }}
                  />
                ) : (
                  <circle
                    key={`${g}-${ri}`}
                    cx={cx}
                    cy={cy}
                    r={isBest ? 4 : 2.5}
                    fill={DOT_COLORS[ri]}
                    fillOpacity={isBest ? 1 : 0.65}
                    stroke={isBest ? 'var(--success)' : 'none'}
                    strokeWidth={isBest ? 1.5 : 0}
                  />
                );
              });
            })}
            {/* X-axis label */}
            <text
              x={PAD_L + INNER_W / 2}
              y={PAD_T + INNER_H + 28}
              textAnchor="middle"
              fontSize={8}
              fill="currentColor"
              fillOpacity={0.5}
            >
              Generations
            </text>
          </svg>
        </div>

        {/* Phase strip — below chart */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-border pt-3">
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
      </div>
    </div>
  );
}
