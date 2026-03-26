---
name: blog-repost
description: >
  Convert a blog post into platform-optimized long-form articles for Twitter/X
  and LinkedIn, written to reposts/twitter/ and reposts/linkedin/. Use when the
  user mentions "repost", "twitter article", "X article", "linkedin article",
  "linkedin newsletter", or wants to republish blog content as articles on
  social platforms.
metadata:
  author: urmzd
  version: "1.0"
---

## When to Use

User wants to turn a blog post into long-form articles for Twitter/X and LinkedIn. Distinct from `blog-to-tweet` (short-form threads).

## Instructions

1. **Identify the blog post.** If specified, read it. If not, list posts in `src/blog/` and ask.
2. **Read the full post** — understand the argument, structure, and key takeaways.
3. **Research data citations.** If the post references statistics, check whether more recent data is available via the cited source URLs. Use the latest numbers — reposts should not be stale on publish day.
4. **Write one canonical article body** following the rules below.
5. **Format for each platform** by reading `references/TWITTER.md` and `references/LINKEDIN.md` and applying the platform-specific adaptations.
6. **Write both files** (create directories if needed):
   - `reposts/twitter/{slug}.md`
   - `reposts/linkedin/{slug}.md`

   The slug matches the blog post filename without extension.

## Canonical Body Rules

The core argument is written once and adapted per platform. This keeps messaging consistent.

- **Length:** 500-1200 words. Platform formatting may trim slightly.
- **Tone:** Match the blog's voice — direct, opinionated, conversational. Not watered down.
- **Self-contained:** The full argument lands without clicking through. The link back is for the richer experience (visuals, interactive components, citations).
- **Strip all MDX/components:** No `<Aside>`, `<BlockQuote>`, `<ExploreCard>`, `<Cite>`, `<References>`, etc. Translate content into plain prose where valuable.
- **No emojis** unless the blog post itself uses them.
- **Preserve key quotes and sharp lines** — these are the most shareable parts.
- **Simplify citations:** No footnotes. Inline the source name where important (e.g., "according to the Economic Policy Institute"), drop the rest.
- **Section breaks** to maintain pacing.

## Data and Links

When the blog references an external data source with a visualization (chart, tracker, dashboard): **lead with the stat, then provide access to the source.** Each platform handles link presentation differently — see the reference files.

## Gotchas

- The blog uses `<Cite id={N} />` and `<References items={[...]} />` for citations. Parse the References block to extract source names and URLs, then inline them naturally.
- Blog frontmatter includes `shareText` — use it as inspiration for the subtitle, not verbatim.
- Always check the `pubDate` — if the post references time-sensitive data, verify the numbers are current.
- Drop the "Snippet of the Week" section if present — it's blog-specific and doesn't translate.
