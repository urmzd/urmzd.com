'use client';

import { useState, useMemo } from 'react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { fuzzySearch } from '@/lib/search';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  readTime?: string;
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

  const filteredPosts = useMemo(() => {
    return fuzzySearch(query, posts, (post) => [post.title, post.description], 0.5);
  }, [query, posts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Search is already reactive via the query state
  };

  return (
    <div className="blog-search">
      <div className="blog-search-input">
        <PlaceholdersAndVanishInput
          placeholders={SEARCH_PLACEHOLDERS}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>

      {query && (
        <p className="blog-search-count">
          {filteredPosts.length === 0
            ? 'No posts found'
            : `Found ${filteredPosts.length} post${filteredPosts.length === 1 ? '' : 's'}`}
        </p>
      )}

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
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
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
                      <span>|</span>
                      <span>{post.readTime}</span>
                    </>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
