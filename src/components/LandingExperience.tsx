'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { PlexusBackground } from '@/components/ui/plexus-background';
import SocialDock from '@/components/SocialDock';
import { useTextScramble } from '@/hooks/useTextScramble';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';

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
  const [quoteIndex, setQuoteIndex] = useState(0);
  const beatIntensityRef = useRef(0);

  const { muted, toggleMute, ensurePlaying } = useBackgroundAudio({
    src: '/audio/the-end.mp3',
    beatIntensityRef,
  });

  const targetText = hasClicked ? QUOTES[quoteIndex] : '/ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/';
  const displayText = useTextScramble(targetText);

  // Beat-synced phrase cycling after click
  useEffect(() => {
    if (!hasClicked) return;
    let lastChangeTime = Date.now();
    let wasAbove = false;
    let rafId: number;
    const THRESHOLD = 0.35;
    const MIN_INTERVAL = 3000;
    const FALLBACK_INTERVAL = 5000;

    const tick = () => {
      const intensity = beatIntensityRef.current;
      const now = Date.now();
      const elapsed = now - lastChangeTime;
      const isAbove = intensity > THRESHOLD;

      if ((isAbove && !wasAbove && elapsed > MIN_INTERVAL) || elapsed > FALLBACK_INTERVAL) {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        lastChangeTime = now;
      }
      wasAbove = isAbove;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [hasClicked]);

  const handleClick = () => {
    if (!hasClicked) setHasClicked(true);
    ensurePlaying();
  };

  return (
    <div className="landing-root" onClick={handleClick}>
      <PlexusBackground className="pointer-events-auto" beatIntensityRef={beatIntensityRef} />

      <motion.div
        className="final-card-container pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="relative flex flex-col items-center">
          <div>
            <div className="landing-hero pointer-events-auto">
              <h1 className="landing-hero-name" aria-label="Urmzd Mukhammadnaim">
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
            <div
              className="rounded-2xl bg-white/[0.06] backdrop-blur-sm px-4 py-3 flex items-center justify-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                if (!hasClicked) handleClick();
              }}
            >
              {hasClicked ? (
                <>
                  <span className="text-[11px] text-white/50">
                    <span className="font-medium text-white/80">The End</span>
                    {' \u2014 '}
                    <a
                      href="https://open.spotify.com/artist/0Z3FT3WAN3qbaAIMrs1lbr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-white/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Llow
                    </a>
                  </span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 text-white/40 transition-colors hover:text-white/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    aria-label={muted ? 'Unmute' : 'Mute'}
                  >
                    {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-white/60 cursor-pointer">awaken the sound</span>
              )}
            </div>

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
