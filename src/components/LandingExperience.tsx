'use client';

import { MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import SocialDock from '@/components/SocialDock';
import { PlexusBackground } from '@/components/ui/plexus-background';
import { CODEX } from '@/components/ui/plexus-shapes';
import { useTextScramble } from '@/hooks/useTextScramble';

const NAME_CHARS = 'URMZD MUKHAMMADNAIM'.split('');

export default function LandingExperience() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameWidth, setNameWidth] = useState<number | undefined>(undefined);
  const [codexIndex, setCodexIndex] = useState(0);

  const entry = CODEX[codexIndex];
  const quoteText = useTextScramble(entry.quote);
  const authorText = useTextScramble(entry.author ?? '');

  const handleCodexChange = useCallback((index: number) => {
    setCodexIndex(index);
  }, []);

  // Track name element width via ResizeObserver
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setNameWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-root">
        <PlexusBackground className="pointer-events-auto" onCodexChange={handleCodexChange} />

        <motion.div
          className="final-card-container pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative flex flex-col items-center">
            <div className="px-4 sm:px-0">
              <div className="landing-hero pointer-events-auto">
                <h1 ref={nameRef} className="landing-hero-name" aria-label="Urmzd Mukhammadnaim">
                  {NAME_CHARS.map((char, i) => {
                    const baseDelay = 0.6 + i * 0.04;
                    return char === ' ' ? (
                      <motion.span
                        key={`space-${i}`}
                        className="w-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: baseDelay }}
                      />
                    ) : (
                      <motion.span
                        key={`char-${i}`}
                        className="landing-hero-char"
                        initial={{
                          opacity: 0,
                          y: 20,
                          color: 'var(--brand)',
                          textShadow:
                            '0 0 20px oklch(from var(--brand) l c h / 70%), 0 0 40px oklch(from var(--brand) l c h / 35%)',
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          color: 'var(--foreground)',
                          textShadow: '0 0 0px transparent',
                        }}
                        transition={{
                          opacity: { duration: 0.3, delay: baseDelay },
                          y: { duration: 0.4, delay: baseDelay, ease: [0.25, 0.46, 0.45, 0.94] },
                          color: { duration: 1.0, delay: baseDelay + 0.3 },
                          textShadow: { duration: 1.2, delay: baseDelay + 0.2 },
                        }}
                      >
                        {char}
                      </motion.span>
                    );
                  })}
                </h1>

                <motion.div
                  className="landing-hero-sub"
                  style={nameWidth ? { maxWidth: nameWidth } : undefined}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  <span className="landing-hero-quote">{quoteText}</span>
                  {authorText && <span className="landing-hero-author">{authorText}</span>}
                </motion.div>
              </div>
            </div>

            <motion.div
              className="pointer-events-auto flex flex-col items-center gap-3 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <SocialDock
                mobileClassName="z-40"
                desktopClassName="fixed bottom-16 left-1/2 -translate-x-1/2 z-40"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
