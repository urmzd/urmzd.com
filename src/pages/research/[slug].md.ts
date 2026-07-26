import { type CollectionEntry, getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { projectToMarkdown } from '@/lib/llmsContent';

export async function getStaticPaths() {
  const entries = await getCollection('projects', ({ data }) => data.kind === 'research');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export async function GET({ props }: APIContext) {
  const { entry } = props as { entry: CollectionEntry<'projects'> };

  return new Response(projectToMarkdown(entry), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
