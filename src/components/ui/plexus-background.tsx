'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
}

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

  const [isDarkMode, setIsDarkMode] = useState(true);

  // Detect theme and listen for changes
  useEffect(() => {
    const checkDarkMode = () => {
      return document.documentElement.classList.contains('dark');
    };

    setIsDarkMode(checkDarkMode());

    const observer = new MutationObserver(() => {
      setIsDarkMode(checkDarkMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Compute colors based on theme
  const particleColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const lineColor = isDarkMode ? 'rgba(255, 255, 255,' : 'rgba(0, 0, 0,';

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
      ctx.fillStyle = particleColor;
      ctx.fill();
    },
    [particleColor]
  );

  const drawLine = useCallback(
    (ctx: CanvasRenderingContext2D, p1: Particle, p2: Particle, distance: number) => {
      const opacity = 1 - distance / connectionDistance;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `${lineColor} ${opacity * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    [connectionDistance, lineColor]
  );

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

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            drawLine(ctx, particles[i], particles[j], distance);
          }
        }
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
  }, [initParticles, drawParticle, drawLine, updateParticle, connectionDistance]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ touchAction: 'none' }}
    />
  );
}
