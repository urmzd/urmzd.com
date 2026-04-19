import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { githubLoader } from './lib/github-loader';
import { skillsLoader } from './lib/skills-loader';

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

const stories = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/stories' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
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

const skills = defineCollection({
  loader: skillsLoader(),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    type: z.enum(['skill', 'agent']),
    sourceRepo: z.string(),
    sourcePath: z.string(),
    rawPath: z.string(),
  }),
});

export const collections = { blog, stories, projects, skills };
