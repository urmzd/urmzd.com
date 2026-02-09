interface BlockQuoteProps {
  children: React.ReactNode;
  author: string;
  source?: string;
}

export default function BlockQuote({ children, author, source }: BlockQuoteProps) {
  return (
    <figure className="not-prose my-8">
      <span
        className="select-none text-5xl leading-none text-muted-foreground/20"
        aria-hidden="true"
      >
        &ldquo;
      </span>
      <blockquote className="-mt-6 pl-4 text-lg italic text-foreground/85">{children}</blockquote>
      <figcaption className="mt-3 pl-4 text-sm text-muted-foreground">
        &mdash;&nbsp;{author}
        {source && <cite className="not-italic">, {source}</cite>}
      </figcaption>
    </figure>
  );
}
