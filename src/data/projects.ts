export type ProjectStatus = 'active' | 'wip' | 'archived';

export interface ProjectTech {
  name: string;
  icon: string; // react-simple-icons key (e.g. 'go', 'react')
}

export interface ProjectFeature {
  title: string;
  description: string;
  icon: string; // lucide-react icon name
}

export interface TerminalLine {
  type: 'command' | 'output';
  text: string;
}

export interface TerminalDemoConfig {
  kind: 'terminal';
  title?: string;
  lines: TerminalLine[];
}

export interface ImageShowcaseConfig {
  kind: 'image';
  images: { src: string; alt: string; caption?: string }[];
}

export type DemoConfig = TerminalDemoConfig | ImageShowcaseConfig;

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  githubUrl: string;
  tech: ProjectTech[];
  features: ProjectFeature[];
  hasDetailPage: boolean;
  demo?: DemoConfig;
}

export const projects: Project[] = [
  {
    slug: 'dotfiles',
    title: 'Dotfiles',
    tagline: 'Unified Nix dev shell with 15+ languages',
    description:
      'One-command bootstrap to a fully configured machine via chezmoi and Nix flakes. A single unified dev shell provides 15+ languages and 40+ tools, with 15 portable agent skills auto-synced to Claude Code, Codex, Gemini, and Copilot.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/dotfiles',
    tech: [
      { name: 'Nix', icon: 'nixos' },
      { name: 'Lua', icon: 'lua' },
      { name: 'Shell', icon: 'gnubash' },
    ],
    features: [
      {
        title: 'Unified Nix Shell',
        description: 'Single flake providing 15+ languages and 40+ tools via direnv activation.',
        icon: 'Boxes',
      },
      {
        title: '15 Agent Skills',
        description: 'Portable agentskills.io specs auto-synced to four AI coding agents.',
        icon: 'Brain',
      },
      {
        title: 'Cross-Platform',
        description: 'chezmoi templates with platform guards adapt to macOS and Linux.',
        icon: 'Monitor',
      },
      {
        title: 'One-Command Bootstrap',
        description: 'Single curl installs Nix, chezmoi, and applies the full environment.',
        icon: 'Terminal',
      },
      {
        title: 'Neovim + LSP',
        description: 'Lua-based Neovim config with LSP for all included languages.',
        icon: 'Code',
      },
      {
        title: 'Automation Hooks',
        description: 'chezmoi scripts auto-rebuild flakes, regenerate completions, sync skills.',
        icon: 'RefreshCw',
      },
    ],
    hasDetailPage: true,
  },
  {
    slug: 'resume-generator',
    title: 'Incipit',
    tagline: 'Resume CLI with multi-provider AI review',
    description:
      'Go CLI that converts JSON/Markdown resumes into PDF, HTML, LaTeX, DOCX, and Markdown via modular templates. Includes multi-provider AI (Anthropic, OpenAI, Google, Ollama) for resume creation from plain text, multi-agent review with scoring, and job-targeted optimization.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/incipit',
    tech: [
      { name: 'Go', icon: 'go' },
      { name: 'Cobra', icon: 'go' },
      { name: 'Ollama', icon: 'ollama' },
    ],
    features: [
      {
        title: 'Multi-Provider AI',
        description: 'Anthropic, OpenAI, Google, and Ollama backends with automatic fallback.',
        icon: 'Brain',
      },
      {
        title: 'AI Resume Creation',
        description: 'Converts plain text into structured JSON resume via LLM extraction.',
        icon: 'FileInput',
      },
      {
        title: 'Multi-Agent Review',
        description: 'Parallel AI agents score and critique resume content independently.',
        icon: 'Eye',
      },
      {
        title: 'Job Optimization',
        description: 'Tailors resume content to a specific job description via AI rewriting.',
        icon: 'Zap',
      },
      {
        title: 'Modular Templates',
        description: 'Pluggable template system with LaTeX, HTML, DOCX, and Markdown renderers.',
        icon: 'Layout',
      },
      {
        title: 'Five Output Formats',
        description: 'PDF (via Chromium or TeX), HTML, DOCX, LaTeX, and Markdown output.',
        icon: 'FileOutput',
      },
    ],
    hasDetailPage: true,
  },
  {
    slug: 'semantic-release',
    title: 'sr',
    tagline: 'AI-powered release engineering CLI in Rust',
    description:
      'Rust CLI handling the full release lifecycle: AI-generated atomic commits, sandboxed code review, PR generation, interactive rebase, and automated semver releases with changelog generation. AI agents run in a strict read-only sandbox with working tree snapshots for safe rollback.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/sr',
    tech: [{ name: 'Rust', icon: 'rust' }],
    features: [
      {
        title: 'AI Atomic Commits',
        description: 'Analyzes diffs and generates grouped conventional commits via LLM agents.',
        icon: 'GitBranch',
      },
      {
        title: 'Sandboxed AI Agents',
        description: 'Read-only tool permissions with working tree snapshots for safe rollback.',
        icon: 'Shield',
      },
      {
        title: 'AI Code Review',
        description: 'Severity-based feedback on staged changes with multi-backend support.',
        icon: 'Eye',
      },
      {
        title: 'Automated Releases',
        description: 'Conventional commit parsing, semver bumps, changelogs, and GitHub releases.',
        icon: 'Tag',
      },
      {
        title: 'Version File Bumping',
        description: 'Auto-updates Cargo.toml, package.json, pyproject.toml, pom.xml, and Go.',
        icon: 'FileText',
      },
      {
        title: 'GitHub Action',
        description: 'First-class Action with artifact uploads, build hooks, and JSON output.',
        icon: 'Code',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'terminal',
      title: 'sr',
      lines: [
        { type: 'command', text: 'sr plan' },
        { type: 'output', text: 'Analyzing commits since v1.2.0...' },
        { type: 'output', text: '' },
        { type: 'output', text: '  feat: add JSON schema validation  → minor' },
        { type: 'output', text: '  fix: handle empty commit bodies   → patch' },
        { type: 'output', text: '  feat!: redesign config format      → major' },
        { type: 'output', text: '' },
        { type: 'output', text: 'Next version: v2.0.0 (major)' },
        { type: 'output', text: '' },
        { type: 'command', text: 'sr release' },
        { type: 'output', text: 'Creating tag v2.0.0...' },
        { type: 'output', text: 'Generating CHANGELOG.md...' },
        { type: 'output', text: '✓ Released v2.0.0' },
      ],
    },
  },
  {
    slug: 'github-metrics',
    title: 'GitHub Insights',
    tagline: 'Composable SVG profile visualizations',
    description:
      'TypeScript pipeline generating composable SVG sections for GitHub profile READMEs: language velocity streamgraphs, contribution radar charts, project constellation maps, and open-source impact trails. Uses AI for project classification and preamble generation, with dual-theme CSS adapting to light/dark mode.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/github-insights',
    tech: [
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Node.js', icon: 'nodedotjs' },
      { name: 'GitHub Actions', icon: 'githubactions' },
    ],
    features: [
      {
        title: 'Language Velocity',
        description: 'Streamgraph SVG showing language usage evolution over the past year.',
        icon: 'BarChart3',
      },
      {
        title: 'Contribution Rhythm',
        description: 'Radar chart revealing day-of-week commit patterns with streak stats.',
        icon: 'Activity',
      },
      {
        title: 'Project Constellation',
        description: 'Visual map positioning repos by language ecosystem and complexity.',
        icon: 'Layers',
      },
      {
        title: 'AI Classification',
        description: 'GitHub Models classify repos by status and purpose with AI summaries.',
        icon: 'Brain',
      },
      {
        title: 'Dual Theme SVGs',
        description: 'CSS prefers-color-scheme adapts all charts to light and dark mode.',
        icon: 'Image',
      },
      {
        title: 'Composable Sections',
        description: 'Pick and order sections via config presets or explicit section lists.',
        icon: 'Settings',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'image',
      images: [
        {
          src: '/projects/github-metrics/metrics-languages.svg',
          alt: 'Language usage chart',
          caption: 'Languages',
        },
        {
          src: '/projects/github-metrics/metrics-expertise.svg',
          alt: 'Expertise areas chart',
          caption: 'Expertise',
        },
        {
          src: '/projects/github-metrics/metrics-pulse.svg',
          alt: 'Contribution pulse chart',
          caption: 'Pulse',
        },
        {
          src: '/projects/github-metrics/metrics-contributions.svg',
          alt: 'Contributions chart',
          caption: 'Contributions',
        },
      ],
    },
  },
  {
    slug: 'openapi-generator',
    title: 'oag',
    tagline: 'OpenAPI 3.x codegen with plugin architecture',
    description:
      'Rust-powered OpenAPI 3.x code generator with a plugin-style architecture: TypeScript clients with zero runtime dependencies, React SWR hooks, Python FastAPI server stubs with Pydantic v2, and first-class SSE streaming via AsyncGenerator. Supports three layout modes, automated test generation, and full $ref resolution.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/oag',
    tech: [
      { name: 'Rust', icon: 'rust' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'React', icon: 'react' },
    ],
    features: [
      {
        title: 'Plugin Architecture',
        description: 'Enable only the generators you need: TS client, React, or FastAPI.',
        icon: 'Layers',
      },
      {
        title: 'Zero-Dep TS Client',
        description: 'Fully typed TypeScript clients generated with no runtime dependencies.',
        icon: 'Code',
      },
      {
        title: 'FastAPI Server Stubs',
        description: 'Python server stubs with Pydantic v2 models and pytest test generation.',
        icon: 'Server',
      },
      {
        title: 'SSE Streaming',
        description: 'First-class server-sent events via AsyncGenerator and StreamingResponse.',
        icon: 'RefreshCw',
      },
      {
        title: 'Three Layout Modes',
        description: 'Bundled, modular, or split-by-tag file organization per generator.',
        icon: 'Layout',
      },
      {
        title: 'Full $ref Resolution',
        description: 'Complete OpenAPI 3.x $ref resolution across nested schemas and paths.',
        icon: 'FileText',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'image',
      images: [
        {
          src: '/projects/openapi-generator/demo.gif',
          alt: 'oag CLI demo showing code generation workflow',
          caption: 'CLI Workflow',
        },
      ],
    },
  },
  {
    slug: 'linear-gp',
    title: 'Linear Genetic Programming',
    tagline: 'Rust LGP framework with Q-Learning integration',
    description:
      'Cargo workspace implementing linear genetic programming as a trait-based Rust library with a CLI for experiment automation. Supports RL environments (CartPole, MountainCar) and classification tasks (Iris) with Q-Learning integration, Rayon-powered parallel fitness evaluation, and structured tracing for experiment diagnostics.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/linear-gp',
    tech: [
      { name: 'Rust', icon: 'rust' },
      { name: 'Python', icon: 'python' },
      { name: 'Docker', icon: 'docker' },
      { name: 'PostgreSQL', icon: 'postgresql' },
    ],
    features: [
      {
        title: 'Trait-Based Architecture',
        description: 'Swap genetic operators, fitness functions, and selection via Rust traits.',
        icon: 'Layers',
      },
      {
        title: 'Parallel Evaluation',
        description: 'Rayon-powered fitness evaluation across all available CPU cores.',
        icon: 'Cpu',
      },
      {
        title: 'Q-Learning Hybrid',
        description: 'RL layer learns register-action mappings on top of evolved programs.',
        icon: 'Brain',
      },
      {
        title: 'Experiment CLI',
        description: 'Full pipeline: hyperparameter search, batch runs, and analysis in one tool.',
        icon: 'Terminal',
      },
      {
        title: 'Structured Tracing',
        description: 'Multi-level tracing with JSON output for log aggregation systems.',
        icon: 'BarChart3',
      },
      {
        title: 'TOML Configs',
        description: 'Declarative experiment configs with per-environment parameter overrides.',
        icon: 'Settings',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'image',
      images: [
        {
          src: '/projects/linear-gp/iris_baseline.png',
          alt: 'Iris baseline experiment results',
          caption: 'Baseline',
        },
        {
          src: '/projects/linear-gp/iris_crossover.png',
          alt: 'Iris crossover experiment results',
          caption: 'Crossover',
        },
        {
          src: '/projects/linear-gp/iris_mutation.png',
          alt: 'Iris mutation experiment results',
          caption: 'Mutation',
        },
        {
          src: '/projects/linear-gp/iris_full.png',
          alt: 'Iris full experiment results',
          caption: 'Full Pipeline',
        },
      ],
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
