'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import type { TerminalLine } from '@/data/projects';

interface TerminalDemoProps {
  title?: string;
  lines: TerminalLine[];
}

export default function TerminalDemo({ title, lines }: TerminalDemoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">Demo</h2>
      <motion.div
        className="terminal-mock mx-auto max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-terminal-dot-close/60" />
          <span className="h-3 w-3 rounded-full bg-terminal-dot-minimize/60" />
          <span className="h-3 w-3 rounded-full bg-terminal-dot-expand/60" />
          {title && <span className="ml-2 text-[10px] text-muted-foreground">{title}</span>}
        </div>
        <div className="space-y-0.5 text-sm leading-relaxed">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
            >
              {line.type === 'command' ? (
                <div className="flex gap-2">
                  <span className="select-none text-terminal-prompt">$</span>
                  <span className="text-terminal-command">{line.text}</span>
                </div>
              ) : (
                <div className="text-terminal-output pl-4">{line.text || '\u00A0'}</div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
