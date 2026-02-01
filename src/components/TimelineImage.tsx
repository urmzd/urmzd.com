'use client';
import { motion } from 'motion/react';

interface TimelineImageProps {
  src: string;
  alt: string;
  caption?: string;
}

export default function TimelineImage({ src, alt, caption }: TimelineImageProps) {
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
    </motion.figure>
  );
}
