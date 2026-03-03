'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ConnectionLines } from './ConnectionLines';
import { ParticleField } from './ParticleField';
import { PostProcessing } from './PostProcessing';
import { usePlexusTheme } from './usePlexusTheme';

// =============================================================================
// Types
// =============================================================================

export interface CursorState {
  x: number;
  y: number;
  active: boolean;
  mode: 1 | -1;
}

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
// CursorTracker — converts pointer events to world-space coordinates
// =============================================================================

const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersection = new THREE.Vector3();

function CursorTracker({ cursorRef }: { cursorRef: React.MutableRefObject<CursorState> }) {
  const { camera, gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const updatePosition = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      _pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointer, camera);
      if (_raycaster.ray.intersectPlane(_plane, _intersection)) {
        cursorRef.current.x = _intersection.x;
        cursorRef.current.y = _intersection.y;
        cursorRef.current.active = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => updatePosition(e.clientX, e.clientY);
    const onPointerLeave = () => {
      cursorRef.current.active = false;
    };
    const onClick = () => {
      cursorRef.current.mode = cursorRef.current.mode === -1 ? 1 : -1;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) updatePosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => {
      cursorRef.current.active = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('click', onClick);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('click', onClick);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [camera, gl, cursorRef]);

  return null;
}

// =============================================================================
// Inner scene content
// =============================================================================

function SceneContent({
  theme,
  positionsBufferRef,
  cursorRef,
  reducedMotion,
  particleCount,
  onCodexChange,
}: {
  theme: ReturnType<typeof usePlexusTheme>;
  positionsBufferRef: React.MutableRefObject<Float32Array | null>;
  cursorRef: React.MutableRefObject<CursorState>;
  reducedMotion: boolean;
  particleCount: number;
  onCodexChange?: (index: number) => void;
}) {
  return (
    <>
      <CursorTracker cursorRef={cursorRef} />

      <ParticleField
        count={particleCount}
        theme={theme}
        positionsBufferRef={positionsBufferRef}
        cursorRef={cursorRef}
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
  const cursorRef = useRef<CursorState>({ x: 0, y: 0, active: false, mode: -1 });

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
          cursorRef={cursorRef}
          reducedMotion={reducedMotion}
          particleCount={particleCount}
          onCodexChange={onCodexChange}
        />
      </Canvas>
    </div>
  );
}
