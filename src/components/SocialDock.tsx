'use client';

import { SiArxiv, SiBehance, SiGithub, SiX } from '@icons-pack/react-simple-icons';
import { IconBrandLinkedin, IconMail, IconRss } from '@tabler/icons-react';
import { MotionConfig } from 'motion/react';
import { FloatingDock } from '@/components/ui/floating-dock';
import { type SocialLink, socialLinks } from '@/data/socialLinks';

const iconMap: Record<SocialLink['icon'], React.ReactNode> = {
  github: <SiGithub className="h-full w-full text-muted-foreground" />,
  linkedin: <IconBrandLinkedin className="h-full w-full text-muted-foreground" />,
  x: <SiX className="h-full w-full text-muted-foreground" />,
  email: <IconMail className="h-full w-full text-muted-foreground" />,
  behance: <SiBehance className="h-full w-full text-muted-foreground" />,
  arxiv: <SiArxiv className="h-full w-full text-muted-foreground" />,
  rss: <IconRss className="h-full w-full text-muted-foreground" />,
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
    <MotionConfig reducedMotion="user">
      <FloatingDock
        items={dockItems}
        desktopClassName={
          desktopClassName ?? 'fixed bottom-16 left-1/2 -translate-x-1/2 z-floating-dock'
        }
        mobileClassName={
          mobileClassName ?? 'fixed bottom-4 left-1/2 -translate-x-1/2 z-floating-dock'
        }
      />
    </MotionConfig>
  );
}
