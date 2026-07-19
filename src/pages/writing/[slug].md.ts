import { type CollectionEntry, getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { mdxToMarkdown } from '@/lib/mdxToMarkdown';

export async function getStaticPaths() {
  const stories = await getCollection('stories', ({ data }) => data.draft !== true);
  return stories.map((story) => ({ params: { slug: story.id }, props: { story } }));
}

export async function GET({ props }: APIContext) {
  const { story } = props as { story: CollectionEntry<'stories'> };
  const markdown = mdxToMarkdown(story.body ?? '', {
    title: story.data.title,
    description: story.data.description,
    pubDate: story.data.pubDate.toISOString().split('T')[0],
    updatedDate: story.data.updatedDate?.toISOString().split('T')[0],
    tags: story.data.tags,
  });

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
