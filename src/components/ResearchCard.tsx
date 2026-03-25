import type { CollectionEntry } from 'astro:content';
import { ExternalLink, FileText, Github } from 'lucide-react';

interface ResearchCardProps {
  item: CollectionEntry<'research'>['data'] & { slug: string };
}

export default function ResearchCard({ item }: ResearchCardProps) {
  return (
    <div className="project-card group">
      <a href={`/research/${item.slug}`} className="block">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{item.year}</span>
        </div>

        <h3 className="mb-1 text-lg font-semibold text-foreground">{item.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{item.description}</p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[0.65rem] text-muted-foreground glass-pill"
            >
              {tag}
            </span>
          ))}
        </div>
      </a>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {item.tech.map((t) => (
          <span key={t} className="tech-badge">
            {t}
          </span>
        ))}

        <span className="flex-1" />

        {item.paperUrl && (
          <a
            href={item.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <a
          href={item.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="h-3.5 w-3.5" />
          Code
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
