interface CiteProps {
  id: number;
}

export default function Cite({ id }: CiteProps) {
  return (
    <sup>
      <a
        id={`cite-${id}`}
        href={`#ref-${id}`}
        className="text-primary no-underline hover:underline"
        aria-label={`Citation ${id}`}
      >
        [{id}]
      </a>
    </sup>
  );
}
