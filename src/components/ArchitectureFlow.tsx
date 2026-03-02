'use client';

import { motion, useInView } from 'motion/react';
import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Pipeline stage positions — horizontal layout (desktop)
const STAGES_H = {
  inputs: [
    { label: 'YAML', x: 20, y: 40 },
    { label: 'JSON', x: 20, y: 100 },
    { label: 'TOML', x: 20, y: 160 },
    { label: 'MD', x: 20, y: 220 },
  ],
  parser: { label: 'Parser', x: 180, y: 130 },
  template: { label: 'Template', x: 340, y: 130 },
  formatter: { label: 'Formatter', x: 500, y: 130 },
  outputs: [
    { label: 'PDF', x: 660, y: 20 },
    { label: 'HTML', x: 660, y: 80 },
    { label: 'DOCX', x: 660, y: 140 },
    { label: 'LaTeX', x: 660, y: 200 },
    { label: 'MD', x: 660, y: 260 },
  ],
};

// Pipeline stage positions — vertical layout (mobile)
const STAGES_V = {
  inputs: [
    { label: 'YAML', x: 20, y: 20 },
    { label: 'JSON', x: 100, y: 20 },
    { label: 'TOML', x: 180, y: 20 },
    { label: 'MD', x: 260, y: 20 },
  ],
  parser: { label: 'Parser', x: 140, y: 110 },
  template: { label: 'Template', x: 140, y: 200 },
  formatter: { label: 'Formatter', x: 140, y: 290 },
  outputs: [
    { label: 'PDF', x: 20, y: 380 },
    { label: 'HTML', x: 90, y: 380 },
    { label: 'DOCX', x: 160, y: 380 },
    { label: 'LaTeX', x: 230, y: 380 },
    { label: 'MD', x: 300, y: 380 },
  ],
};

function StageBox({
  label,
  x,
  y,
  w,
  h,
  delay,
  isCore,
}: {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  delay: number;
  isCore?: boolean;
}) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <foreignObject x={x} y={y} width={w} height={h}>
        <div
          className={cn(
            'flow-stage flex h-full items-center justify-center rounded-lg border text-xs font-medium',
            isCore
              ? 'border-foreground/20 bg-foreground/5 text-foreground'
              : 'border-border bg-background text-muted-foreground',
          )}
        >
          {label}
        </div>
      </foreignObject>
    </motion.g>
  );
}

function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  delay,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="var(--color-border)"
      strokeWidth={1.5}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    />
  );
}

function Particle({
  x1,
  y1,
  x2,
  y2,
  delay,
  duration,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
  duration: number;
}) {
  return (
    <motion.circle
      r={2.5}
      className="flow-particle"
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, x2],
        cy: [y1, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: duration * 0.6,
        ease: 'linear',
      }}
    />
  );
}

