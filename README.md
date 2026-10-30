<p align="center">
  <h1 align="center">urmzd.com</h1>
  <p align="center">
    Personal website, blog, and research portfolio built with Astro, React, and Three.js.
    <br /><br />
    <a href="https://urmzd.com">Visit</a>
    &middot;
    <a href="https://github.com/urmzd/urmzd.com/issues">Report Bug</a>
    &middot;
    <a href="https://urmzd.com/rss.xml">RSS</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/urmzd/urmzd.com/actions/workflows/ci.yml"><img src="https://github.com/urmzd/urmzd.com/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  &nbsp;
  <a href="LICENSE"><img src="https://img.shields.io/github/license/urmzd/urmzd.com" alt="License"></a>
</p>

## Features

- **Blog** posts in MDX with interactive components, KaTeX math, and citations
- **Research** showcase with paper links, tech stacks, and demo galleries
- **Projects** portfolio with live descriptions synced from GitHub
- **3D plexus background** via React Three Fiber
- **Glassmorphism UI** with Tailwind CSS v4
- **Dynamic OG images** generated with Satori
- **RSS feed**, sitemap, and search with fuzzy matching

## Quick Start

```bash
git clone https://github.com/urmzd/urmzd.com.git
cd urmzd.com
pnpm install
cp .env.example .env
pnpm run dev
```

The site will be available at `http://localhost:4321`.

**Requires** Node.js 24+ and pnpm (via corepack).

## Usage

| Command | Script |
| --- | --- |
| Dev server | `pnpm run dev` |
| Production build | `pnpm run build` |
| Preview build | `pnpm run preview` |
| Lint | `pnpm run lint` |
| Lint (autofix) | `pnpm run lint:fix` |
| Format | `pnpm run format` |
| Format (check) | `pnpm run format:check` |
| Type check | `pnpm run check` |
| Generate icons | `pnpm run generate:icons` |
| Generate previews | `pnpm run generate:previews` |

Repost generation and publishing live in [urmzd/broadcast](https://github.com/urmzd/broadcast), which reads this blog through `BROADCAST_BLOG_DIR`. See that repository for the `broadcast generate <slug>` workflow.

## Agent Skill

This repo's conventions are available as portable agent skills in [`skills/`](skills/).

## License

This project is dual-licensed:

- **Code** (source files, config, tooling) **licensed under** [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Content** (blog posts, images, branding) **licensed under** [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

See [LICENSE](./LICENSE) for full details.
