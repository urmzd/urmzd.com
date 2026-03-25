interface Reference {
  id: number;
  text: string;
  url: string;
}

interface ReferencesProps {
  items: Reference[];
}

export default function References({ items }: ReferencesProps) {
  return (
    <section className="not-prose mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-2xl font-bold">References</h2>
      <ol className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} id={`ref-${item.id}`} className="flex gap-2">
            <a
              href={`#cite-${item.id}`}
              className="shrink-0 text-primary no-underline hover:underline"
              aria-label={`Back to citation ${item.id}`}
            >
              [{item.id}]
            </a>
            <span>
              {item.text}{' '}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary break-all no-underline hover:underline"
              >
                {item.url}
              </a>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
