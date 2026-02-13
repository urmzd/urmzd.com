'use client';
import { IconChevronDown, IconCompass } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { enhanceCodeBlocks } from '../lib/enhanceCodeBlocks';

interface ExploreCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function ExploreCard({ title, children, defaultOpen = false }: ExploreCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (contentRef.current) {
          enhanceCodeBlocks(contentRef.current);
        }
      }, 50);
    }
  }, [isOpen]);

  return (
    <div className="my-6 rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium text-card-foreground"
        aria-expanded={isOpen}
        aria-controls="explore-card-content"
      >
        <span className="flex items-center gap-2">
          <IconCompass size={20} className="text-muted-foreground" />
          <span className="font-semibold">Explore: {title}</span>
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <IconChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="explore-card-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={contentRef}
              className="border-t border-border px-4 py-4 prose dark:prose-invert max-w-none"
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
