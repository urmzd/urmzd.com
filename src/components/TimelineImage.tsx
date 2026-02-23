'use client';
import { motion } from 'motion/react';

interface TimelineImageProps {
  src: string;
  alt: string;
  caption?: string;
  credit?: { photographer: string; url: string };
}

export default function TimelineImage({ src, alt, caption, credit }: TimelineImageProps) {
  return (
    <motion.figure
      whileHover={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-lg my-4 group cursor-pointer"
      role="img"
      aria-label={caption || alt}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-auto rounded-lg object-cover max-h-64"
      />
      {caption && (
        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 dark:bg-black/80 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {caption}
        </figcaption>
      )}
      {credit?.photographer && (
        <p className="mt-1 text-xs text-muted-foreground">
          Photo by{' '}
          <a href={credit.url} target="_blank" rel="noopener noreferrer" className="underline">
            {credit.photographer}
          </a>{' '}
          on Unsplash
        </p>
      )}
    </motion.figure>
  );
}
