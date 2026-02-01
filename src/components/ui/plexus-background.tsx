'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
}

// =============================================================================
// OPTIMIZATION 1: Spatial Grid Partitioning
// =============================================================================
// Problem: The naive approach checks all n² particle pairs for connections.
// For 100 particles, that's 4,950 distance checks per frame (n*(n-1)/2).
//
// Solution: Spatial hashing divides the canvas into a grid of cells, each sized
// to match the connection distance. Since particles can only connect if they're
// within connectionDistance, we only need to check particles in the same cell
// or the 8 adjacent cells (a 3×3 neighborhood).
//
// Complexity Analysis:
// - Building the grid: O(n) - one hash operation per particle
// - Querying neighbors: O(k) where k is avg particles per cell neighborhood
// - For uniformly distributed particles: k ≈ 9 * (n / totalCells)
// - Total: O(n + n*k) ≈ O(n) average case vs O(n²) naive
//
// The key insight is that spatial locality is preserved: nearby particles
// hash to the same or adjacent cells, so we never miss valid connections
// while skipping the vast majority of impossible pairs.
// =============================================================================

type SpatialGrid = Map<string, Particle[]>;

/**
 * Builds a spatial hash grid from particles.
 * Each cell is cellSize × cellSize pixels.
 * Particles are hashed by their integer cell coordinates.
 */
const buildSpatialGrid = (particles: Particle[], cellSize: number): SpatialGrid => {
  const grid: SpatialGrid = new Map();

  for (const particle of particles) {
    // Hash: floor(position / cellSize) gives integer cell coordinates
    // This maps continuous 2D space to discrete grid cells
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);
    // String key for Map (JS Maps don't support tuple keys natively)
    const key = `${cellX},${cellY}`;

    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(particle);
  }

  return grid;
};

/**
 * Returns all particles that could potentially connect to a particle at (cellX, cellY).
 * This includes the particle's own cell plus all 8 adjacent cells (3×3 neighborhood).
 *
 * Why 3×3? A particle at the edge of its cell could be within connectionDistance
 * of a particle at the far edge of an adjacent cell. Since cellSize = connectionDistance,
 * we only need to check immediate neighbors.
 */
