import { IconInfoCircle } from '@tabler/icons-react';

interface AsideProps {
  children: React.ReactNode;
  label?: string;
}

export default function Aside({ children, label = 'Side Note' }: AsideProps) {
  return (
    <aside className="not-prose my-6 rounded-r-lg border-l-2 border-muted-foreground/25 bg-muted/50 px-4 py-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <IconInfoCircle size={14} />
        {label}
      </p>
      <div className="space-y-3 text-sm text-foreground/80">{children}</div>
    </aside>
  );
}
