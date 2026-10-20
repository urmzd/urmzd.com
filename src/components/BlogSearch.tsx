'use client';

import { X } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useMemo, useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  readTime?: string;
  tags?: string[];
  draft?: boolean;
}

interface BlogSearchProps {
  posts: BlogPost[];
}

export default function BlogSearch({ posts }: BlogSearchProps) {
  // Tag links on articles point here as /blog?tag=<tag>.
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('tag');
  });

  const filteredPosts = useMemo(
    () => (activeTag ? posts.filter((p) => p.tags?.includes(activeTag)) : posts),
    [posts, activeTag],
  );

  const clearTag = () => {
    setActiveTag(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('tag');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <MotionConfig reducedMotion="user">
      <search className="blog-search">
        {activeTag && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tagged</span>
            <button
              type="button"
              onClick={clearTag}
              aria-label={`Remove tag filter ${activeTag}`}
              className="glass-pill inline-flex items-center gap-1 rounded-full border-primary bg-primary px-2.5 py-1 text-xs text-primary-foreground"
            >
              #{activeTag}
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        )}

        <div aria-live="polite" aria-atomic="true">
          {activeTag && (
            <p className="blog-search-count">
              {filteredPosts.length === 0
                ? 'No posts found'
                : `Found ${filteredPosts.length} post${filteredPosts.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>

        {filteredPosts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <ul className="space-y-6">
            {filteredPosts.map((post) => (
              <li key={post.id}>
                <a
                  href={`/blog/${post.id}`}
                  className="group block rounded-xl p-6 transition-all glass-card hover:border-primary/40"
                >
                  <h2 className="text-2xl font-semibold group-hover:text-primary">
                    {post.title}
                    {post.draft && (
                      <span className="ml-2 inline-block align-middle rounded-full border border-muted-foreground/30 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Draft
                      </span>
                    )}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-muted-foreground">{post.description}</p>
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
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="glass-pill rounded-full px-2.5 py-0.5 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </search>
    </MotionConfig>
  );
}
