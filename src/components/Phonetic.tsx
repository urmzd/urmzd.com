'use client';

import { cn } from '@/lib/utils';

interface PhoneticProps {
  ipa: string;
  className?: string;
}

export default function Phonetic({ ipa, className }: PhoneticProps) {
  return (
    <span className={cn('font-mono text-muted-foreground/70 tracking-wide', className)}>
      /{ipa}/
    </span>
  );
}
