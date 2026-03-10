import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    shareText: z.string().optional(),
  }),
});

const standards = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/standards' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    domain: z.enum(['software']).default('software'),
    category: z.enum(['ai', 'development', 'cli', 'visual']),
    order: z.number().default(0),
  }),
});

export const collections = { blog, standards };
