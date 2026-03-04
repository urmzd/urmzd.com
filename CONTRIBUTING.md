# Contributing

Thanks for your interest in contributing to urmzd.com! This guide covers the workflow and conventions used in this project.

## Getting Started

1. Read the [README](./README.md) for setup instructions.
2. Fork the repo and clone your fork:
   ```bash
   git clone https://github.com/<your-username>/urmzd.com.git
   cd urmzd.com
   ```
3. Install dependencies:
   ```bash
   just install  # or: npm install
   ```

## Development Workflow

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
   Use prefixes: `feat/`, `fix/`, `chore/`, `docs/`.

2. Start the dev server:
   ```bash
   just dev  # or: npm run dev
   ```

3. Before committing, run lint and format checks:
   ```bash
   just lint   # or: npm run lint
   just fmt    # or: npm run format
   ```
   A pre-commit hook (Husky + lint-staged) runs these automatically on staged files.

## Code Style

[Biome](https://biomejs.dev) handles both linting and formatting — no separate Prettier/ESLint config needed.

- Run `just fmt` to format and `just lint` to lint.
- The pre-commit hook enforces this automatically, so CI failures from style issues should be rare.
- Follow existing patterns in the codebase for component structure and naming.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add newsletter signup form
fix: correct date parsing in blog posts
chore: update dependencies
docs: improve README setup instructions
```

Keep the subject line under 72 characters. Use the body for additional context when needed.

## Pull Requests

- Target the `main` branch.
- Provide a clear description of what changed and why.
- CI must pass (lint, type check, build) before merging.
- Keep PRs focused — one feature or fix per PR.

## Content

- Blog posts go in `src/blog/` as `.mdx` files.
- Follow the frontmatter schema used by existing posts.
- Content (blog posts, images, branding) is licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

## License

By contributing:

- **Code contributions** are licensed under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
- **Content contributions** are licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).

See [LICENSE](./LICENSE) for full details.
