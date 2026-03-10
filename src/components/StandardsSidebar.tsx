'use client';

import { Bot, Code2, Palette, Terminal } from 'lucide-react';

interface StandardsEntry {
  id: string;
  title: string;
  category: string;
}

interface StandardsSidebarProps {
  entries: StandardsEntry[];
  currentId: string;
}

const categoryMeta: Record<string, { icon: typeof Bot; label: string }> = {
  ai: { icon: Bot, label: 'AI' },
  development: { icon: Code2, label: 'Development' },
  cli: { icon: Terminal, label: 'CLI' },
  visual: { icon: Palette, label: 'Visual' },
};

const categoryOrder = ['ai', 'development', 'cli', 'visual'];

export default function StandardsSidebar({ entries, currentId }: StandardsSidebarProps) {
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      ...categoryMeta[cat],
      items: entries.filter((e) => e.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <nav className="sticky top-24 space-y-5" aria-label="Standards navigation">
      <a
        href="/standards"
        className="mb-1 block text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; All standards
      </a>

      {grouped.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.category}>
            <div className="mb-2 flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </span>
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`/standards/${item.id}`}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      currentId === item.id
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
