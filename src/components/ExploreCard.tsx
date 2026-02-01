'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IconChevronDown, IconCompass } from '@tabler/icons-react';

interface ExploreCardProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function enhanceCodeBlocks(container: HTMLElement) {
  const preElements = container.querySelectorAll('pre');

  preElements.forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode?.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const button = document.createElement('button');
    button.className = 'copy-button';
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
    button.setAttribute('aria-label', 'Copy code');
    button.setAttribute('title', 'Copy code');

    button.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      const text = code?.textContent || pre.textContent || '';

      try {
        await navigator.clipboard.writeText(text);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        button.classList.add('copied');

        setTimeout(() => {
          button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    });

    wrapper.appendChild(button);
  });
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
