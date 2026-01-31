export const defaultLocale = 'en' as const;
export const locales = ['en'] as const;

export type Locale = (typeof locales)[number];

export const ui = {
  en: {
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'site.description': 'Personal website of urmzd',
    'footer.copyright': '© {year} urmzd. All rights reserved.',
  },
} as const;

export type TranslationKey = keyof (typeof ui)[typeof defaultLocale];

export function useTranslations(lang: Locale = defaultLocale) {
  return function t(key: TranslationKey): string {
    return ui[lang][key];
  };
}

export function getUIStrings(lang: Locale = defaultLocale) {
  return ui[lang];
}
