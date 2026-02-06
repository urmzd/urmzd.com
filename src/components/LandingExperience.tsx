'use client';

import { motion } from 'motion/react';
import PreviewLink from '@/components/PreviewLink';
import { PlexusBackground } from '@/components/ui/plexus-background';

export default function LandingExperience() {
  return (
    <div className="landing-root">
      <PlexusBackground className="pointer-events-auto" />
      <motion.div
        className="final-card-container pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
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
