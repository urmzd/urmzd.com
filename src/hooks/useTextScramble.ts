import { useEffect, useRef, useState } from 'react';

const SEED_CHARS = 'ʊəˈːˌɑɪ/MNDZKHPLABCEFGIJOQRSTUVWXY0123456789!@#$%';

function randomChar() {
  return SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
}

export function useTextScramble(text: string, options?: { speed?: number; revealDelay?: number }) {
  const { speed = 40, revealDelay = 30 } = options ?? {};
  const [displayText, setDisplayText] = useState(text);
  const frameRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't animate on mount — just show the initial text
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayText(text);
      return;
    }

    // Cancel any in-progress animation
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const target = text;
    const len = target.length;
    let revealedCount = 0;
    const scrambled = Array.from({ length: len }, () => randomChar());

    // Cycle unresolved characters at `speed` interval
    intervalRef.current = setInterval(() => {
      for (let i = revealedCount; i < len; i++) {
        scrambled[i] = randomChar();
      }
      setDisplayText(
        target.slice(0, revealedCount).concat(scrambled.slice(revealedCount).join(''))
      );
    }, speed);

    // Reveal characters left-to-right with stagger
    function revealNext() {
      if (revealedCount >= len) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(target);
        return;
      }
      revealedCount++;
      frameRef.current = requestAnimationFrame(() => {
        setTimeout(revealNext, revealDelay);
      });
    }

    // Kick off reveals after a short initial scramble burst
    const startTimeout = setTimeout(revealNext, speed * 2);

    return () => {
      clearTimeout(startTimeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, revealDelay]);

  return displayText;
}
