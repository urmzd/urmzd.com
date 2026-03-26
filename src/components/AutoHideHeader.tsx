'use client';

import { Search } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import LogoMark from './LogoMark';
import { MobileMenu } from './MobileMenu';
import { ModeToggle } from './ModeToggle';
import NavigationMenuDemo from './NavigationMenuDemo';

export default function AutoHideHeader() {
  const { isVisible } = useScrollDirection();

  const openPalette = () => {
    document.dispatchEvent(new CustomEvent('open-command-palette'));
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        className="fixed top-0 left-0 right-0 z-header border-b border-border/40 bg-background/80 backdrop-blur-md"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <a href="/" className="text-foreground" aria-label="Home">
            <LogoMark className="h-7 w-7" />
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <NavigationMenuDemo />
          </div>

          <div className="hidden md:flex md:items-center md:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={openPalette}
              aria-label="Open command palette (⌘K)"
            >
              <Search />
              <span className="sr-only">Search</span>
            </Button>
            <ModeToggle />
          </div>

          {/* Mobile hamburger + theme toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <MobileMenu />
          </div>
        </div>
      </motion.header>
    </MotionConfig>
  );
}
