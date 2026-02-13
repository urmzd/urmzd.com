'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PlexusBackground } from '@/components/ui/plexus-background';
import SocialDock from '@/components/SocialDock';
import { useTextScramble } from '@/hooks/useTextScramble';
import { useSimulatedPulse } from '@/hooks/useSimulatedPulse';

const NAME_CHARS = 'URMZD MUKHAMMADNAIM'.split('');

const QUOTES = [
  '"THE HAPPINESS OF YOUR LIFE DEPENDS UPON THE QUALITY OF YOUR THOUGHTS" — MARCUS AURELIUS',
  '"LIBERTY MEANS RESPONSIBILITY" — GEORGE BERNARD SHAW',
  '"THE SECRET OF HAPPINESS IS FREEDOM, AND THE SECRET OF FREEDOM IS COURAGE" — THUCYDIDES',
  '"PEOPLE DEMAND FREEDOM OF SPEECH AS A COMPENSATION FOR THE FREEDOM OF THOUGHT WHICH THEY SELDOM USE" — KIERKEGAARD',
  '"THE ONLY WAY TO DEAL WITH AN UNFREE WORLD IS TO BECOME SO ABSOLUTELY FREE THAT YOUR VERY EXISTENCE IS AN ACT OF REBELLION" — CAMUS',
  '"BRAVE NEW WORLD" — ALDOUS HUXLEY',
  '"TO THINE OWN SELF BE TRUE" — SHAKESPEARE',
  '"THE UNEXAMINED LIFE IS NOT WORTH LIVING" — SOCRATES',
  '"MAN IS BORN FREE, AND EVERYWHERE HE IS IN CHAINS" — ROUSSEAU',
  '"IN THE MIDDLE OF DIFFICULTY LIES OPPORTUNITY" — EINSTEIN',
  '"NO MAN IS FREE WHO IS NOT MASTER OF HIMSELF" — EPICTETUS',
  '"THE MIND IS ITS OWN PLACE, AND IN ITSELF CAN MAKE A HEAVEN OF HELL" — MILTON',
];

export default function LandingExperience() {
  const [hasClicked, setHasClicked] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(-1);
  const beatIntensityRef = useRef(0);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameWidth, setNameWidth] = useState<number | undefined>(undefined);

  useSimulatedPulse(beatIntensityRef);

  const targetText = quoteIndex < 0 ? '/ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/' : QUOTES[quoteIndex];
  const displayText = useTextScramble(targetText);

  const handleShapeChange = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
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

  const handleClick = () => {
    if (!hasClicked) {
      setHasClicked(true);
    }
  };

  return (
    <div className="landing-root" onClick={handleClick}>
      <PlexusBackground
        className="pointer-events-auto"
        beatIntensityRef={beatIntensityRef}
        onShapeChange={handleShapeChange}
      />

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
                {NAME_CHARS.map((char, i) => (
                  <motion.span
                    key={i}
                    className={`landing-hero-char ${char === ' ' ? 'landing-hero-space' : ''}`}
                    initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.5,
                      delay: 0.6 + i * 0.04,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </h1>

              <motion.p
                className={`landing-hero-sub ${hasClicked ? 'tracking-[0.25em]' : ''}`}
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
  );
}
