---
name: visual-audit
description: Audit visuals (images, icons, demos, embeds) across the site for appropriateness, valid replacements, feel consistency, reference integrity, and credit compliance. Use when adding, replacing, or reviewing images and media, or before publishing pages.
compatibility: Designed for Claude Code (or similar products)
metadata:
  author: urmzd
  version: "1.0"
---

## Audit checklist

### 1. Visual replacement evaluation

For each visual being added or changed, answer:

- **Does the replacement match the original's purpose?** A location photo should still convey that location; a demo screenshot should still demonstrate the feature.
- **Does the aspect ratio / resolution work?** Images in `public/` are served as-is. WebP is preferred for photos. SVGs for charts/icons. PNGs for screenshots with text.
- **Is the file in the correct directory?**
  - Welcome/timeline photos: `public/images/welcome/`
  - Project demos: `public/projects/<slug>/`
  - Logos/branding: `public/images/`
  - Icons: `public/icons/`

### 2. General feel

The site's visual identity is:
- **Minimal and dark-themed** — uses Tailwind CSS v4 with a dark mode default, muted foreground text, subtle borders.
- **Motion-aware** — uses `motion` (Framer Motion) for animations with `useReducedMotion` support. Visuals should not fight the animation layer.
- **Content-forward** — visuals support the text, not the other way around. Large hero images are used sparingly (timeline, project detail pages). Blog posts are text-heavy with optional embeds.
- **WebGL accents** — the landing page uses a Three.js plexus background. Visuals added nearby should not clash with this.

When evaluating feel, check:
- Does the visual feel consistent with the dark, minimal aesthetic?
- Is there too much visual noise on the page?
- Would a simpler alternative (e.g., a terminal demo instead of a screenshot) be more aligned?

### 3. Component usage in blog posts

See [references/components.md](references/components.md) for the full component table and usage patterns.

### 4. Snippet of the Week pattern

See [references/snippet-of-the-week.md](references/snippet-of-the-week.md) for the structure and rules.

### 5. Citation system

See [references/citations.md](references/citations.md) for `Cite` and `References` component usage.

### 6. Story conventions

See [references/stories.md](references/stories.md) for story formatting, writing style, and rendering details.

### 7. References and credits

**Image credits are mandatory for third-party photos.** The system uses `src/data/imageCredits.ts`.

When adding or replacing a credited image:
- Add the credit entry in `src/data/imageCredits.ts`
- Verify the `TimelineImage` component receives the `credit` prop from this map
- Confirm the photographer URL is still valid

**Other reference points to verify:**
- YouTube embeds: confirm the video ID is valid and the video is public
- `PreviewLink` URLs: confirm the href is reachable and the content still exists
- Project demo images/GIFs in `src/data/projects.ts`: confirm files exist in `public/projects/<slug>/`
- Social links in `src/data/socialLinks.ts`: confirm profiles are current
- Behance portfolio links in `src/data/welcomeTimeline.tsx`: confirm galleries are public

### 8. Important notes

- **License:** Content is CC BY-NC-ND 4.0. Any image added must be compatible or be the author's own work.
- **OG images:** Generated dynamically via Satori. Adding new pages may require verifying OG image generation works.
- **Font dependency:** OG image generation uses `public/fonts/Inter-Regular.ttf` and `Inter-Bold.ttf`. Do not remove these.
- **Blog hero images** are optional. Not every post needs one.
- **Stories have no image support** — text-only content.
- **KaTeX support:** Blog posts support LaTeX math via `remark-math` and `rehype-katex`.

## Output format

When running this audit, produce a table:

| Visual | Location | Status | Issue | Action needed |
|--------|----------|--------|-------|---------------|
| ... | ... | ok/warn/error | ... | ... |

Follow with a summary of overall feel assessment and any reference integrity issues.
