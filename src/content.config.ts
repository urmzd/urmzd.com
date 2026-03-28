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

const research = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/research' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    category: z.enum(['paper']).default('paper'),
    year: z.number(),
    venue: z.string().optional(),
    tags: z.array(z.string()).default([]),
    githubUrl: z.string(),
    paperUrl: z.string().optional(),
    tech: z.array(z.string()).default([]),
    detailTech: z.array(z.object({ name: z.string(), icon: z.string() })).optional(),
    features: z
      .array(z.object({ title: z.string(), description: z.string(), icon: z.string() }))
      .optional(),
    demo: z
      .discriminatedUnion('kind', [
        z.object({
          kind: z.literal('terminal'),
          castFile: z.string(),
        }),
        z.object({
          kind: z.literal('image'),
          images: z.array(z.object({ src: z.string(), alt: z.string(), caption: z.string() })),
        }),
      ])
      .optional(),
  }),
});

const skills = defineCollection({
  loader: glob({ pattern: ['**/*.md'], base: './src/skills' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
  }),
});

export const collections = { blog, stories, research, skills };
