'use client';

import { MotionConfig, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import SocialDock from '@/components/SocialDock';
import { CODEX } from '@/components/ui/plexus-shapes';
import { useTextScramble } from '@/hooks/useTextScramble';

const NAME_CHARS = 'URMZD MUKHAMMADNAIM'.split('');

export default function LandingExperience() {
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameWidth, setNameWidth] = useState<number | undefined>(undefined);
  const [codexIndex, setCodexIndex] = useState(0);

  const displayText = useTextScramble(CODEX[codexIndex].quote);

  // Cycle through codex quotes
  useEffect(() => {
    const advance = () => {
      setCodexIndex((prev) => {
        const next = (prev + 1) % CODEX.length;
        timer = setTimeout(advance, CODEX[next].holdMs);
        return next;
      });
    };
    let timer = setTimeout(advance, CODEX[0].holdMs);
    return () => clearTimeout(timer);
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
        <motion.div
          className="final-card-container pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative flex flex-col items-center">
            <div className="px-4 sm:px-0">
              <div className="landing-hero">
                <h1 ref={nameRef} className="landing-hero-name" aria-label="Urmzd Mukhammadnaim">
                  {NAME_CHARS.map((char, i) =>
                    char === ' ' ? (
                      <motion.span
                        key={i}
                        className="w-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.04 }}
                      />
                    ) : (
                      <motion.span
                        key={i}
                        className="landing-hero-char"
                        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{
                          duration: 0.5,
                          delay: 0.6 + i * 0.04,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                      >
                        {char}
                      </motion.span>
                    ),
                  )}
                </h1>

                <motion.p
                  className="landing-hero-sub"
                  style={nameWidth ? { maxWidth: nameWidth } : undefined}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 }}
                >
                  {displayText}
                </motion.p>
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
