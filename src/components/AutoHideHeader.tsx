'use client';

import { MotionConfig, motion } from 'motion/react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { MobileMenu } from './MobileMenu';
import { ModeToggle } from './ModeToggle';
import NavigationMenuDemo from './NavigationMenuDemo';

export default function AutoHideHeader() {
  const { isVisible } = useScrollDirection();

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        className="fixed top-0 left-0 right-0 z-header border-b border-border/40 bg-background/80 backdrop-blur-md"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <a href="/" className="text-sm font-semibold tracking-tight text-foreground">
            urmzd
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex md:items-center md:gap-2">
            <NavigationMenuDemo />
          </div>

          {/* Desktop theme toggle */}
          <div className="hidden md:block">
            <ModeToggle />
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </motion.header>
    </MotionConfig>
  );
}
