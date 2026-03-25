---
name: blog-to-twitter-article
description: Convert a blog post into a standalone Twitter/X article (long-form post) ready to copy and publish, with a link back to the original. Use when the user mentions "twitter article", "X article", or wants to repost blog content as a long-form article.
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: urmzd
  version: "1.0"
---

## Instructions

1. **Identify the blog post.** If the user specifies a post, read it. If not, list available posts in `src/blog/` and ask which one.

2. **Read the full post** to understand the argument, structure, and key takeaways.

3. **Generate the article** following the structure below.

## Article format

Twitter/X Articles support basic formatting: bold, italic, headings, and links. No images, no code blocks, no embeds.

**Structure:**

- **Title:** Reuse or rephrase the blog post title. Keep it punchy.
- **Subtitle (optional):** One line that frames the argument. Can draw from the blog's `description` or `shareText` frontmatter.
- **Body:** A condensed version of the blog post (aim for 40-60% of the original length). This is NOT a summary — it should read as a complete, self-contained article. Restructure and rewrite as needed to flow without the MDX components, visuals, and interactive elements.
- **Closing CTA:** End with a line linking to the full post: `Read the full version with interactive visuals at https://urmzd.com/blog/<slug>`

## Rules

- **Length:** 500-1500 words. Twitter Articles have no hard limit, but this range hits the sweet spot for engagement.
- **Tone:** Match the blog's voice — direct, opinionated, conversational. Not watered down.
- **Self-contained:** A reader should get the full argument without clicking through. The link back is for people who want the richer experience (visuals, code snippets, interactive components).
- **Strip all MDX/components:** No `<Aside>`, `<BlockQuote>`, `<ExploreCard>`, etc. Translate their content into plain prose where valuable. Drop the "Snippet of the Week" section — it's a blog-specific convention that doesn't translate.
- **No emojis** unless the blog post itself uses them.
- **Preserve key quotes and sharp lines** from the original — these are the most shareable parts.
- **Simplify or drop citations:** Twitter Articles don't support footnotes. Inline the source name where important (e.g., "according to the Bureau of Labor Statistics"), drop the rest.
- **Use section breaks** (blank lines or `---`) to maintain the post's pacing and structure.

## Output format

Output the article as plain text with minimal formatting, ready to paste into the Twitter/X article editor:

```
# Title

Subtitle if applicable

Body text here. Multiple paragraphs separated by blank lines.

Section breaks where appropriate.

---

Read the full version with interactive visuals at https://urmzd.com/blog/slug
```
