'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  twinkleSpeed: number;
  twinklePhase: number;
  twinkleMin: number;
  twinkleMax: number;
  radius: number;
  id: number;
}

type GalaxyState = 'drifting' | 'collapsing' | 'collapsed' | 'expanding';

// =============================================================================
// Spatial Grid Partitioning
// =============================================================================

type SpatialGrid = Map<string, Particle[]>;

const buildSpatialGrid = (particles: Particle[], cellSize: number): SpatialGrid => {
  const grid: SpatialGrid = new Map();
  for (const particle of particles) {
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);
    const key = `${cellX},${cellY}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(particle);
  }
  return grid;
};

const getNeighborParticles = (grid: SpatialGrid, cellX: number, cellY: number): Particle[] => {
  const neighbors: Particle[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cell = grid.get(`${cellX + dx},${cellY + dy}`);
      if (cell) neighbors.push(...cell);
    }
  }
  return neighbors;
};

// =============================================================================
// Batched Line Drawing
// =============================================================================

const OPACITY_BANDS = 5;
const MAX_LINE_OPACITY = 0.3;

const getOpacityBand = (opacity: number): number =>
  Math.min(Math.floor((opacity / MAX_LINE_OPACITY) * OPACITY_BANDS), OPACITY_BANDS - 1);

// =============================================================================
// Constants
// =============================================================================

const COLLAPSE_DURATION = 1500;
const EXPAND_DURATION = 1200;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =============================================================================
// Connection Drawing
// =============================================================================

function drawConnections(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  connDist: number,
  lineColor: string
) {
  const connDistSq = connDist * connDist;
  const grid = buildSpatialGrid(particles, connDist);

  const batches: Array<Array<[Particle, Particle]>> = Array.from(
    { length: OPACITY_BANDS },
    () => []
  );
  const seen = new Set<string>();

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const cx = Math.floor(p.x / connDist);
    const cy = Math.floor(p.y / connDist);

    for (const n of getNeighborParticles(grid, cx, cy)) {
      if (p === n) continue;
      const j = n.id;
      const pId = p.id;
      const key = pId < j ? `${pId}-${j}` : `${j}-${pId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const dx = p.x - n.x;
      const dy = p.y - n.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < connDistSq) {
        const d = Math.sqrt(dSq);
        const opacity = (1 - d / connDist) * MAX_LINE_OPACITY;
        batches[getOpacityBand(opacity)].push([p, n]);
      }
    }
  }

  ctx.lineWidth = 1;
  for (let b = 0; b < OPACITY_BANDS; b++) {
    if (batches[b].length === 0) continue;
    ctx.strokeStyle = `${lineColor} ${((b + 0.5) / OPACITY_BANDS) * MAX_LINE_OPACITY})`;
    ctx.beginPath();
    for (const [p1, p2] of batches[b]) {
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }
}

// =============================================================================
// Component
// =============================================================================

interface PlexusBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  gravityStrength?: number;
}

