'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pointer } from 'lucide-react';
import PreviewLink from '@/components/PreviewLink';
import { PlexusBackground } from '@/components/ui/plexus-background';

export default function LandingExperience() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-root" onClick={() => setShowHint(false)}>
      <PlexusBackground className="pointer-events-auto" />

      <motion.div
        className="final-card-container pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
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

        <div className="final-card pointer-events-auto">
          <h1 className="final-card-title">
            <PreviewLink
              href="https://linkedin.com/in/urmzd"
              className="final-card-name-link"
              width={220}
              height={140}
            >
              <span aria-label="Urmzd Mukhammadnaim, linked to LinkedIn profile">
                Urmzd Mukhammadnaim
              </span>
            </PreviewLink>
          </h1>

          <p className="final-card-phonetic">/ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/</p>

          <div className="final-card-contact">
            <span className="final-card-contact-label">Contact me:</span>
            <a href="mailto:hello@urmzd.com" className="final-card-email">
              hello@urmzd.com
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
