import { useEffect, useState } from 'react';
import * as THREE from 'three';

export interface PlexusTheme {
  isDark: boolean;
  /** Particle gradient: color0 → color1 (matching original Canvas 2D) */
  color0: THREE.Color;
  color1: THREE.Color;
  /** Connection line color */
  lineColor: THREE.Color;
  /** Subtle HDR boost for bloom pickup */
  hdrIntensity: number;
  /** Bloom parameters — kept subtle */
  bloom: { strength: number; radius: number; threshold: number };
  /** Blending mode: additive for dark (glow), normal for light (visibility) */
  blending: THREE.Blending;
}

const DARK_THEME: PlexusTheme = {
  isDark: true,
  // Gold range (matching original: 248,195,0 → 218,165,32)
  color0: new THREE.Color(0.97, 0.76, 0.0),
  color1: new THREE.Color(0.85, 0.65, 0.13),
  lineColor: new THREE.Color(0.78, 0.63, 0.0),
  hdrIntensity: 0.3,
  bloom: { strength: 0.2, radius: 0.3, threshold: 0.5 },
  blending: THREE.AdditiveBlending,
};

const LIGHT_THEME: PlexusTheme = {
  isDark: false,
  // Dark grey/black — high contrast on white backgrounds
  color0: new THREE.Color(0.15, 0.15, 0.15),
  color1: new THREE.Color(0.25, 0.25, 0.25),
  lineColor: new THREE.Color(0.12, 0.12, 0.12),
  hdrIntensity: 0.25,
  bloom: { strength: 0.15, radius: 0.3, threshold: 0.5 },
  blending: THREE.NormalBlending,
};

function checkDarkMode(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

export function usePlexusTheme(): PlexusTheme {
  const [isDark, setIsDark] = useState(() => checkDarkMode());

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(checkDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark ? DARK_THEME : LIGHT_THEME;
}
