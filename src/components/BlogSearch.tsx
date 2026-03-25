'use client';

import { MotionConfig } from 'motion/react';
import { useMemo, useState } from 'react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { fuzzySearch } from '@/lib/search';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  readTime?: string;
  tags?: string[];
}

interface BlogSearchProps {
  posts: BlogPost[];
}

const SEARCH_PLACEHOLDERS = [
  'Search blog posts...',
  "Try 'machine learning'...",
  'What are you looking for?',
  'Type to search...',
];

export default function BlogSearch({ posts }: BlogSearchProps) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('tag');
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeTag) {
      result = result.filter((p) => p.tags?.includes(activeTag));
    }
    if (query) {
      result = fuzzySearch(query, result, (post) => [post.title, post.description], 0.5);
    }
    return result;
  }, [query, posts, activeTag]);

  const handleTagClick = (tag: string) => {
    const next = activeTag === tag ? null : tag;
    setActiveTag(next);
    const url = new URL(window.location.href);
    if (next) {
      url.searchParams.set('tag', next);
    } else {
      url.searchParams.delete('tag');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is already reactive via the query state
  };

  return (
    <MotionConfig reducedMotion="user">
      <search className="blog-search">
        <div className="blog-search-input">
          <PlaceholdersAndVanishInput
            placeholders={SEARCH_PLACEHOLDERS}
            onChange={handleChange}
            onSubmit={handleSubmit}
            ariaLabel="Search blog posts"
          />
        </div>

        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeTag === tag
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {(query || activeTag) && (
            <p className="blog-search-count">
              {filteredPosts.length === 0
                ? 'No posts found'
                : `Found ${filteredPosts.length} post${filteredPosts.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>

        {filteredPosts.length === 0 && !query ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <ul className="space-y-6">
            {filteredPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={`/blog/${post.id}`}
                  className="group block rounded-lg border border-border p-6 transition-colors hover:border-primary"
                >
                  <h2 className="text-2xl font-semibold group-hover:text-primary">{post.title}</h2>
                  <p className="mt-2 text-muted-foreground">{post.description}</p>
                  <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
                    <time>
                      {new Date(post.pubDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </time>
                    {post.readTime && (
                      <>
                        <span className="hidden sm:inline">|</span>
                        <span>{post.readTime}</span>
                      </>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </search>
    </MotionConfig>
  );
}
