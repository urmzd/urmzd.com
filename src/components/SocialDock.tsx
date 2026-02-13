'use client';

import { FloatingDock } from '@/components/ui/floating-dock';
import { socialLinks, type SocialLink } from '@/data/socialLinks';
import { SiArxiv, SiBehance, SiGithub, SiX } from '@icons-pack/react-simple-icons';
import { IconBrandLinkedin, IconMail, IconRss } from '@tabler/icons-react';

const iconMap: Record<SocialLink['icon'], React.ReactNode> = {
  github: <SiGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  linkedin: <IconBrandLinkedin className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  x: <SiX className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  email: <IconMail className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  behance: <SiBehance className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  arxiv: <SiArxiv className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
  rss: <IconRss className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
};

const dockItems = socialLinks.map((link) => ({
  title: link.title,
  href: link.href,
  icon: iconMap[link.icon],
}));

export default function SocialDock({
  desktopClassName,
  mobileClassName,
}: {
  desktopClassName?: string;
  mobileClassName?: string;
} = {}) {
  return (
    <FloatingDock
      items={dockItems}
      desktopClassName={desktopClassName ?? 'fixed bottom-16 left-1/2 -translate-x-1/2 z-40'}
      mobileClassName={mobileClassName ?? 'fixed bottom-4 left-1/2 -translate-x-1/2 z-40'}
    />
  );
}
