'use client';

import { cn } from '@/lib/utils';

export type ProjectStatus = 'active' | 'archived';

const statusConfig: Record<ProjectStatus, { label: string; dotClass: string }> = {
  active: { label: 'Active', dotClass: 'status-dot-active' },
  archived: { label: 'Archived', dotClass: 'status-dot-archived' },
};

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, dotClass } = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground glass-pill',
        className,
      )}
    >
      <span className={cn('status-dot', dotClass)} />
      {label}
    </span>
  );
}
