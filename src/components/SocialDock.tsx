'use client';

import { FloatingDock } from '@/components/ui/floating-dock';
import { socialLinks, type SocialLink } from '@/data/socialLinks';
import { SiArxiv, SiBehance, SiGithub } from '@icons-pack/react-simple-icons';
import { IconBrandLinkedin, IconMail } from '@tabler/icons-react';

const iconMap: Record<SocialLink['icon'], React.ReactNode> = {
  github: <SiGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  linkedin: <IconBrandLinkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  email: <IconMail className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  behance: <SiBehance className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  arxiv: <SiArxiv className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
};

const dockItems = socialLinks.map((link) => ({
  title: link.title,
  href: link.href,
  icon: iconMap[link.icon],
}));

export default function SocialDock() {
  return (
    <FloatingDock
      items={dockItems}
      desktopClassName="fixed bottom-16 left-1/2 -translate-x-1/2 z-40"
      mobileClassName="fixed bottom-4 right-4 z-40"
    />
  );
}
