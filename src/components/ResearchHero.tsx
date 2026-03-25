'use client';

import type { CollectionEntry } from 'astro:content';
import { FileText, Github } from 'lucide-react';
import { motion } from 'motion/react';
import ShareButton from './ShareButton';

interface ResearchHeroProps {
  item: CollectionEntry<'research'>['data'];
}

export default function ResearchHero({ item }: ResearchHeroProps) {
  const chars = item.title.split('');

  return (
    <section className="container mx-auto px-4 pt-28 pb-12">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-4 flex flex-wrap items-center gap-3"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground glass-pill">
          {item.category === 'paper' ? (
            <>
              <FileText className="h-3 w-3" />
              Paper
            </>
          ) : (
            <>
              <Github className="h-3 w-3" />
              Tooling
            </>
          )}
        </span>
        {item.venue && <span className="text-xs text-muted-foreground">{item.venue}</span>}
        <span className="text-xs tabular-nums text-muted-foreground">{item.year}</span>
      </motion.div>

      <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">
        {chars.map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            className="inline-block"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.4,
              delay: 0.2 + i * 0.03,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </h1>

      <motion.p
        className="mb-6 max-w-2xl text-lg text-muted-foreground"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {item.tagline}
      </motion.p>

      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        {item.paperUrl && (
          <a
            href={item.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            Read Paper
          </a>
        )}
        <a
          href={item.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
        <ShareButton
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={item.title}
          description={item.tagline}
        />
      </motion.div>
    </section>
  );
}