export function PlexusBackground({
  className = '',
  particleCount = 150,
  connectionDistance = 120,
  gravityStrength = 800,
}: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<number>(0);
  const channelRef = useRef('255, 255, 255');
  const lineColorRef = useRef('rgba(255, 255, 255,');

  const stateRef = useRef<GalaxyState>('drifting');
  const stateStartTimeRef = useRef<number>(Date.now());
  const lastFrameTimeRef = useRef(0);

  // Theme detection
  useEffect(() => {
    const updateColors = (dark: boolean) => {
      channelRef.current = dark ? '255, 255, 255' : '0, 0, 0';
      lineColorRef.current = dark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';
    };
    const checkDarkMode = () => document.documentElement.classList.contains('dark');
    updateColors(checkDarkMode());

    const observer = new MutationObserver(() => updateColors(checkDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const initParticles = useCallback(
    (width: number, height: number): Particle[] => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          baseX: 0,
          baseY: 0,
          twinkleSpeed: 0.5 + Math.random() * 2.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleMin: 0.1 + Math.random() * 0.2,
          twinkleMax: 0.6 + Math.random() * 0.4,
          radius: 1.0 + Math.random() * 1.5,
          id: i,
        });
      }
      return particles;
    },
    [particleCount]
  );

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle, now: number) => {
    const t = Math.sin(now * 0.001 * p.twinkleSpeed + p.twinklePhase);
    const opacity = p.twinkleMin + (t * 0.5 + 0.5) * (p.twinkleMax - p.twinkleMin);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${channelRef.current}, ${opacity})`;
    ctx.fill();
  }, []);

  const updateParticle = useCallback(
    (
      particle: Particle,
      width: number,
      height: number,
      now: number,
      centerX: number,
      centerY: number
    ) => {
      const state = stateRef.current;
      const elapsed = now - stateStartTimeRef.current;

      if (state === 'drifting') {
        const mouse = mouseRef.current;
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 200) {
          const force = (gravityStrength / 80000) * (1 - dist / 200);
          particle.vx += (dx / dist) * force;
          particle.vy += (dy / dist) * force;
        }
        particle.vx *= 0.999;
        particle.vy *= 0.999;
      } else if (state === 'collapsing') {
        const t = Math.min(elapsed / COLLAPSE_DURATION, 1);
        const ease = easeInOutCubic(t);
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          const radialForce = 0.15 * ease;
          particle.vx += (dx / dist) * radialForce;
          particle.vy += (dy / dist) * radialForce;
          // Tangential spin for spiral
          particle.vx += (-dy / dist) * 0.08 * ease;
          particle.vy += (dx / dist) * 0.08 * ease;
        }
        particle.vx *= 0.98;
        particle.vy *= 0.98;
      } else if (state === 'collapsed') {
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Orbit radius scales with viewport — covers the content card area
        const orbitRadius = Math.min(width, height) * 0.25;
        if (dist > 0) {
          const springForce = Math.max(0, dist - orbitRadius) * 0.01;
          particle.vx += (dx / dist) * springForce;
          particle.vy += (dy / dist) * springForce;
          // Gentle tangential rotation
          particle.vx += (-dy / dist) * 0.03;
          particle.vy += (dx / dist) * 0.03;
        }
        particle.vx *= 0.97;
        particle.vy *= 0.97;
      } else if (state === 'expanding') {
        const t = Math.min(elapsed / EXPAND_DURATION, 1);
        const damping = 0.97 + 0.02 * t; // 0.97 → 0.99
        particle.vx *= damping;
        particle.vy *= damping;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      // Edge wrapping only during drifting/expanding
      if (state === 'drifting' || state === 'expanding') {
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }
    },
    [gravityStrength]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    stateRef.current = 'drifting';
    stateStartTimeRef.current = Date.now();
    lastFrameTimeRef.current = Date.now();

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      return { width: rect.width, height: rect.height };
    };

    let { width, height } = setupCanvas();
    particlesRef.current = initParticles(width, height);

    const handleResize = () => {
      clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = window.setTimeout(() => {
        const oldWidth = width;
        const oldHeight = height;
        const dims = setupCanvas();
        width = dims.width;
        height = dims.height;
        // Scale particle positions proportionally
        for (const p of particlesRef.current) {
          p.x = (p.x / oldWidth) * width;
          p.y = (p.y / oldHeight) * height;
        }
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleClick = () => {
      const state = stateRef.current;
      if (state === 'drifting') {
        stateRef.current = 'collapsing';
        stateStartTimeRef.current = Date.now();
      } else if (state === 'collapsed') {
        // Set burst velocities: radial outward from center
        const cx = width / 2;
        const cy = height / 2;
        for (const p of particlesRef.current) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const magnitude = 3 + Math.random() * 5;
          p.vx = (dx / dist) * magnitude;
          p.vy = (dy / dist) * magnitude;
        }
        stateRef.current = 'expanding';
        stateStartTimeRef.current = Date.now();
      }
      // Ignore clicks during collapsing/expanding
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // Reduced motion: static starfield drawn once
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, width, height);
      const now = Date.now();
      const particles = particlesRef.current;
      for (const p of particles) drawParticle(ctx, p, now);
      drawConnections(ctx, particles, connectionDistance, lineColorRef.current);
      return;
    }

    const animate = () => {
      const now = Date.now();
      lastFrameTimeRef.current = now;
      ctx.clearRect(0, 0, width, height);

      const elapsed = now - stateStartTimeRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // State transitions
      if (stateRef.current === 'collapsing' && elapsed >= COLLAPSE_DURATION) {
        stateRef.current = 'collapsed';
        stateStartTimeRef.current = now;
      } else if (stateRef.current === 'expanding' && elapsed >= EXPAND_DURATION) {
        stateRef.current = 'drifting';
        stateStartTimeRef.current = now;
      }

      const particles = particlesRef.current;
      const state = stateRef.current;
      const connDist =
        state === 'collapsing' || state === 'collapsed'
          ? connectionDistance * 0.6
          : connectionDistance;

      for (let i = 0; i < particles.length; i++) {
        updateParticle(particles[i], width, height, now, centerX, centerY);
        drawParticle(ctx, particles[i], now);
      }

      drawConnections(ctx, particles, connDist, lineColorRef.current);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(resizeTimeoutRef.current);
    };
  }, [initParticles, drawParticle, updateParticle, connectionDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
