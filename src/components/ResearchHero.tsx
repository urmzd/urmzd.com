import type { CollectionEntry } from 'astro:content';
import { FileText, Github } from 'lucide-react';
import ShareButton from './ShareButton';

interface ResearchHeroProps {
  item: CollectionEntry<'research'>['data'];
}

export default function ResearchHero({ item }: ResearchHeroProps) {
  return (
    <section className="pt-28 pb-12">
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
      </div>

      <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">{item.title}</h1>

      <p className="mb-6 max-w-2xl text-lg text-muted-foreground">{item.tagline}</p>

      <div className="flex flex-wrap gap-3">
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
      </div>
    </section>
  );
}
