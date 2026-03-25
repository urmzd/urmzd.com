// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';

// https://astro.build/config
export default defineConfig({
  site: 'https://urmzd.com',
i18n: {
    locales: ['en'],
    defaultLocale: 'en',
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [react(), mdx(), sitemap()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeSlug],
  },
  vite: {
    plugins: [
      tailwindcss()
    ],
    resolve: {
      dedupe: ['react', 'react-dom']
    },
    optimizeDeps: {
      include: ['motion', 'motion/react']
    },
    ssr: {
      noExternal: ['motion']
    }
  }
});