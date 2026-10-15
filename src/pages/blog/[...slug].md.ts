import { type CollectionEntry, getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { mdxToMarkdown } from '@/lib/mdxToMarkdown';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

export async function GET({ props }: APIContext) {
  const { post } = props as { post: CollectionEntry<'blog'> };
  const markdown = mdxToMarkdown(post.body ?? '', {
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate.toISOString().split('T')[0],
    updatedDate: post.data.updatedDate?.toISOString().split('T')[0],
    heroImage: post.data.heroImage,
    tags: post.data.tags,
  });

  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
