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
- **Stories** in Markdown with literary prose formatting
- **Research** showcase with paper links, tech stacks, and demo galleries
- **Projects** portfolio with live descriptions synced from GitHub
- **Agent Skills** catalog synced from [urmzd/dotfiles](https://github.com/urmzd/dotfiles)
- **3D plexus background** via React Three Fiber
- **Glassmorphism UI** with Tailwind CSS v4
- **Dynamic OG images** generated with Satori
- **RSS feed**, sitemap, and search with fuzzy matching

## Quick Start

```bash
git clone https://github.com/urmzd/urmzd.com.git
cd urmzd.com
npm install
cp .env.example .env
npm run dev
```

The site will be available at `http://localhost:4321`.

**Requires** Node.js 24+ and npm.

## Usage

| Command | Script |
| --- | --- |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview build | `npm run preview` |
| Lint | `npm run lint` |
| Lint (autofix) | `npm run lint:fix` |
| Format | `npm run format` |
| Format (check) | `npm run format:check` |
| Type check | `npm run check` |
| Sync skills | `npm run fetch:skills` |
| Generate icons | `npm run generate:icons` |

## Agent Skill

This repo's conventions are available as portable agent skills in [`skills/`](skills/).

## License

This project is dual-licensed:

- **Code** (source files, config, tooling) **licensed under** [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Content** (blog posts, images, branding) **licensed under** [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

See [LICENSE](./LICENSE) for full details.
