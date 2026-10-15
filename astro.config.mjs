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
import remarkMermaid from './src/lib/remark-mermaid';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import fs from 'node:fs';
import path from 'node:path';

// Draft posts are built so they can be shared by direct link, but must not be
// discoverable. Content collections aren't available here, so read frontmatter.
const draftBlogPaths = new Set(
  fs
    .readdirSync('./src/blog')
    .filter((f) => /\.mdx?$/.test(f))
    .filter((f) => {
      const frontmatter = fs.readFileSync(path.join('./src/blog', f), 'utf8').split(/^---$/m)[1] ?? '';
      return /^draft:\s*true\s*$/m.test(frontmatter);
    })
    .map((f) => `/blog/${f.replace(/\.mdx?$/, '')}/`),
);

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
  integrations: [
    react(),
    mdx(),
    sitemap({ filter: (page) => !draftBlogPaths.has(new URL(page).pathname) }),
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkCallouts, remarkEmbeds, remarkMermaid, remarkMath],
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