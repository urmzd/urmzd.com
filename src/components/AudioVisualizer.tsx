'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  dataArrayRef: React.RefObject<Uint8Array | null>;
  muted: boolean;
  className?: string;
}

const BAR_COUNT = 32;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 24;
const MIN_HEIGHT = 2;

export default function AudioVisualizer({
  analyserRef,
  dataArrayRef,
  muted,
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT).fill(0));
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const totalWidth = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = MAX_HEIGHT * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${MAX_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    if (prefersReducedMotion) {
      // Static bars at idle height
      ctx.clearRect(0, 0, totalWidth, MAX_HEIGHT);
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (BAR_WIDTH + BAR_GAP);
        // Mirror: low frequencies at center, highs at edges
        const centerDist = Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
        const opacity = 0.3 - centerDist * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(x, MAX_HEIGHT - MIN_HEIGHT, BAR_WIDTH, MIN_HEIGHT);
      }
      return;
    }

    const smoothed = smoothedRef.current;

    const draw = () => {
      ctx.clearRect(0, 0, totalWidth, MAX_HEIGHT);

      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      const hasData = analyser && dataArray && !muted;

      if (hasData) {
        analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        // Mirror mapping: center = low freq, edges = high freq
        const half = BAR_COUNT / 2;
        const mirrorIndex = i < half ? half - 1 - i : i - half;
        // Map mirrorIndex (0..half-1) to frequency bin range
        const binCount = dataArray ? dataArray.length : 128;
        const binIndex = Math.floor((mirrorIndex / half) * binCount * 0.7);

        let target = MIN_HEIGHT;
        if (hasData && dataArray) {
          const value = dataArray[binIndex] / 255;
          target = MIN_HEIGHT + value * (MAX_HEIGHT - MIN_HEIGHT);
        }

        // Fast attack, slow decay
        if (target > smoothed[i]) {
          smoothed[i] += (target - smoothed[i]) * 0.4;
        } else {
          smoothed[i] += (target - smoothed[i]) * 0.08;
        }

        const h = Math.max(MIN_HEIGHT, smoothed[i]);
        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = MAX_HEIGHT - h;

        // Dynamic opacity: taller bars are brighter
        const intensity = (h - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT);
        const opacity = 0.2 + intensity * 0.6;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        // Rounded top via small arc
        const radius = Math.min(BAR_WIDTH / 2, 1.5);
        ctx.beginPath();
        ctx.moveTo(x, y + radius);
        ctx.arcTo(x, y, x + BAR_WIDTH, y, radius);
        ctx.arcTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + h, radius);
        ctx.lineTo(x + BAR_WIDTH, MAX_HEIGHT);
        ctx.lineTo(x, MAX_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyserRef, dataArrayRef, muted]);

  return <canvas ref={canvasRef} className={className} />;
}
