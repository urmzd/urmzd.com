'use client';

import { Bot, Code2, Palette, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

const categoryMeta: Record<string, { icon: typeof Bot; label: string }> = {
  ai: { icon: Bot, label: 'AI' },
  development: { icon: Code2, label: 'Development' },
  cli: { icon: Terminal, label: 'CLI' },
  visual: { icon: Palette, label: 'Visual' },
};

interface StandardsCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  index: number;
}

export default function StandardsCard({
  id,
  title,
  description,
  category,
  index,
}: StandardsCardProps) {
  const meta = categoryMeta[category] ?? { icon: Code2, label: category };
  const Icon = meta.icon;

  return (
    <motion.a
      href={`/standards/${id}`}
      className="group block rounded-xl border border-border bg-background p-6 transition-shadow hover:shadow-[0_8px_32px_oklch(0_0_0_/_6%)]"
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {meta.label}
        </span>
      </div>

      <h3 className="mb-1 text-lg font-semibold text-foreground group-hover:text-brand transition-colors">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.a>
  );
}
