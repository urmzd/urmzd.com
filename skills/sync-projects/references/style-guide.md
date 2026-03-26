# Content Style Guide

## Tone

Write for a technical audience evaluating engineering skill. Every sentence should contain concrete technical content — no filler.

### Do

- "Rayon-powered parallel fitness evaluation across all available CPU cores."
- "Generates zero-dependency TypeScript clients from OpenAPI 3.x specs."
- "Q-Learning layer learns register-action mappings, eliminating manual domain-specific configuration."

### Don't

- "A powerful tool for developers."
- "Makes your life easier."
- "Industry-leading solution for modern workflows."

## Project Descriptions (35-50 words)

Structure: What it does + hardest problem it solves + key technical detail.

**Example:**
> A Rust-powered code generator that turns OpenAPI 3.x specs into zero-dependency TypeScript clients, SWR hooks, and SSE streaming utilities. Handles discriminated unions, recursive schemas, and server-sent event streams without runtime dependencies.

## Project Taglines (under 60 chars)

Crisp, technical, specific to the project's core value.

**Good:** `Trunk-based semantic versioning CLI in Rust`
**Bad:** `A tool for managing releases`

## Feature Descriptions (10-15 words, single sentence)

Each feature description highlights *why it's impressive*, not just *what it does*.

**Good:** `Parallel fitness evaluation via Rayon across all available CPU cores.`
**Bad:** `Runs fitness evaluation in parallel.`

## Research Descriptions (3-4 sentences with metrics)

Structure: Problem statement + method + key quantitative result + insight.

**Example:**
> Proposes Reinforced Linear Genetic Programming (RLGP), layering Q-Learning on LGP to automate register-action assignments. Evaluated on OpenAI Gym CartPole-v1 and MountainCar-v0. LGP achieved mean reward 454 on CartPole; RLGP solved the task but plateaued at 213. The early plateau reveals a tension between evolutionary instability and RL convergence requirements.

## Research Body Sections

Always use these four headers in this order:

1. `## Motivation` — Why this problem matters. 2-3 sentences.
2. `## Approach` — Method and key design decisions. 3-5 sentences.
3. `## Results` — Quantitative outcomes with specific numbers. 3-5 sentences.
4. `## Key Takeaway` — The non-obvious insight. 2-3 sentences.

## Fetching READMEs

Use the `gh` CLI for authenticated, rate-limit-friendly fetching:

```bash
# Fetch README content directly via GitHub API
gh api repos/{owner}/{repo}/readme --jq '.content' | base64 -d

# Or fetch raw content
gh api repos/{owner}/{repo}/contents/README.md --jq '.download_url' | xargs curl -sL
```

Prefer `gh api` over raw `curl` to `raw.githubusercontent.com` — it handles auth, rate limits, and private repos automatically.
