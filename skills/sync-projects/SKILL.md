---
name: sync-projects
description: >
  Fetch latest READMEs from GitHub repos and update project/research site content
  for readability and talent showcase. Use when: refreshing project descriptions,
  syncing site content with upstream repos, updating research entries, or ensuring
  consistency across collections. Also use when content feels stale or descriptions
  are inconsistent.
compatibility: "Requires: gh CLI authenticated (gh auth status)"
allowed-tools: Bash Read Edit Write WebFetch Grep Glob
metadata:
  author: urmzd
  version: "1.0"
---

# Sync Projects

Pull the latest READMEs from GitHub and update site content to showcase technical talent with consistent, readable formatting.

## When to Use

- User says "sync projects", "update projects", "refresh content", or "pull latest"
- Project descriptions feel stale or out of sync with the actual repos
- New project or research entry added and needs content populated
- Descriptions are inconsistent in length, tone, or technical depth

## Instructions

### 1. Gather sources

Read `src/data/projects.ts` to get all `githubUrl` values. Read all `src/research/*.mdx` files to get their `githubUrl` frontmatter fields.

### 2. Fetch READMEs

Use `gh api` for authenticated, rate-limit-friendly fetching:

```bash
# From githubUrl like https://github.com/urmzd/dotfiles
# Extract owner/repo, then fetch decoded README:
gh api repos/urmzd/dotfiles/readme --jq '.content' | base64 -d
```

Fetch all READMEs in parallel where possible. Skip entries where the README is unavailable — log and continue.

### 3. Update projects (`src/data/projects.ts`)

For each project, compare the fetched README against the current fields. Update:

- **`tagline`**: Under 60 characters. Technical and specific. No fluff.
- **`description`**: 2-3 sentences, 35-50 words. Lead with what it does, then highlight the hardest engineering problem it solves. Include concrete details (languages, algorithms, architecture patterns).
- **`features`**: Exactly 6 per project. Each `description` is 1 sentence, 10-15 words. Prioritize features showing technical depth over basic functionality.

See [references/style-guide.md](references/style-guide.md) for tone and examples.

### 4. Update research (`src/research/*.mdx`)

For each research entry, update:

- **Frontmatter `description`**: 3-4 sentences with specific metrics (accuracy, F1, recall). Summarize problem, method, key result.
- **Body sections**: Must use exactly these headers: `## Motivation`, `## Approach`, `## Results`, `## Key Takeaway`. Update content if the README reveals information not currently captured.
- **Frontmatter `features`**: Same rules as projects — 6 features, 10-15 word descriptions.

### 5. Consistency pass

After all updates, verify:

- [ ] All project descriptions are 35-50 words
- [ ] All project taglines are under 60 characters
- [ ] All feature descriptions are 10-15 words, single sentence
- [ ] All research descriptions include at least one metric
- [ ] All research body sections use the four standard headers
- [ ] No marketing fluff — every sentence has concrete technical content

### 6. Build verification

```bash
npx astro build
```

Fix any errors before finishing.

## Gotchas

- `src/data/projects.ts` is a TypeScript file with a `projects` array — edit the object literals directly, do not change the type definitions.
- Research files are `.mdx` with YAML frontmatter — quote strings containing colons or special characters.
- The `features` array `icon` field maps to Lucide React icon names (e.g., `"Layers"`, `"Brain"`, `"Cpu"`). Do not change icon values unless the feature meaning changes.
- The `tech` and `detailTech` arrays map to `@icons-pack/react-simple-icons` keys. Do not change these.
- Research body content is rendered as MDX — do not add imports or components, keep it plain markdown.
- If a README is sparse or missing, preserve the existing content rather than degrading it.

## Output

After syncing, produce a summary table:

| Entry | Type | Changes | README Status |
|-------|------|---------|---------------|
| dotfiles | project | description, features | fetched |
| rlgp-thesis | research | body updated | fetched |
| ... | ... | ... | ... |
