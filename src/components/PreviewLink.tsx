'use client';

import { LinkPreview } from '@/components/ui/link-preview';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface PreviewLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}

export default function PreviewLink({
  href,
  children,
  className,
  width = 200,
  height = 125,
}: PreviewLinkProps) {
  return (
    <LinkPreview
      url={href}
      className={cn('font-medium underline underline-offset-4', className)}
      width={width}
      height={height}
      triggerAsChild
    >
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        <ArrowUpRight className="inline-block ml-0.5 h-4 w-4" />
      </a>
    </LinkPreview>
  );
}
