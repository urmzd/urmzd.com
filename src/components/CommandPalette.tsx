'use client';

import { ArrowRight, Moon, Search, Sun } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { navItems } from '@/data/navItems';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PaletteItem {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  action: () => void;
}

function PalettePortal({
  open,
  close,
  reduced,
}: {
  open: boolean;
  close: () => void;
  reduced: boolean;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = navItems.map((item) => ({
      id: `page-${item.href}`,
      label: item.label,
      section: 'Pages',
      icon: <ArrowRight className="h-4 w-4" />,
      action: () => {
        window.location.href = item.href;
      },
    }));

    const actions: PaletteItem[] = [
      {
        id: 'toggle-theme',
        label: 'Toggle theme',
        section: 'Actions',
        icon: (
          <>
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </>
        ),
        action: () => {
          document.documentElement.classList.toggle('dark');
        },
      },
    ];

    return [...pages, ...actions];
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, items]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const runItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        close();
        item.action();
      }
    },
    [filtered, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runItem(activeIndex);
      }
    },
    [filtered.length, activeIndex, runItem],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Group items by section
  const sections = useMemo(() => {
    const map = new Map<string, { items: PaletteItem[]; startIndex: number }>();
    let idx = 0;
    for (const item of filtered) {
      const existing = map.get(item.section);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(item.section, { items: [item], startIndex: idx });
      }
      idx++;
    }
    return map;
  }, [filtered]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <MotionConfig reducedMotion="user">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="fixed inset-0 z-modal flex items-start justify-center pt-[20vh] bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.15 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <motion.div
              className="w-full max-w-lg mx-4 overflow-hidden rounded-xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.15 }}
              onKeyDown={handleKeyDown}
            >
              <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search pages and actions..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  aria-label="Search commands"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/50 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                  esc
                </kbd>
              </div>

              <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2" role="listbox">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                  </p>
                ) : (
                  Array.from(sections.entries()).map(
                    ([section, { items: sectionItems, startIndex }]) => (
                      <div key={section}>
                        <p className="px-2 py-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
                          {section}
                        </p>
                        {sectionItems.map((item, i) => {
                          const globalIndex = startIndex + i;
                          const isActive = globalIndex === activeIndex;
                          return (
                            <button
                              key={item.id}
                              role="option"
                              aria-selected={isActive}
                              data-active={isActive}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? 'bg-foreground/10 text-foreground'
                                  : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                              }`}
                              onClick={() => runItem(globalIndex)}
                              onMouseEnter={() => setActiveIndex(globalIndex)}
                            >
                              <span className="shrink-0">{item.icon}</span>
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ),
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        </MotionConfig>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const reduced = useReducedMotion();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    const onCustomOpen = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('open-command-palette', onCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('open-command-palette', onCustomOpen);
    };
  }, [open]);

  if (!mounted) return null;

  return <PalettePortal open={open} close={close} reduced={reduced} />;
}
