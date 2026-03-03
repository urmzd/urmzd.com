'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { ParticleField } from './ParticleField';
import { PostProcessing } from './PostProcessing';
import { usePlexusTheme } from './usePlexusTheme';

// =============================================================================
// Types
// =============================================================================

interface PlexusBackgroundProps {
  className?: string;
  anchorRef?: React.RefObject<HTMLElement | null>;
  onCodexChange?: (index: number) => void;
}

// =============================================================================
// Performance tier detection
// =============================================================================

function getPerformanceTier(): 'desktop' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// =============================================================================
// Inner scene content
// =============================================================================

function SceneContent({
  theme,
  positionsBufferRef,
  reducedMotion,
  particleCount,
  onCodexChange,
}: {
  theme: ReturnType<typeof usePlexusTheme>;
  positionsBufferRef: React.MutableRefObject<Float32Array | null>;
  reducedMotion: boolean;
  particleCount: number;
  onCodexChange?: (index: number) => void;
}) {
  return (
    <>
      <ParticleField
        count={particleCount}
        theme={theme}
        positionsBufferRef={positionsBufferRef}
        reducedMotion={reducedMotion}
        onCodexChange={onCodexChange}
      />

      <ConnectionLines
        particleCount={particleCount}
        positionsBufferRef={positionsBufferRef}
        theme={theme}
        reducedMotion={reducedMotion}
      />

      <PostProcessing theme={theme} />
    </>
  );
}

// =============================================================================
// Main exported component
// =============================================================================

export function PlexusBackground({ className = '', onCodexChange }: PlexusBackgroundProps) {
  const theme = usePlexusTheme();
  const reducedMotion = useReducedMotion();
  const positionsBufferRef = useRef<Float32Array | null>(null);

  const [tier] = useState(getPerformanceTier);
  const particleCount = tier === 'mobile' ? 250 : 800;

  return (
    <div
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 15], fov: 60, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
        frameloop="always"
      >
        <SceneContent
          theme={theme}
          positionsBufferRef={positionsBufferRef}
          reducedMotion={reducedMotion}
          particleCount={particleCount}
          onCodexChange={onCodexChange}
        />
      </Canvas>
    </div>
  );
}
