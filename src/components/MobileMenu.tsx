'use client';

import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { navItems } from '@/data/navItems';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function MenuPortal({
  open,
  close,
  menuRef,
  pathname,
  reduced,
}: {
  open: boolean;
  close: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  pathname: string;
  reduced: boolean;
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <MotionConfig reducedMotion="user">
          <motion.div
            ref={menuRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="mobile-navigation fixed inset-0 z-modal flex flex-col bg-background/90 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={close}
              aria-label="Close menu"
              className="ml-auto shrink-0"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </svg>
            </Button>

            <nav className="my-auto flex shrink-0 flex-col items-center gap-1 py-4">
              {navItems.map((item, i) => {
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className={`rounded-lg px-8 py-2 text-2xl font-medium tracking-wide transition-colors
                      ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { delay: 0.08 + i * 0.05, duration: 0.3, ease: 'easeOut' }
                    }
                  >
                    {item.label}
                  </motion.a>
                );
              })}
            </nav>
          </motion.div>
        </MotionConfig>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pathname, setPathname] = useState('/');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    return () => document.body.classList.remove('mobile-menu-open');
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Focus trap
  useEffect(() => {
    if (!open || !menuRef.current) return;

    const menu = menuRef.current;
    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus first item on open
    first.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);

  // A rotated phone or resized window must not retain a hidden modal.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <motion.line
            x1="3"
            x2="15"
            animate={open ? { y1: 9, y2: 9, rotate: 45 } : { y1: 4, y2: 4, rotate: 0 }}
            transition={{ duration: 0.25 }}
            style={{ transformOrigin: 'center' }}
          />
          <motion.line
            x1="3"
            x2="15"
            y1="9"
            y2="9"
            animate={open ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
          <motion.line
            x1="3"
            x2="15"
            animate={open ? { y1: 9, y2: 9, rotate: -45 } : { y1: 14, y2: 14, rotate: 0 }}
            transition={{ duration: 0.25 }}
            style={{ transformOrigin: 'center' }}
          />
        </svg>
      </Button>

      {mounted && (
        <MenuPortal
          open={open}
          close={close}
          menuRef={menuRef}
          pathname={pathname}
          reduced={reduced}
        />
      )}
    </>
  );
}
