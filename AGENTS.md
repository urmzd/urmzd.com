# AGENTS.md

Instructions for AI agents working on this repository.

## Project overview

Personal website and blog at [urmzd.com](https://urmzd.com). Built with Astro, React islands, Tailwind CSS v4, and Three.js. Content is authored in MDX (blog) and Markdown (stories).

## Architecture

```
src/
  pages/          # Astro routes (index, blog, stories, projects, research, about, rss, og)
  components/     # React (.tsx) and Astro (.astro) components
  layouts/        # BaseLayout.astro — single layout wrapping all pages
  blog/           # MDX blog posts (schema: title, description, pubDate, tags, draft, heroImage)
  stories/        # Markdown stories (schema: title, description, pubDate, tags, draft)
  data/           # Static data: projects.ts, socialLinks.ts, imageCredits.ts, research.ts, welcomeTimeline.tsx, scriptMappings.ts
  hooks/          # React hooks (useScrollDirection, useReducedMotion, useSimulatedPulse, useTextScramble)
  lib/            # Utilities (i18n, readTime, search, utils, mdxToMarkdown, enhanceCodeBlocks)
  styles/         # global.css (Tailwind v4)
  content.config.ts  # Astro content collection schemas for blog and stories
public/
  images/         # Static images (welcome timeline, logos)
  projects/       # Project demo assets organized by slug
  fonts/          # Inter fonts for OG image generation
  icons/          # PWA icons
```

## Key conventions

- **Styling:** Tailwind CSS v4 with dark mode default. Use `cn()` from `src/lib/utils.ts` for class merging.
- **Components:** React components use `.tsx`. Astro components use `.astro`. React islands are hydrated via `client:load` or `client:visible`.
- **Content:** Blog posts go in `src/blog/` as `.mdx`. Stories go in `src/stories/` as `.md`. Both must include valid frontmatter matching their schema in `content.config.ts`.
- **Images:** Place in `public/` under the appropriate subdirectory. Third-party photos require a credit entry in `src/data/imageCredits.ts`.
- **Glassmorphism:** All cards, pills, badges, and interactive surfaces use the glassmorphism utility classes defined in `src/styles/global.css`. Use `glass-card` for card containers, `glass-pill` for small badges/tags/pills, `glass-input` for form inputs, and `glass-panel` for larger panels. Never use plain `border border-border` for pill/badge elements — always use the corresponding glass class. The `project-card` and `tech-badge` CSS classes already compose these (e.g., `project-card` includes `glass-card`, `tech-badge` includes `glass-pill`).
- **Index page structure:** All collection listing pages (research, projects, stories) follow the same layout: `<h1 class="mb-2 text-4xl font-bold">` followed by a `<p class="mb-10 text-muted-foreground">` subtitle explaining the page's purpose, then the card grid. The subtitle should be a single concise sentence describing what the reader will find.
- **Card content integrity:** All card content — including tags, metadata, and secondary links — must be inside the card container (the `<a>` or wrapping element with `glass-card` / `project-card`). Never render card-related content as a sibling outside the card. Use `event.stopPropagation()` on nested interactive elements (e.g., tag links) to prevent them from triggering the parent card's navigation.
- **No content-visibility on cards:** Do not use `content-visibility: auto` or `contain-intrinsic-size` on card elements. These cause layout instability when actual content height differs from the estimated intrinsic size.
- **Linting:** Biome handles lint and format. Run `npm run lint` and `npm run format:check` before committing.
- **Pre-commit:** Husky + lint-staged runs Biome on staged files.

## Available components

### Content components (for use in MDX blog posts)

Import individually or via barrel export from `../components`:

| Component | Purpose | Hydration |
|-----------|---------|-----------|
| `PreviewLink` | External link with hover preview card | `client:load` |
| `ExploreCard` | Collapsible card for supplementary content (Snippet of the Week) | `client:load` |
| `Aside` | Side-note or callout box | `client:load` |
| `BlockQuote` | Styled quotation with author/source attribution | `client:load` |
| `PullQuote` | Large emphasized inline quote | `client:load` |
| `Collapsible` | Generic collapsible section | `client:load` |
| `YouTubeEmbed` | YouTube video embed (takes `id` and `title` props) | `client:load` |
| `ChatDemo` | Interactive AI chat demonstration | `client:visible` |
| `Phonetic` | IPA pronunciation display (takes `ipa` prop) | `client:load` |
| `ScriptInline` | Script/alphabet transliteration | `client:load` |
| `GPEvolutionVisualizer` | Animated genetic programming visualization | `client:visible` |
| `CriticalThinkingLoop` | Animated critical thinking loop diagram | `client:visible` |
| `FirstPrinciplesVisual` | First principles breakdown | `client:visible` |
| `ConfirmationBiasVisual` | Confirmation bias illustration | `client:visible` |
| `ExtrapolationVisual` | Extrapolation concept visual | `client:visible` |
| `ConsilienceVisual` | Consilience concept visual | `client:visible` |
| `SearchLandscapeVisual` | Search/optimization landscape visual | `client:visible` |
| `Cite` | Inline superscript citation linking to reference list | none |
| `References` | Rendered reference list with back-links to inline citations | none |

### Page/layout components (not for MDX)

| Component | Purpose |
|-----------|---------|
| `Hero` | Landing page hero section |
| `LandingExperience` | Three.js plexus background + landing |
| `WelcomeTimeline` | About page timeline |
| `TimelineImage` | Image with credit overlay (used in timeline) |
| `AutoHideHeader` | Scroll-responsive header |
| `NavbarMenuEnhanced` | Main navigation |
| `MobileMenu` | Mobile navigation drawer |
| `MobileTOC` | Mobile table of contents |
| `TableOfContents` | Desktop table of contents |
| `CodeBlockEnhancer` | Adds copy buttons to code blocks |
| `HeadingLinkEnhancer` | Adds anchor links to headings |
| `ProjectCard` / `ProjectHero` | Project listing and detail pages |
| `FeatureGrid` / `TechStackGrid` | Project detail page grids |
| `TerminalDemo` / `ImageShowcase` | Project demo renderers |
| `ResearchCard` / `ResearchHero` | Research page components |
| `BlogSearch` | Blog search with fuzzy matching |
| `SocialDock` / `SocialLinksGrid` | Social links display |
| `ShareButton` / `CopyMarkdownButton` | Post sharing utilities |
| `ModeToggle` | Dark/light theme toggle |
| `StatusBadge` | Project status indicator |
| `NewsletterSignup` | Newsletter subscription form |
| `ArchitectureFlow` | Architecture diagram component |
| `NavigationMenuDemo` | Navigation menu showcase |

### UI primitives (`src/components/ui/`)

| Component | Source |
|-----------|--------|
| `button` | shadcn/ui |
| `dropdown-menu` | shadcn/ui + Radix |
| `navigation-menu` | Radix |
| `navbar-menu` | Custom animated nav |
| `timeline` | Custom timeline renderer |
| `floating-dock` | Animated floating dock |
| `link-preview` | Hover link preview card |
| `placeholders-and-vanish-input` | Animated search input |
| `aurora-background` | Aurora gradient background |
| `background-lines` | Animated background lines |
| `plexus-background` | Three.js plexus network (+ `plexus-webgl/` subdir) |

## Content rules

### Blog posts

- Frontmatter requires: `title`, `description`, `pubDate`, `tags`. Optional: `heroImage`, `updatedDate`, `draft`, `shareText`.
- Set `draft: true` to hide content from production.
- Tags are arrays of lowercase strings.
- Can import and use React components with `client:load` or `client:visible` hydration.
- Support KaTeX math via `remark-math` + `rehype-katex` (`$$` for display, `$` for inline).
- Support Mermaid diagrams via fenced ` ```mermaid ` code blocks. `src/lib/remark-mermaid.ts` converts the fence into a placeholder and `MermaidRenderer` (loaded in the blog template) lazy-loads mermaid client-side, theme-aware (re-renders on dark/light toggle).

### Stories

Stories are **text-only Markdown** (`.md`) in `src/stories/`. They use no React components, no images, and no MDX.

**Frontmatter requires:** `title`, `description`, `pubDate`, `tags`. Optional: `updatedDate`, `draft`.

**Writing style:**
- **First-person, present-tense narration** — immediate, visceral, stream-of-consciousness.
- **Short paragraphs** — often a single sentence or word. White space controls pacing.
- **Dialogue is inline**, separated by blank lines. Uses `"..."` quotes with speaker attribution after.
- **`_italics_` for internal thought** and emphasis. `*italics*` for meta-text (e.g., `*To be continued...*`).
- **`--` for em-dashes** (double hyphen, not `—`) — used for interruption, hesitation, and mid-thought breaks.
- **`<br/>` for forced line breaks** within a paragraph — keeps lines visually together while breaking mid-thought (e.g., multi-line dialogue from one speaker, fragmented thoughts).
- **`---` for scene breaks** — rendered as decorative `— ✧ —` ornaments by the story CSS.
- **No headings** within content — narrative is continuous, divided only by `---` scene breaks.
- **No code blocks, no math, no embeds, no images** — pure prose only.
- **Continuation marker:** Multi-part stories end with `*To be continued...*`.

**Rendering:**
- Stories render in `story-prose` class: `1.2rem` font, `line-height: 2`, `letter-spacing: 0.01em`.
- `<hr>` renders as centered `— ✧ —` ornaments with `3rem` margin.
- A decorative "End" footer (diamond ornament + uppercase label) is auto-appended by the `[slug].astro` template.
- Max width: `max-w-2xl` (narrower than blog for readability).
- OG metadata: `ogType="article"` with `publishedTime` and `tags`.

**Tone:**
- Emotionally raw, fragmented, urgent.
- Pacing via paragraph length — shorter = faster.
- Abrupt cuts, incomplete thoughts, and repeated `---` blackouts convey disorientation.
- Dialogue is sparse and loaded — characters say little, imply much.

## Snippet of the Week

Every blog post should close with a **"Snippet of the Week"** — a cross-domain educational tangent inside an `ExploreCard`. This is a core content convention established in the first post.

**Pattern:**
```mdx
## Snippet of the Week

<ExploreCard client:load title="Topic — Subtitle">

Explanatory prose connecting the snippet to the post.

#### The Math (optional)
$$
LaTeX formula
$$

#### The Code
```language
code sample
```

#### The Connection
Ties the snippet back to the post's theme.

</ExploreCard>
```

**Rules:**
- Must be from a **different domain** than the post's primary subject.
- Should include code and/or math when applicable.
- `ExploreCard` is collapsed by default.
- Posts with formal references use a `## References` section with numbered citations instead of or in addition to the snippet.

## Citations

Blog posts with references use `Cite` and `References` components for dynamic two-way linking.

**Usage:**
```mdx
import Cite from '../components/Cite';
import References from '../components/References';

...training datasets<Cite id={1} />.

---

<References items={[
  { id: 1, text: 'Author. "Title." Source, Year.', url: "https://..." },
]} />
```

- `<Cite id={N} />` renders as superscript `[N]` linking down to `#ref-N`.
- Each reference entry's `[N]` links back up to `#cite-N`.
- No `client:load` needed — both are static markup.
- `id` values must match between `Cite` and `References` items.
- Place `<References>` at the end of the post after `---`.
- `text` contains the citation (author, title, source, year) — URL renders separately.

## Visual and media guidelines

- **Image format:** WebP for photos, SVG for charts/icons, PNG for screenshots with text.
- **Image credits:** Any third-party image must have a corresponding entry in `src/data/imageCredits.ts` with photographer name and URL.
- **YouTube embeds:** Use the `YouTubeEmbed` component with a valid video ID.
- **Project demos:** Referenced in `src/data/projects.ts` — images go in `public/projects/<slug>/`.
- **OG images:** Auto-generated via Satori at `src/pages/og/[...slug].png.ts`. Uses Inter fonts from `public/fonts/`.
- **Stories have no visual support** — do not add images, embeds, or components to story files.

## License

- **Code** (source, config, tooling): Apache License 2.0
- **Content** (blog posts, images, branding): CC BY-NC-ND 4.0

Any contributed images must be compatible with CC BY-NC-ND 4.0 or be original work.

## Available skills

- **visual-audit** (`skills/visual-audit/SKILL.md`): Audit visuals for replacements, feel consistency, reference integrity, and credit compliance. Use when adding, changing, or reviewing images and media.
- **blog-to-tweet** (`skills/blog-to-tweet/SKILL.md`): Convert a blog post into a Twitter/X thread (3-8 tweets) ready to copy and post. Use when promoting a blog post on Twitter/X.
- **blog-to-twitter-article** (`skills/blog-to-twitter-article/SKILL.md`): Convert a blog post into a standalone Twitter/X article (long-form) with a link back to the original. Use when reposting blog content as a Twitter/X article.

## Do not

- Remove or rename `public/fonts/Inter-*.ttf` — OG image generation depends on them.
- Add images without credit entries for third-party work.
- Modify `content.config.ts` schemas without updating all existing content to match.
- Use `git add -A` — stage specific files to avoid committing `.env` or build artifacts.
- Skip the Snippet of the Week in new blog posts without explicit instruction.
- Use `client:load` for heavy visualization components — prefer `client:visible` for anything with animations or WebGL.
- Add React components, images, or embeds to stories — stories are pure Markdown prose.
- Use `—` (em-dash character) in stories — use `--` (double hyphen) instead.
- Add headings (`##`, `###`, etc.) inside story content — use `---` scene breaks only.
