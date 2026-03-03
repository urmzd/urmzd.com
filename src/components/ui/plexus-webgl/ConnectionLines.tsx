import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { lineFragmentShader, lineVertexShader } from './shaders';
import type { PlexusTheme } from './usePlexusTheme';

// =============================================================================
// Connection lines using spatial grid hashing (ported from Canvas 2D)
// =============================================================================

const CONNECTION_DIST = 3.0;
const CONNECTION_DIST_SQ = CONNECTION_DIST * CONNECTION_DIST;
const Z_CONNECTION_MAX = 4.0;
const MAX_CONNECTIONS = 5000;
const MAX_GRID = 64;

interface ConnectionLinesProps {
  particleCount: number;
  positionsBufferRef: React.MutableRefObject<Float32Array | null>;
  theme: PlexusTheme;
  reducedMotion: boolean;
}

export function ConnectionLines({
  particleCount,
  positionsBufferRef,
  theme,
  reducedMotion,
}: ConnectionLinesProps) {
  const meshRef = useRef<THREE.LineSegments>(null);

  const { geometry, linePositions, lineAlphas } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(MAX_CONNECTIONS * 2 * 3);
    const alpha = new Float32Array(MAX_CONNECTIONS * 2);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    geo.setDrawRange(0, 0);
    return { geometry: geo, linePositions: pos, lineAlphas: alpha };
  }, []);

  const uniforms = useMemo(
    () => ({
      uLineColor: { value: theme.lineColor.clone() },
      uOpacity: { value: 0.3 },
      uTime: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Update theme
  useMemo(() => {
    uniforms.uLineColor.value.copy(theme.lineColor);
  }, [theme, uniforms]);

  const gridHead = useRef(new Int32Array(0));
  const gridNext = useRef(new Int16Array(0));

  useFrame((_, delta) => {
    const positions = positionsBufferRef.current;
    if (!positions || !meshRef.current) return;

    uniforms.uTime.value += Math.min(delta, 0.1);

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const alphaAttr = geometry.getAttribute('aAlpha') as THREE.BufferAttribute;

    // Build spatial grid
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const gridW = Math.min(MAX_GRID, Math.max(1, Math.ceil(rangeX / CONNECTION_DIST)));
    const gridH = Math.min(MAX_GRID, Math.max(1, Math.ceil(rangeY / CONNECTION_DIST)));
    const cellW = rangeX / gridW;
    const cellH = rangeY / gridH;

    const gridSize = gridW * gridH;
    if (gridHead.current.length < gridSize) {
      gridHead.current = new Int32Array(gridSize);
    }
    if (gridNext.current.length < particleCount) {
      gridNext.current = new Int16Array(particleCount);
    }

    const head = gridHead.current;
    const next = gridNext.current;
    head.fill(-1);

    for (let i = 0; i < particleCount; i++) {
      const gx = Math.min(gridW - 1, Math.max(0, Math.floor((positions[i * 3] - minX) / cellW)));
      const gy = Math.min(
        gridH - 1,
        Math.max(0, Math.floor((positions[i * 3 + 1] - minY) / cellH)),
      );
      const cell = gy * gridW + gx;
      next[i] = head[cell];
      head[cell] = i;
    }

    let lineCount = 0;
    for (let i = 0; i < particleCount && lineCount < MAX_CONNECTIONS; i++) {
      const ax = positions[i * 3];
      const ay = positions[i * 3 + 1];
      const az = positions[i * 3 + 2];
      const gx = Math.min(gridW - 1, Math.max(0, Math.floor((ax - minX) / cellW)));
      const gy = Math.min(gridH - 1, Math.max(0, Math.floor((ay - minY) / cellH)));

      for (let dy = -1; dy <= 1; dy++) {
        const ny = gy + dy;
        if (ny < 0 || ny >= gridH) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx;
          if (nx < 0 || nx >= gridW) continue;
          let j = head[ny * gridW + nx];
          while (j !== -1 && lineCount < MAX_CONNECTIONS) {
            if (j > i) {
              const bx = positions[j * 3];
              const by = positions[j * 3 + 1];
              const bz = positions[j * 3 + 2];
              const dz = Math.abs(az - bz);
              if (dz <= Z_CONNECTION_MAX) {
                const ddx = ax - bx;
                const ddy = ay - by;
                const dSq = ddx * ddx + ddy * ddy;
                if (dSq < CONNECTION_DIST_SQ) {
                  const ratio = 1 - Math.sqrt(dSq) / CONNECTION_DIST;
                  const depthFade = 1 - dz / Z_CONNECTION_MAX;
                  const alpha = ratio * depthFade * 0.5;

                  const idx = lineCount * 6;
                  linePositions[idx] = ax;
                  linePositions[idx + 1] = ay;
                  linePositions[idx + 2] = az;
                  linePositions[idx + 3] = bx;
                  linePositions[idx + 4] = by;
                  linePositions[idx + 5] = bz;

                  const aIdx = lineCount * 2;
                  lineAlphas[aIdx] = alpha;
                  lineAlphas[aIdx + 1] = alpha;

                  lineCount++;
                }
              }
            }
            j = next[j];
          }
        }
      }
    }

    geometry.setDrawRange(0, lineCount * 2);
    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={lineVertexShader}
        fragmentShader={lineFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={theme.blending}
      />
    </lineSegments>
  );
}
