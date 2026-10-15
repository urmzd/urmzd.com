import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { githubLoader } from './lib/github-loader';

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

const projects = defineCollection({
  loader: githubLoader(),
  schema: z.object({
    kind: z.enum(['project', 'research']),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['active', 'archived']),
    githubUrl: z.string().url(),
    homepageUrl: z.string().url().optional(),
    language: z.string().optional(),
    stars: z.number().default(0),
    pushedAt: z.coerce.date(),
    year: z.coerce.number().optional(),
    venue: z.string().optional(),
    paperUrl: z.string().url().optional(),
  }),
});

export const collections = { blog, projects };
