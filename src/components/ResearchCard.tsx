import type { CollectionEntry } from 'astro:content';
import { ExternalLink, FileText, Github } from 'lucide-react';

interface ResearchCardProps {
  item: CollectionEntry<'research'>['data'] & { slug: string };
}

export default function ResearchCard({ item }: ResearchCardProps) {
  return (
    <div className="group">
      <a
        href={`/research/${item.slug}`}
        className="block rounded-xl p-6 transition-all glass-card hover:border-primary/40"
      >
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

        <h2 className="mb-1 text-xl font-semibold text-foreground">{item.title}</h2>
        <p className="mt-2 line-clamp-3 text-muted-foreground">{item.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="glass-pill rounded-full px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {item.tech.map((t) => (
            <span key={t} className="tech-badge">
              {t}
            </span>
          ))}

          <span className="flex-1" />

          {item.paperUrl && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              PDF
              <ExternalLink className="h-3 w-3" />
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Github className="h-3.5 w-3.5" />
            Code
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </a>
    </div>
  );
}
