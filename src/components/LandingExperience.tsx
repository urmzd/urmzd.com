"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { splashGraphItems } from "@/data/splashGraph";
import PreviewLink from "@/components/PreviewLink";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 240;

export default function LandingExperience() {
  const cards = useMemo(() => splashGraphItems, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const wheelLockRef = useRef(false);
  const isFinal = index >= cards.length - 1;
  const activeCard = cards[Math.min(index, cards.length - 1)];

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
                ["--card-grunge" as string]:
                  activeCard.id === "fedora"
                    ? "url(/images/splash/real/024_alternative.jpg.avif)"
                    : undefined,
              }}
              role="listitem"
              aria-label={
                activeCard.id === "fedora"
                  ? "Final card: Urmzd Mukhammadnaim"
                  : `${activeCard.label}: ${activeCard.description}`
              }
              initial={{ opacity: 0, rotateX: -12, y: 24 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: 12, y: -24 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="rolodex-card-inner">
                <div
                  className={cn(
                    "rolodex-bg",
                    activeCard.id === "fedora" && "rolodex-bg-final"
                  )}
                  aria-hidden="true"
                />
                {activeCard.id === "fedora" && (
                  <div className="rolodex-grunge" aria-hidden="true" />
                )}
                {activeCard.id === "fedora" ? (
                  <div className="rolodex-face rolodex-final-face" aria-live="polite">
                    <div className="final-card">
                      <h1 className="final-card-title">Urmzd Mukhammadnaim</h1>
                      <p className="final-card-subtitle">Software Engineer</p>
                      <p className="final-card-intro">
                        Hello! I'm Urmzd, a software engineer passionate about building
                        great software.
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
                            name ↗
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

      {!isFinal && (
        <button
          className="landing-skip"
          type="button"
          aria-label="Skip to final card"
          onClick={() => setIndex(cards.length - 1)}
        >
          Skip
        </button>
      )}
    </div>
  );
}
