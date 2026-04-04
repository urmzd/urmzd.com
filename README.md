# urmzd.com

Personal website and blog for [urmzd.com](https://urmzd.com) — built with Astro, React, and Three.js.

## Tech Stack

- **Framework:** [Astro](https://astro.build) with [React](https://react.dev) islands
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **3D:** [Three.js](https://threejs.org) via React Three Fiber
- **Content:** MDX blog posts with KaTeX math support
- **Tooling:** [Biome](https://biomejs.dev) (lint + format), [Husky](https://typicode.github.io/husky/) + lint-staged, TypeScript

## Project Structure

```
src/
├── pages/        # Astro page routes
├── components/   # React & Astro components
├── layouts/      # Page layouts
├── blog/         # MDX blog posts
├── data/         # Static data and constants
├── hooks/        # React hooks
├── lib/          # Shared utilities
└── styles/       # Global styles
public/           # Static assets (images, fonts, icons)
```

## Prerequisites

- [Node.js](https://nodejs.org) 24+
- npm
## Getting Started

```bash
# Clone the repo
git clone https://github.com/urmzd/urmzd.com.git
cd urmzd.com

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start dev server
npm run dev
```

The site will be available at `http://localhost:4321`.

## Available Commands

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
| Generate icons | `npm run generate:icons` |

## License

This project is dual-licensed:

- **Code** (source files, config, tooling) — [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- **Content** (blog posts, images, branding) — [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

See [LICENSE](./LICENSE) for full details.
