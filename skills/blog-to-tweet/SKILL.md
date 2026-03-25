---
name: blog-to-tweet
description: Convert a blog post into a Twitter/X thread (3-8 tweets) ready to copy and post. Use when the user wants to promote a blog post on Twitter/X, or mentions "tweet", "thread", or "X post" in relation to a blog post.
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: urmzd
  version: "1.0"
---

## Instructions

1. **Identify the blog post.** If the user specifies a post, read it. If not, list available posts in `src/blog/` and ask which one.

2. **Read the full post** to understand the argument, key points, and narrative arc.

3. **Check for `shareText` in frontmatter.** Use it as inspiration for the hook tweet, but don't copy it verbatim — adapt it for the thread format.

4. **Generate a thread** following the structure below.

## Thread format

- **Tweet 1 (Hook):** A bold, attention-grabbing statement or question that captures the post's core thesis. No hashtags. Under 280 characters.
- **Tweets 2-N (Key points):** Each tweet covers one idea from the post. Keep them punchy — one concept per tweet. Use plain language, not blog prose. Each under 280 characters.
- **Final tweet (CTA):** Link to the full post with a brief reason to read it. Format: `Read the full piece: [URL]` where URL is `https://urmzd.com/blog/<slug>`. The slug is the filename without extension.

## Rules

- **Thread length:** 3-8 tweets. Shorter posts get 3-4, longer ones 5-8.
- **Tone:** Direct, conversational, slightly provocative. Match the blog's voice — not generic marketing speak.
- **No emojis** unless the blog post itself uses them.
- **No hashtags** except optionally 1-2 on the final tweet.
- **Each tweet must stand alone** — someone reading just that tweet should get value from it.
- **Strip all MDX/component references** — no `<Aside>`, `<BlockQuote>`, etc.
- **Preserve the argument structure** — the thread should follow the same logical progression as the post.
- **Quote-worthy lines from the post** can be used verbatim if they're under 280 chars and hit hard.

## Output format

Output the thread as a numbered list, with a blank line between tweets and a character count after each:

```
1/ Hook tweet here
(142 chars)

2/ Second tweet here
(201 chars)

3/ Read the full piece: https://urmzd.com/blog/slug
(87 chars)
```

The output should be ready to copy-paste directly into Twitter/X.
