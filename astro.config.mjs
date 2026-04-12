// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkCallouts from './src/lib/remark-callouts';
import remarkEmbeds from './src/lib/remark-embeds';
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
    remarkPlugins: [remarkGfm, remarkCallouts, remarkEmbeds, remarkMath],
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