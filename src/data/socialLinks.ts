export interface SocialLink {
  title: string;
  href: string;
  icon: 'github' | 'linkedin' | 'email' | 'behance' | 'arxiv' | 'rss';
}

export const socialLinks: SocialLink[] = [
  { title: 'GitHub', href: 'https://github.com/urmzd', icon: 'github' },
  { title: 'LinkedIn', href: 'https://linkedin.com/in/urmzd', icon: 'linkedin' },
  { title: 'Email', href: 'mailto:hello@urmzd.com', icon: 'email' },
  { title: 'Behance', href: 'https://www.behance.net/urmzd', icon: 'behance' },
  {
    title: 'arXiv',
    href: 'https://arxiv.org/search/cs?searchtype=author&query=Mukhammadnaim,+U',
    icon: 'arxiv',
  },
  { title: 'RSS', href: '/rss.xml', icon: 'rss' },
];
