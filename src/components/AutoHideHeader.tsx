'use client';

import { motion } from 'motion/react';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import NavigationMenuDemo from './NavigationMenuDemo';
import { ModeToggle } from './ModeToggle';

export default function AutoHideHeader() {
  const { isVisible } = useScrollDirection();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '-100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div></div>
        <NavigationMenuDemo />
        <ModeToggle />
      </div>
    </motion.header>
  );
}
