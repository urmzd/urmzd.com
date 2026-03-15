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
    tagline: 'Cross-platform dev environment via chezmoi + Nix',
    description:
      'A portable, reproducible development environment managed by chezmoi and Nix flakes. Includes 13 composable dev shells, agent skills for AI tools (Claude Code, Codex, Gemini, Copilot), terminal configuration, and automated bootstrap for macOS and Linux.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/dotfiles',
    tech: [
      { name: 'Nix', icon: 'nixos' },
      { name: 'Lua', icon: 'lua' },
      { name: 'Shell', icon: 'gnubash' },
    ],
    features: [
      {
        title: 'Nix Dev Shells',
        description:
          '13 composable, reproducible development shells — one per language, all shareable via flakes.',
        icon: 'Boxes',
      },
      {
        title: 'Agent Skills',
        description:
          'Portable standards distributed to Claude Code, Codex, Gemini, and Copilot via npx skills.',
        icon: 'Brain',
      },
      {
        title: 'Cross-Platform',
        description:
          'chezmoi templates adapt to macOS and Linux with platform-specific guards and feature flags.',
        icon: 'Monitor',
      },
      {
        title: 'One-Command Bootstrap',
        description:
          'Single script installs Nix, chezmoi, and applies the full environment from scratch.',
        icon: 'Terminal',
      },
      {
        title: 'Neovim Config',
        description: 'Full Lua-based Neovim setup with LSP, tree-sitter, and plugin management.',
        icon: 'Code',
      },
      {
        title: 'Automated Maintenance',
        description:
          'chezmoi hooks auto-install packages, generate completions, and check flake freshness.',
        icon: 'RefreshCw',
      },
    ],
    hasDetailPage: true,
  },
  {
    slug: 'resume-generator',
    title: 'Resume Generator',
    tagline: 'Data-driven resumes with AI assessment',
    description:
      'A data-driven CLI tool that converts YAML, JSON, or TOML resume data into polished PDFs, DOCX, HTML, LaTeX, and Markdown — with multi-agent AI assessment via Ollama for automated resume feedback and scoring.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/resume-generator',
    tech: [
      { name: 'Go', icon: 'go' },
      { name: 'Cobra', icon: 'go' },
      { name: 'Ollama', icon: 'ollama' },
    ],
    features: [
      {
        title: 'Multi-Format Input',
        description: 'Define your resume in YAML, JSON, or TOML — whichever fits your workflow.',
        icon: 'FileInput',
      },
      {
        title: 'Rich Output Formats',
        description: 'Export to PDF, HTML, DOCX, LaTeX, or Markdown with a single command.',
        icon: 'FileOutput',
      },
      {
        title: 'AI Assessment',
        description:
          'Multi-agent AI evaluation via Ollama provides automated feedback and scoring on your resume.',
        icon: 'Brain',
      },
      {
        title: 'CLI First',
        description:
          'Powerful command-line interface via Cobra for scripting and CI/CD integration.',
        icon: 'Terminal',
      },
      {
        title: 'Template Engine',
        description: 'Go template system with custom functions for flexible resume layouts.',
        icon: 'Layout',
      },
      {
        title: 'Agent Skill',
        description: 'Usable as an agent skill for integration into AI-powered workflows.',
        icon: 'Zap',
      },
    ],
    hasDetailPage: true,
  },
  {
    slug: 'semantic-release',
    title: 'Semantic Release',
    tagline: 'Trunk-based semantic versioning CLI',
    description:
      'A configurable trunk-based semantic release CLI for Rust — analyzes conventional commits, determines version bumps, generates changelogs, creates git tags, and publishes GitHub releases.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/semantic-release',
    tech: [{ name: 'Rust', icon: 'rust' }],
    features: [
      {
        title: 'Conventional Commits',
        description:
          'Parses commit messages following the conventional commits spec to determine version bumps.',
        icon: 'GitBranch',
      },
      {
        title: 'Semantic Versioning',
        description: 'Automatically calculates the next semver version based on commit types.',
        icon: 'Tag',
      },
      {
        title: 'Changelog Generation',
        description: 'Produces structured changelogs from your commit history.',
        icon: 'FileText',
      },
      {
        title: 'Dry Run Mode',
        description: 'Preview what would happen without making any changes using `sr plan`.',
        icon: 'Zap',
      },
      {
        title: 'Configurable Rules',
        description:
          'Customize version bump rules and changelog formatting to match your workflow.',
        icon: 'Settings',
      },
      {
        title: 'CI/CD Ready',
        description: 'Designed for automation — runs headlessly in any CI pipeline.',
        icon: 'Code',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'terminal',
      title: 'semantic-release',
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
    title: 'GitHub Metrics',
    tagline: 'Visualize your GitHub activity',
    description:
      'A TypeScript tool that collects and visualizes GitHub contribution metrics and activity data. Generates beautiful SVG charts showing language usage, expertise areas, contribution pulse, and more — perfect for embedding in your profile README.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/github-metrics',
    tech: [
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Node.js', icon: 'nodedotjs' },
      { name: 'GitHub Actions', icon: 'githubactions' },
    ],
    features: [
      {
        title: 'Language Breakdown',
        description: 'Visualize your most-used programming languages across all repositories.',
        icon: 'BarChart3',
      },
      {
        title: 'Contribution Pulse',
        description: 'Track your contribution activity over time with pulse charts.',
        icon: 'Activity',
      },
      {
        title: 'Expertise Areas',
        description: 'Identify and display your areas of technical expertise.',
        icon: 'Layers',
      },
      {
        title: 'SVG Output',
        description: 'Generates crisp, scalable SVG charts that look great everywhere.',
        icon: 'Image',
      },
      {
        title: 'GitHub Actions',
        description: 'Runs automatically via GitHub Actions to keep metrics up to date.',
        icon: 'RefreshCw',
      },
      {
        title: 'Profile Ready',
        description: 'Embed directly in your GitHub profile README for instant visibility.',
        icon: 'Github',
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
    title: 'OpenAPI Generator',
    tagline: 'OpenAPI 3.x to TypeScript & React code generator',
    description:
      'A Rust-powered code generator that turns OpenAPI 3.x specs into zero-dependency TypeScript clients, SWR hooks, and SSE streaming utilities for React applications.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/openapi-generator',
    tech: [
      { name: 'Rust', icon: 'rust' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'React', icon: 'react' },
    ],
    features: [
      {
        title: 'Zero-Dependency Clients',
        description: 'Generates fully typed TypeScript clients with no runtime dependencies.',
        icon: 'Code',
      },
      {
        title: 'SWR Hooks',
        description: 'Auto-generates React SWR hooks for data fetching from your API spec.',
        icon: 'RefreshCw',
      },
      {
        title: 'SSE Streaming',
        description: 'Built-in support for server-sent events streaming in generated code.',
        icon: 'Radio',
      },
      {
        title: 'OpenAPI 3.x',
        description: 'Full support for OpenAPI 3.0 and 3.1 specifications.',
        icon: 'FileText',
      },
      {
        title: 'Type Safety',
        description: 'Produces fully typed code with proper interfaces and validation.',
        icon: 'Shield',
      },
      {
        title: 'Fast Generation',
        description: 'Rust-powered core for blazing fast code generation even on large specs.',
        icon: 'Zap',
      },
    ],
    hasDetailPage: true,
    demo: {
      kind: 'image',
      images: [
        {
          src: '/projects/openapi-generator/demo.gif',
          alt: 'OpenAPI Generator CLI demo showing code generation workflow',
          caption: 'CLI Workflow',
        },
      ],
    },
  },
  {
    slug: 'linear-gp',
    title: 'Linear Genetic Programming Framework',
    tagline: 'Production-grade Rust framework for LGP research',
    description:
      'A production-grade Rust framework for linear genetic programming research, featuring modular architecture, Q-Learning integration, automated hyperparameter optimization, and support for reinforcement learning and classification tasks. Includes Rayon-powered parallel fitness evaluation, Optuna optimization backed by PostgreSQL, and Python CLI tools for batch experiments, visualization, and statistical analysis.',
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
        description:
          'Modular design using Rust traits — swap genetic operators, fitness functions, and selection strategies without changing core logic.',
        icon: 'Layers',
      },
      {
        title: 'Parallel Evaluation',
        description:
          'Rayon-powered parallel fitness evaluation for fast population processing across all available cores.',
        icon: 'Cpu',
      },
      {
        title: 'Hyperparameter Optimization',
        description:
          'Optuna integration with PostgreSQL backend for systematic hyperparameter search across experiments.',
        icon: 'Settings',
      },
      {
        title: 'Q-Learning Integration',
        description:
          'Built-in Q-Learning support for reinforcement learning tasks alongside classification experiments.',
        icon: 'Brain',
      },
      {
        title: 'Experiment Visualization',
        description:
          'Python CLI tools for generating plots of fitness, diversity, and convergence across generations.',
        icon: 'BarChart3',
      },
      {
        title: 'Dockerized Workflows',
        description:
          'Docker Compose setup for reproducible experiments with PostgreSQL and batch processing out of the box.',
        icon: 'Server',
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
