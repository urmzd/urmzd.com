interface PullQuoteProps {
  children: React.ReactNode;
}

export default function PullQuote({ children }: PullQuoteProps) {
  return (
    <div className="not-prose my-10 border-y border-border py-6 text-center" role="presentation">
      <p className="mx-auto max-w-lg text-xl font-semibold md:text-2xl">{children}</p>
    </div>
  );
}
