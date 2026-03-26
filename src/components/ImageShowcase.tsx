interface ShowcaseImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageShowcaseProps {
  images: ShowcaseImage[];
}

export default function ImageShowcase({ images }: ImageShowcaseProps) {
  return (
    <section className="py-12">
      <h2 className="mb-8 text-2xl font-bold">Demo</h2>
      <div className="flex flex-col gap-6">
        {images.map((img) => (
          <div key={img.src} className="overflow-hidden rounded-xl bg-[var(--terminal-bg)] p-4">
            <img src={img.src} alt={img.alt} loading="lazy" className="w-full rounded-lg" />
            {img.caption && (
              <p className="mt-2 text-center text-xs text-muted-foreground">{img.caption}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
