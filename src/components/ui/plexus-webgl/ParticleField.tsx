import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { CODEX, type Point3D, type ShapeConfig } from '../plexus-shapes';
import type { CursorState } from './PlexusScene';
import { particleFragmentShader, particleVertexShader } from './shaders';
import type { PlexusTheme } from './usePlexusTheme';

// =============================================================================
// Constants
// =============================================================================

const FRACTAL_LERP_SPEED = 1.2;
const FRACTAL_SCALE = 0.35;
const MICRO_JITTER = 0.15;
const Z_MID = 0;
const Z_RANGE = 8;

const CURSOR_STRENGTH = 8.0;
const CURSOR_RADIUS = 4.0;
const CURSOR_SOFTENING = 0.5;
const CURSOR_MAX_FORCE = 2.0;

interface ParticleFieldProps {
  count: number;
  theme: PlexusTheme;
  positionsBufferRef: React.MutableRefObject<Float32Array | null>;
  cursorRef: React.MutableRefObject<CursorState>;
  reducedMotion: boolean;
  onCodexChange?: (index: number) => void;
}

export function ParticleField({
  count,
  theme,
  positionsBufferRef,
  cursorRef,
  reducedMotion,
  onCodexChange,
}: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();

  // Per-particle velocity storage (CPU-side physics)
  const velocities = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      v[i * 3] = (Math.random() - 0.5) * 0.008;
      v[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    return v;
  }, [count]);

  // Shape state refs
  const shapeTargetsRef = useRef<Point3D[]>([]);
  const currentShapeRef = useRef<ShapeConfig>(CODEX[0].shape);
  const angleRef = useRef({ x: 0, y: 0, z: 0 });

  // Codex cycling refs
  const codexIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCodexChangeRef = useRef(onCodexChange);
  onCodexChangeRef.current = onCodexChange;

  // Codex cycling via setTimeout chain
  useEffect(() => {
    const setEntry = (idx: number) => {
      const entry = CODEX[idx];
      currentShapeRef.current = entry.shape;
      shapeTargetsRef.current = entry.shape.generate(count);
      angleRef.current = { x: 0, y: 0, z: 0 };
      onCodexChangeRef.current?.(idx);
    };

    // Initialize first entry
    codexIndexRef.current = 0;
    setEntry(0);

    if (reducedMotion) return;

    const advance = () => {
      codexIndexRef.current = (codexIndexRef.current + 1) % CODEX.length;
      const idx = codexIndexRef.current;
      setEntry(idx);
      timerRef.current = setTimeout(advance, CODEX[idx].holdMs);
    };

    timerRef.current = setTimeout(advance, CODEX[0].holdMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [count, reducedMotion]);

  // Build geometry buffers
  const { geometry, positions } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const ct = new Float32Array(count);

    const spread = Math.max(viewport.width, viewport.height) * 0.8;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * Z_RANGE * 2;
      sz[i] = 1.5 + Math.random() * 3.5;
      ph[i] = Math.random() * Math.PI * 2;
      ct[i] = (i * 0.6180339887) % 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    geo.setAttribute('aColorT', new THREE.BufferAttribute(ct, 1));

    return { geometry: geo, positions: pos };
  }, [count, viewport.width, viewport.height]);

  // Expose positions buffer to ConnectionLines
  useEffect(() => {
    positionsBufferRef.current = positions;
  }, [positions, positionsBufferRef]);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1.5 },
      uColor0: { value: theme.color0.clone() },
      uColor1: { value: theme.color1.clone() },
      uHdrIntensity: { value: theme.hdrIntensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Update theme colors
  useEffect(() => {
    uniforms.uColor0.value.copy(theme.color0);
    uniforms.uColor1.value.copy(theme.color1);
    uniforms.uHdrIntensity.value = theme.hdrIntensity;
  }, [theme, uniforms]);

  // Animation frame
  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.1);

    uniforms.uTime.value += dt;
    if (reducedMotion) return;

    const targets = shapeTargetsRef.current;
    const shape = currentShapeRef.current;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    // Rotation matrix for shape targets
    const angles = angleRef.current;
    angles.x += shape.spinX * dt;
    angles.y += shape.spinY * dt;
    angles.z += shape.spinZ * dt;

    const cx = Math.cos(angles.x),
      sx = Math.sin(angles.x);
    const cy = Math.cos(angles.y),
      sy = Math.sin(angles.y);
    const cz = Math.cos(angles.z),
      sz = Math.sin(angles.z);

    const m00 = cz * cy;
    const m01 = cz * sy * sx - sz * cx;
    const m02 = cz * sy * cx + sz * sx;
    const m10 = sz * cy;
    const m11 = sz * sy * sx + cz * cx;
    const m12 = sz * sy * cx - cz * sx;
    const m20 = -sy;
    const m21 = cy * sx;
    const m22 = cy * cx;

    const sc = Math.min(viewport.width, viewport.height) * FRACTAL_SCALE * (shape.spread ?? 1);
    const jit = MICRO_JITTER * (shape.jitter ?? 1);
    const lerpT = 1 - Math.exp(-FRACTAL_LERP_SPEED * (shape.lerpMul ?? 1) * dt);
    const damp = 0.98 ** (dt * 60);
    const shapeDamp = 0.9 ** (dt * 60);
    const time = uniforms.uTime.value;

    // Cursor state (hoisted before loop)
    const cursor = cursorRef.current;
    const cursorActive = cursor.active;
    const cursorX = cursor.x;
    const cursorY = cursor.y;
    const cursorMode = cursor.mode;
    const radiusSq = CURSOR_RADIUS * CURSOR_RADIUS;
    const softeningSq = CURSOR_SOFTENING * CURSOR_SOFTENING;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let px = posArray[i3];
      let py = posArray[i3 + 1];
      let pz = posArray[i3 + 2];
      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      // Damping
      vx *= damp;
      vy *= damp;
      vz *= damp;

      px += vx;
      py += vy;
      pz += vz;

      // Shape formation
      if (targets.length > 0) {
        const tgt = targets[i % targets.length];
        const tx = tgt.x,
          ty = tgt.y,
          tz = tgt.z;
        const rx = m00 * tx + m01 * ty + m02 * tz;
        const ry = m10 * tx + m11 * ty + m12 * tz;
        const rz = m20 * tx + m21 * ty + m22 * tz;

        const phase = i * 2.399 + time * 0.8;
        const jx = Math.sin(phase) * jit * 0.1;
        const jy = Math.cos(phase * 1.37) * jit * 0.1;

        px += (rx * sc + jx - px) * lerpT;
        py += (ry * sc + jy - py) * lerpT;
        pz += (Z_MID + rz * sc * 0.3 - pz) * lerpT * 0.3;
        vx *= shapeDamp;
        vy *= shapeDamp;
        vz *= shapeDamp;
      }

      // Cursor gravitational force
      if (cursorActive) {
        const dx = cursorX - px;
        const dy = cursorY - py;
        const distSq = dx * dx + dy * dy;
        if (distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          const falloff = 1 - distSq / radiusSq;
          const force =
            Math.min(CURSOR_STRENGTH / (distSq + softeningSq), CURSOR_MAX_FORCE) *
            falloff *
            cursorMode *
            dt;
          const invDist = dist > 0.001 ? 1 / dist : 0;
          vx += dx * invDist * force;
          vy += dy * invDist * force;
        }
      }

      // Z boundary springs
      const zMax = Z_RANGE;
      if (pz < -zMax) {
        const pen = (-zMax - pz) / zMax;
        vz += pen * pen * 0.1;
      } else if (pz > zMax) {
        const pen = (pz - zMax) / zMax;
        vz -= pen * pen * 0.1;
      }
      pz = Math.max(-zMax, Math.min(zMax, pz));

      posArray[i3] = px;
      posArray[i3 + 1] = py;
      posArray[i3 + 2] = pz;
      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={theme.blending}
      />
    </points>
  );
}