function HorizontalDiagram({ isInView }: { isInView: boolean }) {
  if (!isInView) return null;
  const S = STAGES_H;
  const bw = 80;
  const bh = 32;
  const coreBw = 100;
  const coreBh = 40;

  return (
    <svg
      viewBox="0 0 760 300"
      className="hidden w-full sm:block"
      aria-label="Architecture pipeline diagram"
    >
      {/* Input → Parser lines */}
      {S.inputs.map((inp, i) => (
        <ConnectionLine
          key={`ip-${inp.label}`}
          x1={inp.x + bw}
          y1={inp.y + bh / 2}
          x2={S.parser.x}
          y2={S.parser.y + coreBh / 2}
          delay={0.3 + i * 0.08}
        />
      ))}
      {/* Parser → Template */}
      <ConnectionLine
        x1={S.parser.x + coreBw}
        y1={S.parser.y + coreBh / 2}
        x2={S.template.x}
        y2={S.template.y + coreBh / 2}
        delay={0.7}
      />
      {/* Template → Formatter */}
      <ConnectionLine
        x1={S.template.x + coreBw}
        y1={S.template.y + coreBh / 2}
        x2={S.formatter.x}
        y2={S.formatter.y + coreBh / 2}
        delay={0.9}
      />
      {/* Formatter → Outputs */}
      {S.outputs.map((out, i) => (
        <ConnectionLine
          key={`fo-${out.label}`}
          x1={S.formatter.x + coreBw}
          y1={S.formatter.y + coreBh / 2}
          x2={out.x}
          y2={out.y + bh / 2}
          delay={1.1 + i * 0.08}
        />
      ))}

      {/* Traveling particles */}
      {S.inputs.map((inp, i) => (
        <Particle
          key={`p-ip-${inp.label}`}
          x1={inp.x + bw}
          y1={inp.y + bh / 2}
          x2={S.parser.x}
          y2={S.parser.y + coreBh / 2}
          delay={1.5 + i * 0.4}
          duration={1.8}
        />
      ))}
      <Particle
        x1={S.parser.x + coreBw}
        y1={S.parser.y + coreBh / 2}
        x2={S.template.x}
        y2={S.template.y + coreBh / 2}
        delay={2.0}
        duration={1.4}
      />
      <Particle
        x1={S.template.x + coreBw}
        y1={S.template.y + coreBh / 2}
        x2={S.formatter.x}
        y2={S.formatter.y + coreBh / 2}
        delay={2.5}
        duration={1.4}
      />
      {S.outputs.map((out, i) => (
        <Particle
          key={`p-fo-${out.label}`}
          x1={S.formatter.x + coreBw}
          y1={S.formatter.y + coreBh / 2}
          x2={out.x}
          y2={out.y + bh / 2}
          delay={3.0 + i * 0.3}
          duration={1.6}
        />
      ))}

      {/* Input boxes */}
      {S.inputs.map((inp, i) => (
        <StageBox
          key={inp.label}
          label={inp.label}
          x={inp.x}
          y={inp.y}
          w={bw}
          h={bh}
          delay={0.1 + i * 0.06}
        />
      ))}
      {/* Core stages */}
      <StageBox
        label={S.parser.label}
        x={S.parser.x}
        y={S.parser.y}
        w={coreBw}
        h={coreBh}
        delay={0.4}
        isCore
      />
      <StageBox
        label={S.template.label}
        x={S.template.x}
        y={S.template.y}
        w={coreBw}
        h={coreBh}
        delay={0.6}
        isCore
      />
      <StageBox
        label={S.formatter.label}
        x={S.formatter.x}
        y={S.formatter.y}
        w={coreBw}
        h={coreBh}
        delay={0.8}
        isCore
      />
      {/* Output boxes */}
      {S.outputs.map((out, i) => (
        <StageBox
          key={out.label}
          label={out.label}
          x={out.x}
          y={out.y}
          w={bw}
          h={bh}
          delay={1.0 + i * 0.06}
        />
      ))}
    </svg>
  );
}

function VerticalDiagram({ isInView }: { isInView: boolean }) {
  if (!isInView) return null;
  const S = STAGES_V;
  const bw = 64;
  const bh = 32;
  const coreBw = 100;
  const coreBh = 40;

  return (
    <svg
      viewBox="0 0 380 430"
      className="block w-full sm:hidden"
      aria-label="Architecture pipeline diagram"
    >
      {/* Input → Parser lines */}
      {S.inputs.map((inp, i) => (
        <ConnectionLine
          key={`ip-${inp.label}`}
          x1={inp.x + bw / 2}
          y1={inp.y + bh}
          x2={S.parser.x + coreBw / 2}
          y2={S.parser.y}
          delay={0.3 + i * 0.08}
        />
      ))}
      {/* Parser → Template */}
      <ConnectionLine
        x1={S.parser.x + coreBw / 2}
        y1={S.parser.y + coreBh}
        x2={S.template.x + coreBw / 2}
        y2={S.template.y}
        delay={0.7}
      />
      {/* Template → Formatter */}
      <ConnectionLine
        x1={S.template.x + coreBw / 2}
        y1={S.template.y + coreBh}
        x2={S.formatter.x + coreBw / 2}
        y2={S.formatter.y}
        delay={0.9}
      />
      {/* Formatter → Outputs */}
      {S.outputs.map((out, i) => (
        <ConnectionLine
          key={`fo-${out.label}`}
          x1={S.formatter.x + coreBw / 2}
          y1={S.formatter.y + coreBh}
          x2={out.x + bw / 2}
          y2={out.y}
          delay={1.1 + i * 0.08}
        />
      ))}

      {/* Particles */}
      {S.inputs.map((inp, i) => (
        <Particle
          key={`p-ip-${inp.label}`}
          x1={inp.x + bw / 2}
          y1={inp.y + bh}
          x2={S.parser.x + coreBw / 2}
          y2={S.parser.y}
          delay={1.5 + i * 0.4}
          duration={1.8}
        />
      ))}
      <Particle
        x1={S.parser.x + coreBw / 2}
        y1={S.parser.y + coreBh}
        x2={S.template.x + coreBw / 2}
        y2={S.template.y}
        delay={2.0}
        duration={1.4}
      />
      <Particle
        x1={S.template.x + coreBw / 2}
        y1={S.template.y + coreBh}
        x2={S.formatter.x + coreBw / 2}
        y2={S.formatter.y}
        delay={2.5}
        duration={1.4}
      />
      {S.outputs.map((out, i) => (
        <Particle
          key={`p-fo-${out.label}`}
          x1={S.formatter.x + coreBw / 2}
          y1={S.formatter.y + coreBh}
          x2={out.x + bw / 2}
          y2={out.y}
          delay={3.0 + i * 0.3}
          duration={1.6}
        />
      ))}

      {/* Input boxes */}
      {S.inputs.map((inp, i) => (
        <StageBox
          key={inp.label}
          label={inp.label}
          x={inp.x}
          y={inp.y}
          w={bw}
          h={bh}
          delay={0.1 + i * 0.06}
        />
      ))}
      {/* Core stages */}
      <StageBox
        label={S.parser.label}
        x={S.parser.x}
        y={S.parser.y}
        w={coreBw}
        h={coreBh}
        delay={0.4}
        isCore
      />
      <StageBox
        label={S.template.label}
        x={S.template.x}
        y={S.template.y}
        w={coreBw}
        h={coreBh}
        delay={0.6}
        isCore
      />
      <StageBox
        label={S.formatter.label}
        x={S.formatter.x}
        y={S.formatter.y}
        w={coreBw}
        h={coreBh}
        delay={0.8}
        isCore
      />
      {/* Output boxes */}
      {S.outputs.map((out, i) => (
        <StageBox
          key={out.label}
          label={out.label}
          x={out.x}
          y={out.y}
          w={bw}
          h={bh}
          delay={1.0 + i * 0.06}
        />
      ))}
    </svg>
  );
}

