import { Bot, Brain, Code, ExternalLink, Eye, Hammer, Shield, Terminal } from 'lucide-react';
import type { Skill } from '@/data/skills';
import { getCategoryLabel } from '@/data/skills';

const categoryIcons: Record<string, typeof Code> = {
  agent: Brain,
  ai: Bot,
  cli: Terminal,
  development: Code,
  security: Shield,
  visual: Eye,
  general: Hammer,
};

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const Icon = categoryIcons[skill.category] || Hammer;

  return (
    <a
      href={`/genai/${skill.slug}`}
      className="group block rounded-xl p-6 transition-all glass-card hover:border-primary/40"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground glass-pill">
          <Icon className="h-3 w-3" />
          {getCategoryLabel(skill.category)}
        </span>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <h2 className="mb-1 text-lg font-semibold text-foreground">{skill.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{skill.description}</p>

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <code className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {skill.slug}
        </code>
      </div>
    </a>
  );
}
