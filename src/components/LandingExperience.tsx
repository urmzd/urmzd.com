"use client";

import { motion } from "motion/react";
import PreviewLink from "@/components/PreviewLink";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function LandingExperience() {
  return (
    <div className="landing-root">
      <BackgroundBeams />
      <motion.div
        className="final-card-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="final-card">
          <h1 className="final-card-title">
            <PreviewLink
              href="https://en.wikipedia.org/wiki/Ahura_Mazda"
              className="final-card-name-link"
              width={220}
              height={140}
            >
              <span aria-label="Urmzd Mukhammadnaim, linked to Ahura Mazda page">
                Urmzd Mukhammadnaim
              </span>
            </PreviewLink>
          </h1>

          <p className="final-card-phonetic">
            /ʊərˈmuːzd mʊˌhɑːmɑdˈnaɪm/
          </p>

          <p className="final-card-pronunciation">
            oor-moozd, moo-ha-mid-nie,eem
          </p>

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
