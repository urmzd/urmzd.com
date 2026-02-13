import { useState, useEffect, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10;
const HOVER_ZONE_PX = 30;

export function useScrollDirection() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const rafId = useRef(0);

  const update = useCallback(() => {
    const y = window.scrollY;
    const atTop = y < SCROLL_THRESHOLD;

    setIsAtTop(atTop);

    if (atTop) {
      setIsVisible(true);
    } else {
      const delta = y - lastScrollY.current;
      if (delta > SCROLL_THRESHOLD) {
        setIsVisible(false);
      } else if (delta < -SCROLL_THRESHOLD) {
        setIsVisible(true);
      }
    }

    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (e.clientY <= HOVER_ZONE_PX) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [update]);

  return { isVisible, isAtTop };
}
