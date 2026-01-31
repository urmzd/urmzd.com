import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconList, IconChevronDown } from '@tabler/icons-react';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface MobileTOCProps {
  headings: Heading[];
}

export default function MobileTOC({ headings }: MobileTOCProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', `#${slug}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="mb-6 rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
        aria-expanded={isOpen}
        aria-controls="mobile-toc-list"
      >
        <span className="flex items-center gap-2">
          <IconList size={18} />
          Table of Contents
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IconChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-toc-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ul className="border-t border-border px-4 py-3 text-sm">
              {headings.map(({ depth, slug, text }) => (
                <li key={slug} style={{ paddingLeft: `${(depth - 2) * 12}px` }}>
                  <button
                    onClick={() => handleClick(slug)}
                    className="block w-full py-2 text-left text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
