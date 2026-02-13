'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { PlexusBackground } from '@/components/ui/plexus-background';
import SocialDock from '@/components/SocialDock';
import { useTextScramble } from '@/hooks/useTextScramble';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';

const NAME_CHARS = 'URMZD MUKHAMMADNAIM'.split('');

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LandingExperience() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const beatIntensityRef = useRef(0);

  const { muted, toggleMute, ensurePlaying, currentTime, duration } = useBackgroundAudio({
    src: '/audio/the-end.mp3',
    beatIntensityRef,
  });

  const targetText = showEasterEgg ? 'ANYTHING IS POSSIBLE' : '/ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/';
  const displayText = useTextScramble(targetText);

  const handleAutoCollapse = useCallback(() => {
    setShowEasterEgg(true);
  }, []);

  const handleClick = () => {
    setShowEasterEgg((prev) => !prev);
    ensurePlaying();
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="landing-root" onClick={handleClick}>
      <PlexusBackground
        className="pointer-events-auto"
        autoCollapseDelay={3000}
        onAutoCollapse={handleAutoCollapse}
        beatIntensityRef={beatIntensityRef}
      />

      <motion.div
        className="final-card-container pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="relative flex flex-col items-center">
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
              className={`landing-hero-sub ${showEasterEgg ? 'tracking-[0.25em]' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              {displayText}
            </motion.p>
          </div>

          <motion.div
            className="pointer-events-auto absolute top-full mt-6"
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

      {/* Credits / audio tracker widget */}
      <motion.div
        className="pointer-events-auto fixed right-4 bottom-4 z-50 flex items-center gap-2.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm dark:bg-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Track info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1 text-[11px] leading-tight text-white/70 dark:text-white/70">
            <span className="font-medium text-white/90 dark:text-white/90">The End</span>
            <span className="text-white/40 dark:text-white/40">&mdash;</span>
            <a
              href="https://open.spotify.com/artist/0Z3FT3WAN3qbaAIMrs1lbr"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-white/90 dark:hover:text-white/90"
              onClick={(e) => e.stopPropagation()}
            >
              Llow
            </a>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-20 overflow-hidden rounded-full bg-white/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-white/50 transition-[width] duration-300 dark:bg-white/50"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[9px] tabular-nums text-white/40 dark:text-white/40">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        {/* Mute toggle */}
        <button
          type="button"
          className="rounded-full p-1 text-white/60 transition-colors hover:text-white/90 dark:text-white/60 dark:hover:text-white/90"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </motion.div>
    </div>
  );
}
