import { useEffect } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Writes a synthetic pulse value (0–1) to beatIntensityRef at ~60fps.
 * Combines 3 sine waves at irrational frequency ratios for a non-repeating
 * organic rhythm, with quadratic easing so values spend more time near 0
 * with brief peaks — mimicking real beat intensity.
 */
export function useSimulatedPulse(beatIntensityRef: React.MutableRefObject<number>) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      beatIntensityRef.current = 0.25;
      return;
    }

    let rafId: number;

    const tick = () => {
      const t = performance.now() / 1000;
      const a = Math.sin(t * 0.23 * Math.PI * 2);
      const b = Math.sin(t * 0.37 * Math.PI * 2);
      const c = Math.sin(t * 0.71 * Math.PI * 2);

      // Average to 0–1 range then apply quadratic easing
      const raw = (a + b + c + 3) / 6;
      beatIntensityRef.current = raw * raw;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [beatIntensityRef, reducedMotion]);
}
