'use client';

import { motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const FONT = '"elza-text",sans-serif';

const TXT = {
  SM: {
    fontSize: '10',
    letterSpacing: '.15em',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  MD: {
    fontSize: '12',
    letterSpacing: '.12em',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
  LG: {
    fontSize: '14',
    letterSpacing: '.1em',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
  BODY: {
    fontSize: '11',
    letterSpacing: '.1em',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
  },
} as const;

// ─── 1. Critical Thinking Loop (Intro) ─────────────────────────────────────

const CX = 200;
const CY = 190;
const LR = 105;
const LOOP_LABELS = ['Question', 'Research', 'Validate', 'Reflect'] as const;
const LOOP_ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const LOOP_GAP = 0.4;
function pt(a: number, r = LR) {
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
}

export function CriticalThinkingLoop() {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, { once: true, margin: '-20px' });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!vis) return;
    const id = setInterval(() => setActive((a) => (a + 1) % 4), 1500);
    return () => clearInterval(id);
  }, [vis]);

  return (
    <div ref={ref} className="my-8 flex justify-center">
      <svg
        viewBox="0 0 400 380"
        className="w-full max-w-[360px]"
        role="img"
        aria-label="Critical thinking loop: question, research, validate, reflect, repeat"
      >
        <defs>
          <marker
            id="ct-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 1L10 5L0 9z" fill="var(--chart-1)" />
          </marker>
          <marker
            id="ct-arrow-bright"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 1L10 5L0 9z" fill="var(--chart-1)" />
          </marker>
          <filter id="ct-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Arc segments — active one glows */}
        {LOOP_LABELS.map((_, i) => {
          const a1 = LOOP_ANGLES[i] + LOOP_GAP;
          const a2i = LOOP_ANGLES[(i + 1) % 4] - LOOP_GAP;
          const [sx, sy] = pt(a1);
          const [ex, ey] = pt(a2i);
          let sweep = a2i - a1;
          if (sweep <= 0) sweep += Math.PI * 2;
          const isActive = vis && i === active;
          return (
            <motion.path
              key={i}
              d={`M${sx} ${sy}A${LR} ${LR} 0 ${sweep > Math.PI ? 1 : 0} 1 ${ex} ${ey}`}
              fill="none"
              stroke="var(--chart-1)"
              markerEnd="url(#ct-arrow)"
              initial={{ pathLength: 0, strokeWidth: 2, strokeOpacity: 0.35 }}
              animate={
                vis
                  ? {
                      pathLength: 1,
                      strokeWidth: isActive ? 3 : 2,
                      strokeOpacity: isActive ? 1 : 0.35,
                    }
                  : {}
              }
              transition={{
                pathLength: { duration: 0.5, delay: 0.2 + i * 0.1 },
                strokeWidth: { duration: 0.3 },
                strokeOpacity: { duration: 0.3 },
              }}
              filter={isActive ? 'url(#ct-glow)' : undefined}
            />
          );
        })}

        {/* Step nodes */}
        {LOOP_LABELS.map((label, i) => {
          const [x, y] = pt(LOOP_ANGLES[i]);
          const isNext = vis && i === (active + 1) % 4;
          return (
            <motion.g
              key={label}
              initial={{ opacity: 0 }}
              animate={vis ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.08 }}
            >
              <motion.circle
                cx={x}
                cy={y}
                r="36"
                fill="var(--background)"
                stroke={isNext ? 'var(--chart-1)' : 'var(--foreground)'}
                animate={{
                  fillOpacity: 1,
                  strokeOpacity: isNext ? 0.9 : 0.4,
                  strokeWidth: isNext ? 2.5 : 1.5,
                }}
                transition={{ duration: 0.3 }}
              />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={TXT.LG.fontSize}
                fontWeight={TXT.LG.fontWeight}
                fill="var(--foreground)"
                style={{ fontFamily: FONT }}
              >
                {label}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── 2. First Principles Visual (Question section) ──────────────────────────

const ASSUMPTION_LAYERS = ['Expectations', 'Ego', 'Assumptions'] as const;

export function FirstPrinciplesVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, { once: true, margin: '-20px' });
  const [peeled, setPeeled] = useState(0);

  useEffect(() => {
    if (!vis) return;
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % 6;
      setPeeled(step <= 3 ? Math.min(step, 3) : 0);
    }, 1300);
    return () => clearInterval(id);
  }, [vis]);

  return (
    <div
      ref={ref}
      className="my-8"
      role="img"
      aria-label="Peeling away layers of assumptions to reach first principles"
    >
      <div className="mx-auto max-w-xs space-y-1.5">
        {ASSUMPTION_LAYERS.map((label, i) => (
          <motion.div
            key={label}
            className="rounded-lg border border-chart-5/40 bg-chart-5/8 px-4 py-2.5 text-center"
            animate={{
              opacity: peeled > i ? 0.5 : 1,
              y: peeled > i ? -8 : 0,
              scale: peeled > i ? 0.97 : 1,
            }}
            transition={{ duration: 0.45 }}
          >
            <span
              className="text-[11px] font-semibold tracking-[.12em] text-foreground/80"
              style={{ textDecoration: peeled > i ? 'line-through' : 'none' }}
            >
              {label}
            </span>
          </motion.div>
        ))}
        <motion.div
          className={`rounded-lg border px-4 py-3 text-center transition-all duration-500 ${
            peeled >= 3 ? 'border-chart-2/60 bg-chart-2/12' : 'border-foreground/20'
          }`}
        >
          <motion.span
            className="text-[13px] font-bold tracking-[.1em]"
            animate={{ opacity: peeled >= 3 ? 1 : 0.4 }}
            transition={{ duration: 0.5 }}
            style={{ color: 'var(--foreground)' }}
          >
            First Principles
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
}

// ─── 3. Confirmation Bias Visual (Research section) ─────────────────────────

const EVIDENCE = [true, false, true, false, true, true, false, false, true, false, true, false];

export function ConfirmationBiasVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [biased, setBiased] = useState(false);

  const supporting = EVIDENCE.filter(Boolean).length;
  const contradicting = EVIDENCE.length - supporting;

  return (
    <div ref={ref} className="my-8">
      <div className="overflow-hidden rounded-xl border border-foreground/15">
        <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-3">
          <span className="text-[11px] font-semibold tracking-[.12em] text-foreground/80">
            {biased ? 'Through Confirmation Bias' : 'All Available Evidence'}
          </span>
          <button
            type="button"
            onClick={() => setBiased((b) => !b)}
            className="flex items-center gap-1.5 rounded-full border border-foreground/15 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground"
            aria-label={biased ? 'Show all evidence' : 'Apply confirmation bias'}
          >
            {biased ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
            {biased ? 'Show All' : 'Apply Bias'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 p-5 sm:grid-cols-6">
          {EVIDENCE.map((confirms, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-1.5"
              animate={{
                opacity: biased && !confirms ? 0.05 : 1,
                scale: biased && !confirms ? 0.8 : 1,
              }}
              transition={{ duration: 0.5, delay: biased ? i * 0.04 : 0 }}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  confirms
                    ? 'bg-chart-2/25 ring-1 ring-chart-2/50'
                    : 'bg-chart-5/20 ring-1 ring-chart-5/40'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {confirms ? (
                    <path
                      d="M3 7.5L5.5 10L11 4"
                      stroke="var(--chart-2)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M4 4L10 10M10 4L4 10"
                      stroke="var(--chart-5)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </div>
              <span
                className={`text-[10px] font-semibold ${confirms ? 'text-chart-2' : 'text-chart-5'}`}
              >
                {confirms ? 'Supports' : 'Contradicts'}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-foreground/10 px-5 py-3">
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {biased
              ? `Showing ${supporting} of ${EVIDENCE.length} — contradicting evidence fades from view.`
              : `Of ${EVIDENCE.length} pieces of evidence, ${supporting} support and ${contradicting} contradict — rarely is it one-sided.`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Unwarranted Extrapolation Visual (Research section) ─────────────────

// True underlying function: f(t) = -5t² + 8t + 0.2
const EX_TRUE = (t: number) => -5 * t * t + 8 * t + 0.2;

// Coordinate mapping: t ∈ [0,1] → x ∈ [55,375], val ∈ [0,7] → y ∈ [245,40]
const exSvgX = (t: number) => 55 + t * 320;
const exSvgY = (v: number) => 245 - (v / 7) * 205;

// 7 observed points (true curve + small noise) in t ∈ [0.05, 0.38]
const EX_OBSERVED = [
  { t: 0.05, v: 0.55 },
  { t: 0.1, v: 0.98 },
  { t: 0.15, v: 1.3 },
  { t: 0.2, v: 1.62 },
  { t: 0.25, v: 1.82 },
  { t: 0.32, v: 2.28 },
  { t: 0.38, v: 2.48 },
];

// Linear regression via least-squares on observed points
const EX_REG = (() => {
  const n = EX_OBSERVED.length;
  const st = EX_OBSERVED.reduce((s, p) => s + p.t, 0);
  const sv = EX_OBSERVED.reduce((s, p) => s + p.v, 0);
  const stt = EX_OBSERVED.reduce((s, p) => s + p.t * p.t, 0);
  const stv = EX_OBSERVED.reduce((s, p) => s + p.t * p.v, 0);
  const m = (n * stv - st * sv) / (n * stt - st * st);
  return { m, b: (sv - m * st) / n };
})();

const exLin = (t: number) => EX_REG.m * t + EX_REG.b;

// 4 hidden points on the true curve, revealed on toggle
const EX_HIDDEN = [
  { t: 0.5, v: EX_TRUE(0.5) },
  { t: 0.65, v: EX_TRUE(0.65) },
  { t: 0.8, v: EX_TRUE(0.8) },
  { t: 0.95, v: EX_TRUE(0.95) },
];

// Precomputed SVG path for the true quadratic curve (50 samples)
const EX_CURVE_PATH = Array.from({ length: 51 }, (_, i) => {
  const t = i / 50;
  return `${i === 0 ? 'M' : 'L'}${exSvgX(t).toFixed(1)} ${exSvgY(EX_TRUE(t)).toFixed(1)}`;
}).join(' ');

export function ExtrapolationVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, { once: true, margin: '-20px' });
  const [jumped, setJumped] = useState(false);

  const bx = exSvgX(0.4);

  return (
    <div ref={ref} className="my-8">
      <div className="flex justify-center">
        <svg
          viewBox="0 0 420 300"
          className="w-full max-w-md"
          role="img"
          aria-label="Extrapolation: linear regression overshoots when the true trend is nonlinear"
        >
          {/* Axes */}
          <line
            x1="55"
            y1="245"
            x2="385"
            y2="245"
            stroke="var(--foreground)"
            strokeWidth="1"
            strokeOpacity=".3"
          />
          <line
            x1="55"
            y1="245"
            x2="55"
            y2="35"
            stroke="var(--foreground)"
            strokeWidth="1"
            strokeOpacity=".3"
          />
          <text
            x="220"
            y="275"
            textAnchor="middle"
            fontSize={TXT.SM.fontSize}
            fill="var(--muted-foreground)"
            letterSpacing={TXT.SM.letterSpacing}
            style={{ fontFamily: FONT }}
          >
            Observations
          </text>
          <text
            x="20"
            y="140"
            textAnchor="middle"
            fontSize={TXT.SM.fontSize}
            fill="var(--muted-foreground)"
            letterSpacing={TXT.SM.letterSpacing}
            style={{ fontFamily: FONT }}
            transform="rotate(-90 20 140)"
          >
            Outcome
          </text>

          {/* Observed zone shading */}
          <motion.rect
            x="55"
            y="35"
            width={bx - 55}
            height="210"
            rx="3"
            fill="var(--chart-2)"
            fillOpacity=".06"
            initial={{ opacity: 0 }}
            animate={vis ? { opacity: 1 } : {}}
            transition={{ delay: 0.1 }}
          />

          {/* Boundary dashed line */}
          <motion.line
            x1={bx}
            y1="35"
            x2={bx}
            y2="245"
            stroke="var(--foreground)"
            strokeWidth="1"
            strokeDasharray="4 3"
            strokeOpacity=".25"
            initial={{ opacity: 0 }}
            animate={vis ? { opacity: 1 } : {}}
            transition={{ delay: 0.15 }}
          />

          {/* "Observed" label */}
          <motion.text
            x={(55 + bx) / 2}
            y="48"
            textAnchor="middle"
            fontSize={TXT.SM.fontSize}
            fontWeight={TXT.SM.fontWeight}
            fill="var(--chart-2)"
            letterSpacing={TXT.SM.letterSpacing}
            style={{ fontFamily: FONT }}
            initial={{ opacity: 0 }}
            animate={vis ? { opacity: 0.8 } : {}}
            transition={{ delay: 0.2 }}
          >
            Observed
          </motion.text>

          {/* Observed data points */}
          {EX_OBSERVED.map((p, i) => (
            <motion.circle
              key={`obs-${i}`}
              cx={exSvgX(p.t)}
              cy={exSvgY(p.v)}
              fill="var(--chart-2)"
              initial={{ r: 0 }}
              animate={vis ? { r: 4 } : {}}
              transition={{ delay: 0.3 + i * 0.06 }}
            />
          ))}

          {/* Linear fit — observed portion (solid) */}
          <motion.line
            x1={exSvgX(0)}
            y1={exSvgY(exLin(0))}
            x2={exSvgX(0.4)}
            y2={exSvgY(exLin(0.4))}
            stroke="var(--foreground)"
            strokeWidth="2"
            initial={{ pathLength: 0, strokeOpacity: 0 }}
            animate={vis ? { pathLength: 1, strokeOpacity: jumped ? 0.15 : 0.5 } : {}}
            transition={{
              pathLength: { delay: 0.7, duration: 0.3 },
              strokeOpacity: { duration: 0.4 },
            }}
          />

          {/* Linear fit — prediction portion (dashed, red) */}
          <motion.line
            x1={exSvgX(0.4)}
            y1={exSvgY(exLin(0.4))}
            x2={exSvgX(1)}
            y2={exSvgY(exLin(1))}
            stroke="var(--chart-5)"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            initial={{ pathLength: 0, strokeOpacity: 0 }}
            animate={vis ? { pathLength: 1, strokeOpacity: jumped ? 0.15 : 0.8 } : {}}
            transition={{
              pathLength: { delay: 0.9, duration: 0.4 },
              strokeOpacity: { duration: 0.4 },
            }}
          />

          {/* "Linear Prediction" label */}
          <motion.text
            x={exSvgX(0.82)}
            y={42}
            textAnchor="middle"
            fontSize={TXT.SM.fontSize}
            fontWeight={TXT.SM.fontWeight}
            fill="var(--chart-5)"
            letterSpacing={TXT.SM.letterSpacing}
            style={{ fontFamily: FONT }}
            animate={{ opacity: vis ? (jumped ? 0.15 : 0.9) : 0 }}
            transition={{ duration: 0.4 }}
          >
            Linear Prediction
          </motion.text>

          {/* True quadratic curve — revealed on toggle */}
          <motion.path
            d={EX_CURVE_PATH}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth="2.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: jumped ? 1 : 0, opacity: jumped ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          />

          {/* Hidden data points — revealed on toggle */}
          {EX_HIDDEN.map((p, i) => (
            <motion.circle
              key={`hid-${i}`}
              cx={exSvgX(p.t)}
              cy={exSvgY(p.v)}
              fill="var(--chart-4)"
              initial={{ r: 0 }}
              animate={{ r: jumped ? 4.5 : 0 }}
              transition={{ delay: jumped ? 0.3 + i * 0.08 : 0, type: 'spring', stiffness: 300 }}
            />
          ))}

          {/* "Actual Trend" label — revealed on toggle */}
          <motion.text
            x={exSvgX(0.82)}
            y={exSvgY(EX_TRUE(0.85)) + 22}
            textAnchor="middle"
            fontSize={TXT.SM.fontSize}
            fontWeight={TXT.SM.fontWeight}
            fill="var(--chart-2)"
            letterSpacing={TXT.SM.letterSpacing}
            style={{ fontFamily: FONT }}
            animate={{ opacity: jumped ? 0.9 : 0 }}
            transition={{ duration: 0.4 }}
          >
            Actual Trend
          </motion.text>
        </svg>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => setJumped((j) => !j)}
          className="flex items-center gap-1.5 rounded-full border border-foreground/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          {jumped ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Jump to Conclusion
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              See the Full Picture
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── 5. Consilience Visual (Validate section) ──────────────────────────────

const SOURCES = [
  { label: 'Academic', interest: 'Publication', x: 55, y: 40, color: 'var(--chart-1)' },
  { label: 'Industry', interest: 'Profit', x: 490, y: 40, color: 'var(--chart-3)' },
  { label: 'Independent', interest: 'Truth', x: 55, y: 145, color: 'var(--chart-4)' },
  { label: 'Government', interest: 'Policy', x: 490, y: 145, color: 'var(--chart-5)' },
];

const CLAIM_POS = { x: 275, y: 93 };

export function ConsilienceVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const vis = useInView(ref, { once: true, margin: '-20px' });
  const [verified, setVerified] = useState(0);
  useEffect(() => {
    if (!vis) return;
    let step = 0;
    const id = setInterval(() => {
      step = (step + 1) % 7;
      const v = step <= 4 ? Math.min(step, 4) : 0;
      setVerified(v);
    }, 1200);
    return () => clearInterval(id);
  }, [vis]);

  const confidence = verified * 20;

  return (
    <div ref={ref} className="my-8 flex justify-center">
      <svg
        viewBox="0 0 550 230"
        className="w-full max-w-xl"
        role="img"
        aria-label="Consilience: independent sources with conflicting interests converging on a claim"
      >
        <defs>
          {SOURCES.map((s, i) => (
            <marker
              key={i}
              id={`cons-arrow-${i}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0 1L10 5L0 9z" fill={s.color} />
            </marker>
          ))}
        </defs>

        {/* Connection lines with arrows */}
        {SOURCES.map((s, i) => (
          <motion.path
            key={`line-${i}`}
            d={`M${s.x} ${s.y}L${CLAIM_POS.x} ${CLAIM_POS.y}`}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            markerEnd={`url(#cons-arrow-${i})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: verified > i ? 1 : 0,
              opacity: verified > i ? 0.7 : 0.1,
            }}
            transition={{ duration: 0.4 }}
          />
        ))}

        {/* Traveling particle */}
        {verified > 0 && verified <= 4 && (
          <motion.circle
            r="3"
            fill={SOURCES[verified - 1].color}
            animate={{
              cx: [SOURCES[verified - 1].x, CLAIM_POS.x],
              cy: [SOURCES[verified - 1].y, CLAIM_POS.y],
              opacity: [0.9, 0],
            }}
            transition={{ duration: 0.8, ease: 'easeIn' }}
          />
        )}

        {/* Claim node */}
        <circle
          cx={CLAIM_POS.x}
          cy={CLAIM_POS.y}
          r="24"
          fill="var(--background)"
          stroke={verified > 0 ? SOURCES[verified - 1].color : 'var(--foreground)'}
          strokeWidth="2"
          strokeOpacity={verified > 0 ? 0.8 : 0.5}
        />
        {/* Colored rings for each verified source */}
        {SOURCES.map((s, i) => (
          <motion.circle
            key={`ring-${i}`}
            cx={CLAIM_POS.x}
            cy={CLAIM_POS.y}
            r={24 + (i + 1) * 3}
            fill="none"
            stroke={s.color}
            strokeWidth="1.5"
            animate={{ opacity: verified > i ? 0.5 : 0 }}
            transition={{ duration: 0.4 }}
          />
        ))}
        <text
          x={CLAIM_POS.x}
          y={CLAIM_POS.y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={TXT.MD.fontSize}
          fontWeight={TXT.MD.fontWeight}
          fill="var(--foreground)"
          style={{ fontFamily: FONT }}
        >
          Claim
        </text>

        {/* Source nodes */}
        {SOURCES.map((s, i) => {
          const isLeft = s.x < CLAIM_POS.x;
          const isTop = s.y < CLAIM_POS.y;
          const anchor = isLeft ? 'start' : 'end';
          const labelX = isLeft ? s.x + 16 : s.x - 16;
          const labelY = isTop ? s.y - 14 : s.y + 16;

          return (
            <motion.g
              key={`src-${i}`}
              animate={{ opacity: verified > i ? 1 : 0.25 }}
              transition={{ duration: 0.5 }}
            >
              <circle
                cx={s.x}
                cy={s.y}
                r="7"
                fill={s.color}
                fillOpacity={verified > i ? 0.9 : 0.2}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                fontSize={TXT.MD.fontSize}
                fontWeight={TXT.MD.fontWeight}
                fill="var(--foreground)"
                style={{ fontFamily: FONT }}
              >
                {s.label}
              </text>
              <text
                x={labelX}
                y={labelY + 14}
                textAnchor={anchor}
                fontSize={TXT.MD.fontSize}
                fill="var(--foreground)"
                fillOpacity="0.6"
                style={{ fontFamily: FONT }}
              >
                {s.interest}
              </text>
            </motion.g>
          );
        })}

        {/* Confidence bar */}
        <text
          x="275"
          y="222"
          textAnchor="middle"
          fontSize={TXT.MD.fontSize}
          fontWeight={TXT.MD.fontWeight}
          fill="var(--muted-foreground)"
          letterSpacing={TXT.MD.letterSpacing}
          style={{ fontFamily: FONT }}
        >
          Confidence
        </text>
        <rect
          x="105"
          y="195"
          width="340"
          height="10"
          rx="5"
          fill="var(--foreground)"
          fillOpacity=".12"
        />
        <motion.rect
          x="105"
          y="195"
          height="10"
          rx="5"
          fill="var(--chart-2)"
          fillOpacity=".8"
          animate={{ width: (confidence / 100) * 340 }}
          transition={{ duration: 0.4 }}
        />
        <text
          x="65"
          y="203"
          textAnchor="middle"
          fontSize={TXT.BODY.fontSize}
          fontWeight={TXT.BODY.fontWeight}
          fill="var(--muted-foreground)"
          style={{ fontFamily: FONT }}
        >
          0%
        </text>
        <text
          x="480"
          y="203"
          textAnchor="middle"
          fontSize={TXT.BODY.fontSize}
          fontWeight={TXT.BODY.fontWeight}
          fill="var(--muted-foreground)"
          style={{ fontFamily: FONT }}
        >
          Certainty
        </text>
      </svg>
    </div>
  );
}

// ─── 6. Search Landscape Visual (Reflect & Repeat section) ──────────────────

// Sine terrain with linear amplitude growth → 3 peaks of increasing height
const SL_OMEGA = (2 * Math.PI) / 130;
const SL_PHASE = 62.5;
const SL_CENTER = 155;
const SL_AMP_MIN = 40;
const SL_AMP_MAX = 100;
const SL_X_MIN = 20;
const SL_X_MAX = 400;
const SL_X_RANGE = SL_X_MAX - SL_X_MIN;

function landscapeY(x: number): number {
  const t = (x - SL_X_MIN) / SL_X_RANGE;
  const amp = SL_AMP_MIN + (SL_AMP_MAX - SL_AMP_MIN) * t;
  return SL_CENTER - amp * Math.sin(SL_OMEGA * (x - SL_PHASE));
}

const SL_TERRAIN = (() => {
  const n = 300;
  const dx = SL_X_RANGE / n;

  const points = Array.from({ length: n + 1 }, (_, i) => {
    const x = SL_X_MIN + i * dx;
    return { x, y: landscapeY(x) };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const fillD = pathD + ` L${SL_X_MAX} 240 L${SL_X_MIN} 240 Z`;

  // Find peaks (local minima of y in SVG coordinates)
  const peaks: { x: number; y: number }[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    if (points[i].y < points[i - 1].y && points[i].y < points[i + 1].y) {
      peaks.push(points[i]);
    }
  }

  return { points, peaks, pathD, fillD };
})();

const SL_PEAK_INFO = [
  { label: 'Good', fontSize: 'SM' as const, r: 3.5 },
  { label: 'Better', fontSize: 'SM' as const, r: 3.5 },
  { label: 'Best', fontSize: 'BODY' as const, r: 5 },
];

const TRAVERSE_DUR = 8;

export function SearchLandscapeVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const vis = useInView(ref, { once: true, margin: '-20px' });
  const [glowing, setGlowing] = useState<number | null>(null);

  useEffect(() => {
    if (!vis || !dotRef.current) return;
    const { peaks } = SL_TERRAIN;
    const start = performance.now();
    let raf: number;
    let lastHit = -1;

    const tick = () => {
      const elapsed = ((performance.now() - start) / 1000) % TRAVERSE_DUR;
      const progress = elapsed / TRAVERSE_DUR;
      const x = SL_X_MIN + progress * SL_X_RANGE;
      const y = landscapeY(x);

      dotRef.current?.setAttribute('transform', `translate(${x} ${y})`);

      const hit = peaks.findIndex((p) => Math.abs(x - p.x) < 12);
      if (hit !== lastHit) {
        lastHit = hit;
        setGlowing(hit >= 0 ? hit : null);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [vis]);

  const { peaks, pathD, fillD } = SL_TERRAIN;

  return (
    <div ref={ref} className="my-8 flex justify-center">
      <svg
        viewBox="-25 0 445 275"
        className="w-full max-w-lg"
        role="img"
        aria-label="Optimization landscape: iterative search finding local and global optima"
      >
        <defs>
          <filter id="peak-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Terrain fill */}
        <motion.path
          d={fillD}
          fill="var(--foreground)"
          fillOpacity=".08"
          initial={{ opacity: 0 }}
          animate={vis ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.6 }}
        />

        {/* Terrain line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2.5"
          strokeOpacity=".4"
          initial={{ pathLength: 0 }}
          animate={vis ? { pathLength: 1 } : {}}
          transition={{ duration: 1.5 }}
        />

        {/* X-axis (Baseline) */}
        <line
          x1={SL_X_MIN}
          y1="240"
          x2={SL_X_MAX}
          y2="240"
          stroke="var(--foreground)"
          strokeWidth="1"
          strokeOpacity=".25"
        />

        {/* Y-axis */}
        <line
          x1={SL_X_MIN}
          y1="240"
          x2={SL_X_MIN}
          y2="30"
          stroke="var(--foreground)"
          strokeWidth="1"
          strokeOpacity=".25"
        />
        <text
          x="15"
          y="248"
          textAnchor="end"
          fontSize={TXT.SM.fontSize}
          fill="var(--muted-foreground)"
          style={{ fontFamily: FONT }}
        >
          0
        </text>
        <text
          x="-5"
          y="140"
          textAnchor="middle"
          fontSize={TXT.SM.fontSize}
          fill="var(--muted-foreground)"
          letterSpacing={TXT.SM.letterSpacing}
          style={{ fontFamily: FONT }}
          transform="rotate(-90 -5 140)"
        >
          Quality
        </text>

        {/* Peak labels, connectors, and markers */}
        {peaks.map((p, i) => {
          const info = SL_PEAK_INFO[i];
          if (!info) return null;
          const isGlowing = glowing === i;
          const labelY = p.y - 22;

          return (
            <g key={`peak-${i}`}>
              {/* Dashed connector */}
              <motion.line
                x1={p.x}
                y1={labelY + 4}
                x2={p.x}
                y2={labelY + 9}
                stroke="var(--muted-foreground)"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity=".4"
                initial={{ opacity: 0 }}
                animate={vis ? { opacity: 1 } : {}}
                transition={{ delay: 0.7 + i * 0.3 }}
              />
              {/* Label */}
              <motion.text
                x={p.x}
                y={labelY}
                textAnchor="middle"
                fontSize={TXT[info.fontSize].fontSize}
                fontWeight={TXT[info.fontSize].fontWeight}
                fill="var(--foreground)"
                style={{ fontFamily: FONT }}
                initial={{ opacity: 0 }}
                animate={vis ? { opacity: i === peaks.length - 1 ? 1 : 0.8 } : {}}
                transition={{ delay: 0.7 + i * 0.3 }}
              >
                {info.label}
              </motion.text>
              {/* Glow ring */}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={info.r * 3}
                fill="var(--brand)"
                animate={{ opacity: isGlowing ? 0.3 : 0 }}
                transition={{ duration: 0.15 }}
                filter="url(#peak-glow)"
              />
              {/* Core dot */}
              <motion.circle
                cx={p.x}
                cy={p.y}
                fill={isGlowing ? 'var(--brand)' : 'var(--foreground)'}
                animate={{
                  r: isGlowing ? info.r * 1.6 : info.r,
                  opacity: vis ? (isGlowing ? 1 : 0.7) : 0,
                }}
                transition={{ duration: 0.15 }}
              />
            </g>
          );
        })}

        {/* Stopping condition */}
        <motion.line
          x1="388"
          y1="40"
          x2="388"
          y2="240"
          stroke="var(--foreground)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ opacity: 0 }}
          animate={vis ? { opacity: 0.3 } : {}}
          transition={{ delay: 1.6 }}
        />
        <motion.text
          x="388"
          y="255"
          textAnchor="middle"
          fontSize={TXT.SM.fontSize}
          fontWeight={TXT.SM.fontWeight}
          fill="var(--foreground)"
          letterSpacing={TXT.SM.letterSpacing}
          style={{ fontFamily: FONT }}
          initial={{ opacity: 0 }}
          animate={vis ? { opacity: 0.6 } : {}}
          transition={{ delay: 1.6 }}
        >
          Stop
        </motion.text>

        {/* Traversal dot — position updated via ref in useEffect */}
        {vis && (
          <g ref={dotRef} transform={`translate(${SL_X_MIN} ${landscapeY(SL_X_MIN)})`}>
            <circle r="8" fill="var(--brand)" fillOpacity=".25" />
            <circle r="5" fill="var(--brand)" />
          </g>
        )}

        {/* X-axis label */}
        <text
          x="210"
          y="260"
          textAnchor="middle"
          fontSize={TXT.SM.fontSize}
          fill="var(--muted-foreground)"
          letterSpacing={TXT.SM.letterSpacing}
          style={{ fontFamily: FONT }}
        >
          Iterations
        </text>
      </svg>
    </div>
  );
}
