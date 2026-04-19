---
name: authoring-showcase
description: >
  Author a SHOWCASE.md file in a GitHub repo so it appears on urmzd.com/projects
  or urmzd.com/research. Use when: adding a repo to the portfolio, customizing
  how a project appears on the site, or overriding the GitHub description/tags
  with curated copy.
compatibility: "Requires: gh CLI authenticated, write access to the target repo"
allowed-tools: Bash Read Edit Write Grep Glob
metadata:
  author: urmzd
  version: "1.1"
---

# Authoring SHOWCASE.md

Portfolio and research pages on urmzd.com are auto-generated from GitHub. Each repo opts in via a topic (`showcase` or `research`) and may include a `SHOWCASE.md` file to control the rendered page.

## How the pipeline works

At build time, `src/lib/github-loader.ts` queries the GitHub API for all repos owned by `urmzd` and filters to:

- `private: false`
- `fork: false`
- `topics` includes `showcase` OR `research`

Topic determines routing:

- `research` → `urmzd.com/research/<repo>`
- otherwise → `urmzd.com/projects/<repo>`

For each eligible repo the body is resolved in this order:

1. `SHOWCASE.md` at repo root — frontmatter overrides repo metadata; body is the page content.
2. `README.md` — used as the body when no SHOWCASE.md exists.
3. Description-only — when neither file exists.

## When to Use

- Adding a new repo to the portfolio or research index
- A repo's GitHub description is too terse or too generic for the site
- README has install/CI badges and section structure that reads poorly as a portfolio page
- Surfacing research-specific metadata (year, venue, paper link) not present on GitHub

## Instructions

### 1. Opt the repo in

```bash
gh repo edit urmzd/<repo> --add-topic showcase   # for /projects
gh repo edit urmzd/<repo> --add-topic research   # for /research
```

A repo with both topics is treated as research (takes precedence).

### 2. Decide whether SHOWCASE.md is needed

Skip it if the README already reads well as a standalone page. Create one when you need:

- A curated narrative distinct from install instructions
- Title/description/tags different from GitHub metadata
- Research-specific metadata (year, venue, paper URL)

### 3. Create SHOWCASE.md at the repo root

Project example:

```markdown
---
title: Incipit
description: Resume CLI with multi-provider AI review
tags: [career-tools, ai, cli]
---

## What it does

One-paragraph pitch focused on the hardest engineering problem solved.

## Why it exists

The motivation — what was broken about existing tools.

## How it works

Architecture highlights — concrete details (languages, algorithms, patterns).
```

Research example:

```markdown
---
title: Reinforced Linear Genetic Programming
description: BCS thesis on Q-learning-augmented LGP for RL and classification
tags: [genetic-programming, reinforcement-learning]
year: 2023
venue: arXiv
paperUrl: https://arxiv.org/abs/...
---

## Motivation

...

## Approach

...

## Results

...

## Key Takeaway

...
```

### 4. Frontmatter fields

All fields are optional. Missing fields fall back to GitHub metadata.

**Shared:**
- `title` — display name on the site. Defaults to repo name.
- `description` — 1-sentence tagline, under 80 chars. Defaults to the repo's GitHub description.
- `tags` — array of strings shown as chips. Defaults to the repo's GitHub topics.

**Research-only:**
- `year` — publication year (number). Controls sort order on /research.
- `venue` — publication venue (e.g. "arXiv", "NeurIPS").
- `paperUrl` — link to the paper PDF or arXiv entry.

### 5. Body guidelines

- **Lead with impact** — first sentence names the hardest problem solved (projects) or the headline result (research).
- **No GitHub-specific chrome** — skip install badges, CI status, license footers. They belong in README.md, not SHOWCASE.md.
- **Concrete over generic** — name algorithms, protocols, architectures, metrics. Avoid marketing copy.
- **Assume no prior context** — a reader arriving from the portfolio index has not seen the README.
- **Research body uses four sections**: `## Motivation`, `## Approach`, `## Results`, `## Key Takeaway`.
- **Markdown only** — no MDX components, no relative image paths (use absolute URLs).

### 6. Verify

After pushing, trigger a site rebuild and confirm the page appears at the expected URL. The loader uses repo name as the slug.

## Gotchas

- The `showcase` / `research` topic is the gate — without it, SHOWCASE.md is ignored and the repo does not appear.
- Archived repos still appear if the topic is set; they render with an "Archived" badge.
- Forks are always excluded regardless of topic.
- Relative image paths in SHOWCASE.md will 404 on the site — use absolute URLs (GitHub raw links or a CDN).
- Frontmatter `tags` fully replaces GitHub topics for display; to show both, duplicate the topics in `tags`.
- A repo tagged both `showcase` and `research` renders as research.

## Output

A SHOWCASE.md file in the target repo and, if needed, an updated topic list via `gh repo edit`.
