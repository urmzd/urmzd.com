# Story conventions

Stories are **text-only Markdown** (`.md`) in `src/stories/`. They use no React components, no images, and no MDX — only plain Markdown rendered through the `story-prose` CSS class.

## Frontmatter (required)

```yaml
---
title: "Story Title"
description: "One-sentence synopsis"
pubDate: YYYY-MM-DD
tags: ["fiction", "short story", ...]
---
```

Optional: `updatedDate`, `draft`.

## Writing style

- **First-person, present-tense narration** — immediate, visceral, stream-of-consciousness.
- **Short paragraphs** — often a single sentence or even a single word. White space is part of the pacing.
- **Dialogue is inline**, separated by blank lines. Uses `"..."` quotes with speaker attribution after.
- **`_italics_` for internal thought** and emphasis. `*italics*` for meta-text like `*To be continued...*`.
- **`--` for em-dashes** (double hyphen, not `—`) — used for interruption and hesitation.
- **`<br/>` for forced line breaks** within a paragraph.
- **`---` for scene breaks** — rendered as decorative `— ✧ —` ornaments.
- **No headings** within content — narrative is continuous, divided only by `---` scene breaks.
- **No code blocks, no math, no embeds** — pure prose.
- **Continuation marker:** Multi-part stories end with `*To be continued...*`.

## Rendering details

- Stories render in `story-prose` class: `font-size: 1.2rem`, `line-height: 2`, `letter-spacing: 0.01em`.
- `<hr>` elements render as centered `— ✧ —` ornaments with `3rem` vertical margin.
- A decorative "End" footer with diamond ornament is auto-appended by `[slug].astro`.
- Max width is `max-w-2xl`.

## Tone and feel

- Emotionally raw, fragmented, and urgent.
- Pacing is controlled by paragraph length and white space.
- Pain, confusion, and memory loss are conveyed through abrupt cuts, incomplete thoughts, and repeated `---` blackouts.
- Dialogue is sparse and loaded — characters say little but imply much.
