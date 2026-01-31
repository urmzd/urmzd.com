'use client';

import { useState } from 'react';
import { HoveredLink, Menu, MenuItem } from '@/components/ui/navbar-menu';
import { cn } from '@/lib/utils';

export default function NavbarMenuEnhanced({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className={cn('relative z-50', className)}>
      <Menu setActive={setActive}>
        <HoveredLink href="/">Home</HoveredLink>
        <MenuItem setActive={setActive} active={active} item="Blog">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/blog">All Posts</HoveredLink>
          </div>
        </MenuItem>
        <MenuItem setActive={setActive} active={active} item="Projects">
          <div className="flex flex-col space-y-4 text-sm">
            <HoveredLink href="/projects">View All</HoveredLink>
            <HoveredLink href="https://github.com/urmzd">GitHub</HoveredLink>
          </div>
        </MenuItem>
        <HoveredLink href="/about">About</HoveredLink>
      </Menu>
    </div>
  );
}
