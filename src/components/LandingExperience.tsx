"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { splashGraphItems } from "@/data/splashGraph";
import PreviewLink from "@/components/PreviewLink";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 120;

// Preload images for smooth transitions
const preloadImage = (src: string) => {
  if (typeof window === "undefined") return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
};

export default function LandingExperience() {
  const cards = useMemo(() => splashGraphItems, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const wheelLockRef = useRef(false);
  const isFinal = index >= cards.length - 1;
  const activeCard = cards[Math.min(index, cards.length - 1)];

  // Preload next card on mount and index change
  useEffect(() => {
    preloadImage(activeCard.image);
    const nextIndex = Math.min(index + 1, cards.length - 1);
    if (nextIndex !== index) {
      preloadImage(cards[nextIndex].image);
    }
  }, [index, activeCard, cards]);

  useEffect(() => {
    if (paused || isFinal) {
      return;
    }
    const interval = setInterval(() => {
      setIndex((prev) => {
        if (prev >= cards.length - 1) {
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(interval);
  }, [paused, cards.length, isFinal]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) {
      return;
    }
    wheelLockRef.current = true;
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 420);

    if (event.deltaY > 0) {
      setIndex((prev) => Math.min(cards.length - 1, prev + 1));
    } else if (event.deltaY < 0) {
      setIndex((prev) => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="landing-root">
      <div
        className="rolodex"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onWheel={handleWheel}
        role="list"
        aria-label="Timeline cards"
      >
        <AnimatePresence mode="wait">
          {activeCard && (
            <motion.div
              key={activeCard.id}
              className={cn(
                "rolodex-card",
                "rolodex-card-image",
                activeCard.id === "fedora" && "rolodex-card-final"
              )}
              style={{
                ["--card-bg" as string]: `url(${activeCard.image})`,
              }}
              role="listitem"
              aria-label={
                activeCard.id === "fedora"
                  ? "Final card: Urmzd Mukhammadnaim"
                  : `${activeCard.label}: ${activeCard.description}`
              }
              initial={{ opacity: 0, scale: 0.9, rotateX: -20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotateX: 20 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="rolodex-card-inner">
                <div
                  className={cn(
                    "rolodex-bg",
                    activeCard.id === "fedora" && "rolodex-bg-final"
                  )}
                  aria-hidden="true"
                />
                {/* grunge overlay removed to avoid mixing backgrounds */}
                {activeCard.id === "fedora" ? (
                  <div className="rolodex-face rolodex-final-face" aria-live="polite">
                    <div className="final-card">
                        <h1 className="final-card-title">
                          <span style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '1em', opacity: 0.7}}>&lt;/</span>
                          <span> Urmzd Mukhammadnaim </span>
                          <span style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '1em', opacity: 0.7}}>&gt;</span>
                        </h1>
                        <p className="final-card-phonetic" aria-label="phonetic pronunciation">
                          Pronunciation: ouur-MISD moo-HA-mid-NEEM — /aʊrˈmɪzd muːˈxɑmədnaɪm/
                        </p>
                        <p className="final-card-phonetic">
                          trying to live up to my{" "}
                          <PreviewLink
                            href="https://en.wikipedia.org/wiki/Ahura_Mazda"
                            className="final-card-link"
                            width={220}
                            height={140}
                          >
                            <span aria-label="name, linked to Ahura Mazda page">
                              name↗
                            </span>
                          </PreviewLink>
                        </p>
                      </div>
                  </div>
                ) : (
                  <div className="rolodex-face">
                    <div className="rolodex-meta">
                      <strong>{activeCard.label}</strong>
                      <span>{activeCard.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
