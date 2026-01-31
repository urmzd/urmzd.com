'use client';

import { socialLinks, type SocialLink } from '@/data/socialLinks';
import { SiArxiv, SiBehance, SiGithub } from '@icons-pack/react-simple-icons';
import { IconBrandLinkedin, IconMail, IconRss } from '@tabler/icons-react';

const iconMap: Record<SocialLink['icon'], React.ReactNode> = {
  github: <SiGithub className="h-5 w-5" />,
  linkedin: <IconBrandLinkedin className="h-5 w-5" />,
  email: <IconMail className="h-5 w-5" />,
  behance: <SiBehance className="h-5 w-5" />,
  arxiv: <SiArxiv className="h-5 w-5" />,
  rss: <IconRss className="h-5 w-5" />,
};

export default function SocialLinksGrid() {
  return (
    <div className="not-prose flex flex-wrap gap-4">
      {socialLinks.map((link) => (
        <a
          key={link.icon}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-100"
        >
          {iconMap[link.icon]}
          <span>{link.title}</span>
        </a>
      ))}
    </div>
  );
}
