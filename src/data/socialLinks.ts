export interface SocialLink {
  title: string;
  href: string;
  icon: 'github' | 'linkedin' | 'x' | 'email' | 'behance' | 'arxiv' | 'npm' | 'cargo' | 'pypi' | 'rss';
}

export const socialLinks: SocialLink[] = [
  { title: 'GitHub', href: 'https://github.com/urmzd', icon: 'github' },
  { title: 'LinkedIn', href: 'https://linkedin.com/in/urmzd', icon: 'linkedin' },
  { title: 'X', href: 'https://x.com/urmzd_', icon: 'x' },
  { title: 'Email', href: 'mailto:hello@urmzd.com', icon: 'email' },
  { title: 'Behance', href: 'https://www.behance.net/urmzd', icon: 'behance' },
  {
    title: 'arXiv',
    href: 'https://arxiv.org/search/cs?searchtype=author&query=Mukhammadnaim,+U',
    icon: 'arxiv',
  },
  { title: 'npm', href: 'https://www.npmjs.com/~urmzd', icon: 'npm' },
  { title: 'crates.io', href: 'https://crates.io/users/urmzd', icon: 'cargo' },
  { title: 'PyPI', href: 'https://pypi.org/user/urmzd/', icon: 'pypi' },
  { title: 'RSS', href: '/rss.xml', icon: 'rss' },
];