const RESUME_YAML = `contact:
  name: Jane Doe
  email: example@email.com
  location:
    city: Techville
    state: Academia

skills:
  categories:
    - category: Programming
      items: [Python, Java, C++]

experience:
  positions:
    - company: Tech Innovations
      title: Software Developer`;

function TypingYaml() {
  const [displayedLen, setDisplayedLen] = useState(0);

  React.useEffect(() => {
    if (displayedLen >= RESUME_YAML.length) return;
    const timeout = setTimeout(
      () => setDisplayedLen((l) => Math.min(l + 2, RESUME_YAML.length)),
      12,
    );
    return () => clearTimeout(timeout);
  }, [displayedLen]);

  return (
    <div className="terminal-mock">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-terminal-dot-close/60" />
        <span className="h-3 w-3 rounded-full bg-terminal-dot-minimize/60" />
        <span className="h-3 w-3 rounded-full bg-terminal-dot-expand/60" />
        <span className="ml-2 text-[10px] text-muted-foreground">resume.yml</span>
      </div>
      <pre className="text-xs leading-relaxed text-terminal-prompt overflow-x-auto">
        <code>
          {RESUME_YAML.slice(0, displayedLen)}
          {displayedLen < RESUME_YAML.length && (
            <span className="inline-block w-1.5 h-3.5 bg-terminal-prompt/80 animate-pulse align-middle" />
          )}
        </code>
      </pre>
    </div>
  );
}

function DownArrow() {
  return (
    <div className="flex items-center justify-center py-3 text-muted-foreground">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    </div>
  );
}

function PipelineShowcase() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-stretch">
      {/* Input */}
      <TypingYaml />
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">Input</p>

      <DownArrow />

      {/* Processor */}
      <div className="overflow-hidden rounded-xl border border-border shadow-lg dark:border-foreground/10">
        <img
          src="/images/resume-generator/demo-desktop.png"
          alt="Resume Generator desktop application"
          loading="lazy"
          className="w-full"
        />
      </div>
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">Processor</p>

      <DownArrow />

      {/* Outputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border shadow-lg dark:border-foreground/10">
          <img
            src="/images/resume-generator/modern-html.png"
            alt="Resume output rendered as HTML"
            loading="lazy"
            className="w-full"
          />
          <div className="border-t border-border bg-muted/50 px-3 py-1 text-center text-[10px] font-medium text-muted-foreground">
            HTML
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border shadow-lg dark:border-foreground/10">
          <img
            src="/images/resume-generator/modern-latex.png"
            alt="Resume output rendered as LaTeX"
            loading="lazy"
            className="w-full"
          />
          <div className="border-t border-border bg-muted/50 px-3 py-1 text-center text-[10px] font-medium text-muted-foreground">
            LaTeX
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">Outputs</p>
    </div>
  );
}

export default function ArchitectureFlow() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <section ref={ref} className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">Architecture</h2>

      <div className="mb-10 overflow-hidden rounded-xl border border-border bg-background p-4 sm:p-6">
        <HorizontalDiagram isInView={isInView} />
        <VerticalDiagram isInView={isInView} />
      </div>

      <PipelineShowcase />

      {/* CTAs */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <a
          href="https://github.com/urmzd/resume-generator"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View on GitHub
        </a>
        <a
          href="https://github.com/urmzd/resume-generator/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Download Release
        </a>
      </div>
    </section>
  );
}
