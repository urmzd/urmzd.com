interface ImageCredit {
  photographer: string;
  url: string;
}

export const imageCredits: Record<string, ImageCredit> = {
  '/images/welcome/020_tajikistan.webp': {
    photographer: 'Olga Kovalski',
    url: 'https://unsplash.com/@kovalskihelga',
  },
  '/images/welcome/021_halifax.webp': {
    photographer: 'Chen Liu',
    url: 'https://unsplash.com/@liu675352566',
  },
  '/images/welcome/022_austin.webp': {
    photographer: 'Justin Wallace',
    url: 'https://unsplash.com/@justinwallacephotography',
  },
  '/images/welcome/023_toronto.webp': {
    photographer: 'Zia Syed',
    url: 'https://unsplash.com/@syedzia123',
  },
  '/images/welcome/014_mountain.webp': {
    photographer: 'Zach Gilseth',
    url: 'https://unsplash.com/@zachary_gilseth',
  },
};
