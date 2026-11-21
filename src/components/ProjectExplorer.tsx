import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, type CategoryId } from '@/data/projectCategories';
import { cn } from '@/lib/utils';
import ProjectCard, { type ProjectCardData } from './ProjectCard';

export interface ExplorerProject extends ProjectCardData {
  category: CategoryId;
}

interface ProjectExplorerProps {
  projects: ExplorerProject[];
}

type Filter = CategoryId | 'all';

function readParams(): { q: string; category: Filter } {
  if (typeof window === 'undefined') return { q: '', category: 'all' };
  const params = new URLSearchParams(window.location.search);
  const c = params.get('category');
  const category = CATEGORIES.some((x) => x.id === c) ? (c as CategoryId) : 'all';
  return { q: params.get('q') ?? '', category };
}

function matches(p: ExplorerProject, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const hay = [p.title, p.description, p.language ?? '', ...p.tags].join(' ').toLowerCase();
  return terms.every((t) => hay.includes(t));
}

function CardGrid({ items, dense }: { items: ExplorerProject[]; dense?: boolean }) {
  return (
    <ul className={cn('grid gap-5 sm:grid-cols-2', dense && 'lg:grid-cols-3')}>
      {items.map((p) => (
        <li key={p.slug}>
          <ProjectCard project={p} />
        </li>
      ))}
    </ul>
  );
}

export default function ProjectExplorer({ projects }: ProjectExplorerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Filter>('all');

  // Hydrate from the URL after mount so server and client render the same HTML.
  useEffect(() => {
    const initial = readParams();
    setQuery(initial.q);
    setCategory(initial.category);
  }, []);

  // Keep the URL shareable: /projects?category=agents&q=rust
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (category !== 'all') url.searchParams.set('category', category);
    else url.searchParams.delete('category');
    window.history.replaceState({}, '', url.toString());
  }, [query, category]);

  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const searched = useMemo(() => projects.filter((p) => matches(p, terms)), [projects, terms]);

  const counts = useMemo(() => {
    const c = new Map<Filter, number>([['all', searched.length]]);
    for (const p of searched) c.set(p.category, (c.get(p.category) ?? 0) + 1);
    return c;
  }, [searched]);

  const visible = category === 'all' ? searched : searched.filter((p) => p.category === category);
  const active = visible.filter((p) => p.status === 'active');
  const archived = visible.filter((p) => p.status === 'archived');
  const sections = CATEGORIES.map((c) => ({
    ...c,
    items: active.filter((p) => p.category === c.id),
  })).filter((s) => s.items.length > 0);

  const pills: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
  ];

  return (
    <div>
      <search className="mb-10 space-y-4">
        <label className="relative block">
          <span className="sr-only">Search projects</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or topics"
            className="glass-input w-full rounded-xl py-3 pr-11 pl-11 text-base text-foreground placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>

        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Filter by category</legend>
          {pills.map((pill) => {
            const selected = category === pill.id;
            const n = counts.get(pill.id) ?? 0;
            return (
              <button
                key={pill.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(pill.id)}
                className={cn(
                  'glass-pill inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {pill.label}
                <span
                  className={cn('text-xs tabular-nums', selected ? 'opacity-80' : 'opacity-60')}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </fieldset>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {visible.length === 0
            ? 'No projects match.'
            : `${active.length} active, ${archived.length} archived`}
        </p>
      </search>

      {visible.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            {query ? `Nothing matches “${query}”` : 'Nothing here yet'}
            {category !== 'all' && ' in this category'}.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('all');
            }}
            className="glass-pill rounded-full px-4 py-2 text-sm text-foreground"
          >
            Show all projects
          </button>
        </div>
      )}

      {sections.map((s) => (
        <section key={s.id} aria-labelledby={`cat-${s.id}`} className="mb-14">
          <div className="mb-5">
            <h2 id={`cat-${s.id}`} className="text-2xl font-semibold">
              {s.label}
            </h2>
            <p className="text-sm text-muted-foreground">{s.blurb}</p>
          </div>
          <CardGrid items={s.items} />
        </section>
      ))}

      {archived.length > 0 && (
        <section aria-labelledby="cat-archived" className="mt-4 border-t border-border pt-10">
          <div className="mb-5">
            <h2 id="cat-archived" className="text-2xl font-semibold">
              Archived
            </h2>
            <p className="text-sm text-muted-foreground">
              Finished, superseded or paused. Code stays public and read-only.
            </p>
          </div>
          <CardGrid items={archived} dense />
        </section>
      )}
    </div>
  );
}
