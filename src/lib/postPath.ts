import type { CollectionEntry } from 'astro:content';

/**
 * URL segment for a post. Drafts with a `codename` (e.g. "evals") are served at
 * /blog/<codename>: short to type, and the title slug stays private until publish.
 */
export function postPath(post: CollectionEntry<'blog'>): string {
  return post.data.draft && post.data.codename ? post.data.codename : post.id;
}
