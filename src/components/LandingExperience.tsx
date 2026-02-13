'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pointer } from 'lucide-react';
import { PlexusBackground } from '@/components/ui/plexus-background';
import SocialDock from '@/components/SocialDock';

export default function LandingExperience() {
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    hintTimerRef.current = setTimeout(() => setShowHint(true), 3000);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setShowHint(false);
  };

  return (
    <div className="landing-root" onClick={handleClick}>
      <PlexusBackground className="pointer-events-auto" />

      <motion.div
        className="final-card-container pointer-events-none opacity-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {showHint && (
              <motion.div
                className="click-hint pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Pointer className="click-hint-hand" size={28} />
                <span className="click-hint-text">click anywhere</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="final-card glass-panel pointer-events-auto">
            <motion.h1
              className="final-card-title"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Urmzd Mukhammadnaim
            </motion.h1>

            <motion.p
              className="final-card-phonetic"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              /ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/
            </motion.p>
          </div>

          <motion.div
            className="pointer-events-auto absolute top-full mt-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
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