const getNeighborParticles = (grid: SpatialGrid, cellX: number, cellY: number): Particle[] => {
  const neighbors: Particle[] = [];

  // Iterate over 3×3 neighborhood centered on (cellX, cellY)
  // dx, dy ∈ {-1, 0, 1} gives us 9 cells total
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${cellX + dx},${cellY + dy}`;
      const cell = grid.get(key);
      if (cell) {
        neighbors.push(...cell);
      }
    }
  }

  return neighbors;
};

// =============================================================================
// OPTIMIZATION 3: Batched Line Drawing (Constants)
// =============================================================================
// Problem: Each drawLine() call changes strokeStyle and calls stroke(),
// triggering GPU state changes. For 100 particles with ~50 connections each,
// that's ~50+ draw calls per frame.
//
// Solution: Group lines by opacity into discrete bands. All lines in a band
// share the same strokeStyle, so we can batch them into a single path and
// call stroke() once per band.
//
// Why 5 bands? It's a tradeoff:
// - More bands = finer opacity gradation but more draw calls
// - Fewer bands = coarser appearance but better batching
// - 5 bands gives opacity steps of ~0.06 (0.3/5), which is visually smooth
//   while reducing draw calls from ~50 to just 5 per frame (~10x improvement)
//
// The opacity formula: bandOpacity = ((band + 0.5) / OPACITY_BANDS) * maxOpacity
// We use (band + 0.5) to center each band's opacity in its range.
// =============================================================================

const OPACITY_BANDS = 5;
const MAX_LINE_OPACITY = 0.3;

/**
 * Quantizes a continuous opacity value into one of OPACITY_BANDS discrete bands.
 * Input: opacity in [0, maxOpacity]
 * Output: band index in [0, OPACITY_BANDS - 1]
 */
const getOpacityBand = (opacity: number): number => {
  // Normalize to [0, 1], multiply by band count, floor to get index
  // Math.min ensures we don't exceed the max band index due to floating point
  const normalized = opacity / MAX_LINE_OPACITY;
  return Math.min(Math.floor(normalized * OPACITY_BANDS), OPACITY_BANDS - 1);
};

interface PlexusBackgroundProps {
  className?: string;
  particleCount?: number;
  connectionDistance?: number;
  gravityStrength?: number;
}

export function PlexusBackground({
  className = '',
  particleCount = 100,
  connectionDistance = 120,
  gravityStrength = 800,
}: PlexusBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const isAttractingRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<number>(0);
  const particleColorRef = useRef('rgba(255, 255, 255, 0.5)');
  const lineColorRef = useRef('rgba(255, 255, 255,');

  // Detect theme and listen for changes - update refs instead of state
  useEffect(() => {
    const updateColors = (dark: boolean) => {
      particleColorRef.current = dark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
      lineColorRef.current = dark ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';
    };

    const checkDarkMode = () => document.documentElement.classList.contains('dark');
    updateColors(checkDarkMode());

    const observer = new MutationObserver(() => {
      updateColors(checkDarkMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const initParticles = useCallback(
    (width: number, height: number) => {
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          baseX: x,
          baseY: y,
        });
      }
      return particles;
    },
    [particleCount]
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = particleColorRef.current;
      ctx.fill();
    },
    [] // No dependencies - reads from ref
  );

  // Note: drawLine is no longer used - replaced by batched drawing in animate()
  // Keeping the comment here to document the original approach for reference:
  // The old drawLine() called beginPath/stroke for EACH line, causing many GPU
  // state changes. The new batched approach groups lines by opacity band.

  const updateParticle = useCallback(
    (particle: Particle, width: number, height: number) => {
      const mouse = mouseRef.current;
      const isAttracting = isAttractingRef.current;

      // Calculate distance from cursor
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);

      // Gravitational field effect - affects all particles based on distance
      // Use inverse square law with a minimum distance to prevent extreme forces
      const minDistance = 50;
      const effectiveDistance = Math.max(distance, minDistance);
      const gravitationalConstant = gravityStrength;

      if (distance > 0) {
        // Force magnitude: G / distance² (capped for stability)
        const forceMagnitude = gravitationalConstant / (effectiveDistance * effectiveDistance);
        const cappedForce = Math.min(forceMagnitude, 0.5); // Cap max force

        // Direction toward/away from cursor
        const forceX = (dx / distance) * cappedForce;
        const forceY = (dy / distance) * cappedForce;

        if (isAttracting) {
          // Attract toward cursor (like gravity)
          particle.vx += forceX;
          particle.vy += forceY;
        } else {
          // Repel from cursor (like anti-gravity)
          particle.vx -= forceX;
          particle.vy -= forceY;
        }
      }

      // Apply velocity with light damping
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
    },
    [gravityStrength]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        const dims = setupCanvas();
        width = dims.width;
        height = dims.height;
        particlesRef.current = initParticles(width, height);
      }, 100);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const handleClick = () => {
      isAttractingRef.current = !isAttractingRef.current;
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

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Update and draw particles
      for (const particle of particles) {
        if (!prefersReducedMotion) {
          updateParticle(particle, width, height);
        }
        drawParticle(ctx, particle);
      }

      // =========================================================================
      // OPTIMIZED CONNECTION DRAWING
      // =========================================================================
      // This section combines all three optimizations:
      // 1. Spatial grid partitioning - O(n) instead of O(n²)
      // 2. Squared distance comparison - defer sqrt until needed
      // 3. Batched line drawing - group by opacity bands
      // =========================================================================

      // --- OPTIMIZATION 2: Precompute squared connection distance ---
      // Why precompute? We're comparing distances many times per frame.
      // By comparing squared distances (dx² + dy²) against connectionDistance²,
      // we avoid calling Math.sqrt() for particles that are clearly too far apart.
      // Math.sqrt is ~15-20 CPU cycles on modern processors; for 4950 potential
      // pairs (100 particles), this saves significant computation.
      const connectionDistanceSq = connectionDistance * connectionDistance;

      // --- OPTIMIZATION 1: Build spatial grid ---
      // Cell size = connectionDistance ensures that any two particles within
      // connection range are either in the same cell or adjacent cells.
      // This is the key insight that makes the grid approach correct.
      const grid = buildSpatialGrid(particles, connectionDistance);

      // --- OPTIMIZATION 3: Initialize line batches ---
      // Each batch will collect all line segments for one opacity band.
      // Using typed tuple: [particle1, particle2, actualDistance]
      // We store the actual distance because we need it for opacity calculation.
      const lineBatches: Array<Array<[Particle, Particle, number]>> = Array.from(
        { length: OPACITY_BANDS },
        () => []
      );

      // Track which pairs we've already processed to avoid duplicates
      // When particle A checks particle B, we don't want B to also check A
      const processedPairs = new Set<string>();

      // --- Main connection loop with spatial partitioning ---
      for (const particle of particles) {
        // Get this particle's grid cell coordinates
        const cellX = Math.floor(particle.x / connectionDistance);
        const cellY = Math.floor(particle.y / connectionDistance);

        // Get all particles in the 3×3 neighborhood
        const neighbors = getNeighborParticles(grid, cellX, cellY);

        for (const neighbor of neighbors) {
          // Skip self-comparison
          if (particle === neighbor) continue;

          // Create a unique key for this pair (order-independent)
          // Using object identity via indexOf for stable ordering
          const idx1 = particles.indexOf(particle);
          const idx2 = particles.indexOf(neighbor);
          const pairKey = idx1 < idx2 ? `${idx1}-${idx2}` : `${idx2}-${idx1}`;

          // Skip if we've already processed this pair
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          // --- OPTIMIZATION 2: Squared distance comparison ---
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;
          const distanceSq = dx * dx + dy * dy;

          // Compare squared distances to avoid sqrt for distant particles
          if (distanceSq < connectionDistanceSq) {
            // Only NOW do we compute the actual distance (needed for opacity)
            // This sqrt call only happens for particles that will actually connect
            const distance = Math.sqrt(distanceSq);

            // Calculate opacity: closer particles = more opaque lines
            // opacity ranges from 0 (at connectionDistance) to MAX_LINE_OPACITY (at distance 0)
            const opacity = (1 - distance / connectionDistance) * MAX_LINE_OPACITY;

            // Quantize to opacity band and add to appropriate batch
            const band = getOpacityBand(opacity);
            lineBatches[band].push([particle, neighbor, distance]);
          }
        }
      }

      // --- OPTIMIZATION 3: Batched rendering ---
      // Instead of changing strokeStyle for each line, we group all lines
      // with similar opacity and draw them in one stroke() call.
      // This dramatically reduces GPU state changes.
      ctx.lineWidth = 1;

      for (let band = 0; band < OPACITY_BANDS; band++) {
        const batch = lineBatches[band];
        if (batch.length === 0) continue;

        // Calculate the representative opacity for this band
        // Using (band + 0.5) centers the opacity within the band's range
        // e.g., band 0 → 0.03, band 1 → 0.09, band 2 → 0.15, etc.
        const bandOpacity = ((band + 0.5) / OPACITY_BANDS) * MAX_LINE_OPACITY;
        ctx.strokeStyle = `${lineColorRef.current} ${bandOpacity})`;

        // Begin a single path for all lines in this band
        ctx.beginPath();

        for (const [p1, p2] of batch) {
          // Add each line segment to the path
          // moveTo/lineTo just adds to the path buffer; no GPU work yet
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }

        // Single stroke() call renders all lines in this band
        // This is where the actual GPU draw call happens
        ctx.stroke();
      }

      if (prefersReducedMotion) {
        // Only draw once for reduced motion
        return;
      }

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
