'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface ShowcaseImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageShowcaseProps {
  images: ShowcaseImage[];
}

export default function ImageShowcase({ images }: ImageShowcaseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const isSingle = images.length === 1;

  return (
    <section ref={ref} className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">Demo</h2>
      <div className={isSingle ? '' : 'grid gap-4 sm:grid-cols-2'}>
        {images.map((img, i) => (
          <motion.div
            key={img.src}
            className="overflow-hidden rounded-xl bg-[var(--terminal-bg)] p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <img src={img.src} alt={img.alt} loading="lazy" className="w-full rounded-lg" />
            {img.caption && (
              <p className="mt-2 text-center text-xs text-muted-foreground">{img.caption}</p>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
