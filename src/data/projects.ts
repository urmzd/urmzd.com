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
        description:
          'Portable agentskills.io specs auto-synced to Claude Code, Codex, Gemini, and Copilot.',
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
        description: 'Lua-based Neovim config with full LSP support for all included languages.',
        icon: 'Code',
      },
      {
        title: 'Automation Hooks',
        description:
          'chezmoi scripts auto-rebuild flakes, regenerate shell completions, and sync agent skills.',
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
        description:
          'Anthropic, OpenAI, Google, and Ollama backends with automatic fallback chain.',
        icon: 'Brain',
      },
      {
        title: 'AI Resume Creation',
        description: 'Converts plain text into structured JSON resume via LLM extraction.',
        icon: 'FileInput',
      },
      {
        title: 'Multi-Agent Review',
        description:
          'Parallel AI agents independently score and critique resume content with feedback.',
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
      'Rust CLI handling the full release lifecycle: AI-generated atomic commits, code review, PR generation, interactive rebase, branch naming, and automated semver releases. Three AI backends (Claude, Copilot, Gemini) run in a strict read-only sandbox with working tree snapshots for safe rollback.',
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
        description:
          'Severity-based AI feedback on staged changes using configurable multi-provider backends.',
        icon: 'Eye',
      },
      {
        title: 'Automated Releases',
        description:
          'Conventional commit parsing, semver bumps, changelog generation, and GitHub releases.',
        icon: 'Tag',
      },
      {
        title: 'Version File Bumping',
        description:
          'Auto-updates version strings in Cargo.toml, package.json, pyproject.toml, and Go modules.',
        icon: 'FileText',
      },
      {
        title: 'AI Interactive Rebase',
        description: 'AI-powered reword, squash, and reorder of commits via intelligent rebase.',
        icon: 'GitMerge',
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
      'TypeScript pipeline generating composable SVG visualizations for GitHub profile READMEs: language velocity streamgraphs, contribution radar charts, project constellation maps, and open-source impact trails. Features AI project classification via GitHub Models, preamble generation, and an interactive Ink-based TUI with live progress.',
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
        description: 'Radar chart revealing day-of-week commit patterns with streak and PR stats.',
        icon: 'Activity',
      },
      {
        title: 'Project Constellation',
        description:
          'Visual map positioning repos by language ecosystem and relative complexity level.',
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
        title: 'Interactive TUI',
        description:
          'Ink-based terminal UI with live progress tracking, spinners, and phase timing.',
        icon: 'Terminal',
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
        description:
          'Fully typed TypeScript clients generated with zero runtime dependencies or polyfills.',
        icon: 'Code',
      },
      {
        title: 'FastAPI Server Stubs',
        description: 'Python server stubs with Pydantic v2 models and pytest test generation.',
        icon: 'Server',
      },
      {
        title: 'SSE Streaming',
        description:
          'First-class server-sent events support via AsyncGenerator and StreamingResponse APIs.',
        icon: 'RefreshCw',
      },
      {
        title: 'Three Layout Modes',
        description:
          'Bundled, modular, or split-by-tag file organization configurable per each generator.',
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
      'Cargo workspace implementing linear genetic programming as a trait-based Rust library with a CLI for experiment automation. Supports RL environments (CartPole, MountainCar) and classification tasks (Iris) with Q-Learning integration, Rayon-powered parallel evaluation, and built-in hyperparameter search.',
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
        description:
          'Rayon-powered parallel fitness evaluation distributing work across all CPU cores.',
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
        description: 'Multi-level structured tracing with JSON output for log aggregation systems.',
        icon: 'BarChart3',
      },
      {
        title: 'Hyperparameter Search',
        description:
          'Built-in random search with parallel Rayon evaluation and optimal config export.',
        icon: 'Search',
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
  {
    slug: 'llmem',
    title: 'llmem',
    tagline: 'Tool-agnostic AI agent memory ecosystem in Rust',
    description:
      'Rust CLI and library providing two-level (project + global) AI agent memory with plain markdown files. Features semantic search via HNSW/IVF-Flat ANN indexes, tree-sitter code indexing, Ollama embeddings, a RAG server, and context switching — works with Claude Code, Codex, Gemini, and Copilot.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/llmem',
    tech: [{ name: 'Rust', icon: 'rust' }],
    features: [
      {
        title: 'Two-Level Memory',
        description:
          'Project and global memory scopes with automatic precedence and conflict resolution.',
        icon: 'Layers',
      },
      {
        title: 'Semantic Search',
        description: 'HNSW and IVF-Flat ANN indexes for fast nearest-neighbor memory retrieval.',
        icon: 'Search',
      },
      {
        title: 'Code Indexing',
        description:
          'Tree-sitter chunking for Rust, Python, JavaScript, TypeScript, and Go source files.',
        icon: 'Code',
      },
      {
        title: 'Typed Memories',
        description:
          'Four memory types: user preferences, feedback corrections, project context, and references.',
        icon: 'Tag',
      },
      {
        title: 'RAG Server',
        description:
          'Optional HTTP server with hot-reload for memory search and context switching.',
        icon: 'Server',
      },
      {
        title: 'Tool Agnostic',
        description: 'Works with Claude Code, Codex, Gemini, Copilot, Cursor, or plain markdown.',
        icon: 'Plug',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'saige',
    title: 'saige',
    tagline: 'Unified Go SDK for AI agents, KG, and RAG',
    description:
      'Go SDK unifying streaming AI agents, knowledge graph construction, and RAG pipelines under shared Provider, Embedder, and Tool interfaces. Features 15-event delta streaming, sub-agent delegation, conversation tree persistence, multi-retriever fusion via Reciprocal Rank Fusion, and 9 built-in evaluation metrics.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/saige',
    tech: [
      { name: 'Go', icon: 'go' },
      { name: 'PostgreSQL', icon: 'postgresql' },
    ],
    features: [
      {
        title: 'Streaming Agent Loop',
        description:
          'Fifteen typed delta events with parallel tool execution and sub-agent delegation.',
        icon: 'Activity',
      },
      {
        title: 'Knowledge Graph',
        description:
          'LLM-powered entity extraction with fuzzy deduplication and temporal relation tracking.',
        icon: 'Share2',
      },
      {
        title: 'Multi-Retriever RAG',
        description: 'Vector, BM25, and graph retrieval fused via Reciprocal Rank Fusion.',
        icon: 'Search',
      },
      {
        title: 'Conversation Tree',
        description:
          'Branching conversation graph with checkpoints, rewind, archive, and RLHF feedback.',
        icon: 'GitBranch',
      },
      {
        title: 'Provider Resilience',
        description: 'Four LLM backends with retry and fallback composition out of the box.',
        icon: 'Shield',
      },
      {
        title: 'Evaluation Metrics',
        description:
          'Nine built-in metrics covering retrieval precision, generation faithfulness, and LLM judging.',
        icon: 'BarChart3',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'zoro',
    title: 'Zoro',
    tagline: 'Privacy-first AI research agent with local knowledge graph',
    description:
      'Desktop app and web tool for privacy-first AI research, building a persistent knowledge graph entirely on your machine. Uses local Ollama inference, managed SurrealDB for graph storage, SearXNG for web search, and a Wails-embedded Next.js frontend — no data leaves your device.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/zoro',
    tech: [
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Go', icon: 'go' },
      { name: 'Next.js', icon: 'nextdotjs' },
    ],
    features: [
      {
        title: 'Fully Local',
        description: 'All LLM inference runs on-device via Ollama with no cloud dependencies.',
        icon: 'Lock',
      },
      {
        title: 'Knowledge Graph',
        description:
          'SurrealDB-backed persistent knowledge graph with LLM entity extraction and relationship tracking.',
        icon: 'Share2',
      },
      {
        title: 'Private Web Search',
        description:
          'Managed SearXNG subprocess provides private web search without external API keys.',
        icon: 'Globe',
      },
      {
        title: 'Desktop App',
        description: 'Wails native binary embeds Next.js frontend with no network ports required.',
        icon: 'Monitor',
      },
      {
        title: 'Auto-Provisioning',
        description:
          'SurrealDB and SearXNG downloaded and managed automatically on first desktop launch.',
        icon: 'Download',
      },
      {
        title: 'OpenAPI Client',
        description:
          'Generated frontend API client from OpenAPI spec ensures type-safe backend integration.',
        icon: 'FileText',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'teasr',
    title: 'teasr',
    tagline: 'Automated showcase capture from web, terminal, and desktop',
    description:
      'Rust CLI that captures screenshots and animated GIFs from web apps, terminal sessions, desktop windows, and local files via a declarative TOML config. Uses Chrome DevTools Protocol for web, PTY scripting for terminal, and gifski for pure-Rust GIF encoding — single binary, no runtime dependencies.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/teasr',
    tech: [{ name: 'Rust', icon: 'rust' }],
    features: [
      {
        title: 'Four Capture Modes',
        description:
          'Web, terminal, screen, and file capture modes with unified interaction syntax.',
        icon: 'Camera',
      },
      {
        title: 'Terminal Rendering',
        description:
          'ANSI-to-SVG-to-PNG pipeline with dracula/monokai themes and macOS window chrome.',
        icon: 'Terminal',
      },
      {
        title: 'Pure Rust GIFs',
        description: 'Animated GIF encoding via gifski with no FFmpeg or ImageMagick dependency.',
        icon: 'Film',
      },
      {
        title: 'Declarative Config',
        description:
          'TOML-based scene definitions with interactions like click, type, hover, and scroll.',
        icon: 'Settings',
      },
      {
        title: 'Server Lifecycle',
        description: 'Starts dev servers before capture and kills process groups cleanly on exit.',
        icon: 'Play',
      },
      {
        title: 'GitHub Action',
        description:
          'First-class CI Action with Chrome auto-install and cross-platform runner support.',
        icon: 'Code',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'fsrc',
    title: 'fsrc',
    tagline: 'Sync code snippets into docs via comment markers',
    description:
      'Rust CLI and GitHub Action that embeds source file contents into any document using comment markers. Supports markdown, Python, Rust, Go, SQL, and CSS comment styles with optional code fence wrapping. Idempotent re-runs, dry-run mode, and CI verification ensure documentation stays synchronized with source code.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/fsrc',
    tech: [{ name: 'Rust', icon: 'rust' }],
    features: [
      {
        title: 'Universal Markers',
        description: 'Works with any comment style: HTML, Python, Rust, Go, SQL, CSS, and Lua.',
        icon: 'FileText',
      },
      {
        title: 'Auto Fencing',
        description:
          'Optional code fence wrapping with language auto-detection from file extension.',
        icon: 'Code',
      },
      {
        title: 'Idempotent Updates',
        description:
          'Re-running replaces existing content between markers without duplication or drift.',
        icon: 'RefreshCw',
      },
      {
        title: 'CI Verification',
        description: 'Verify mode checks files are up-to-date and fails CI on drift.',
        icon: 'CheckCircle',
      },
      {
        title: 'GitHub Action',
        description:
          'Drop-in Action with configurable commit messages, author details, and push behavior.',
        icon: 'GitBranch',
      },
      {
        title: 'Dry Run',
        description: 'Preview all embedding changes without writing files or creating any commits.',
        icon: 'Eye',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'zigbee-rest',
    title: 'zigbee-rest',
    tagline: 'Local-first Zigbee control via REST API and CLI',
    description:
      'Go REST API and CLI for direct Zigbee device control via EZSP serial protocol — no Zigbee2MQTT or cloud dependencies required. Features real-time SSE device discovery, JSON-first CLI output for scripting, Swagger documentation, multi-profile support, and cross-platform binaries for Linux and macOS.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/zigbee-rest',
    tech: [{ name: 'Go', icon: 'go' }],
    features: [
      {
        title: 'Direct EZSP Protocol',
        description:
          'Communicates with Zigbee devices via serial EZSP protocol without MQTT brokers.',
        icon: 'Radio',
      },
      {
        title: 'REST API',
        description:
          'Full device management API with Swagger documentation and Gin-powered routing.',
        icon: 'Server',
      },
      {
        title: 'SSE Discovery',
        description:
          'Real-time Server-Sent Events streaming for device pairing and discovery event notifications.',
        icon: 'Wifi',
      },
      {
        title: 'JSON CLI',
        description: 'All CLI output is structured JSON to stdout for scripting and piping.',
        icon: 'Terminal',
      },
      {
        title: 'Agent Integration',
        description: 'AGENTS.md and Claude Code skill enable AI agents to control smart devices.',
        icon: 'Brain',
      },
      {
        title: 'Cross-Platform',
        description:
          'Pre-built binaries for Linux and macOS on both amd64 and arm64 architectures.',
        icon: 'Monitor',
      },
    ],
    hasDetailPage: false,
  },
  {
    slug: 'languide',
    title: 'Languide',
    tagline: 'Scenario-based language learning PDF generator',
    description:
      'Python CLI that generates comprehensive language learning PDFs from structured markdown chapters. Each guide covers 11 scenarios — greetings, restaurants, hotels, transport, emergencies — with pattern templates, politeness tiers, and CJK font support. AI-assisted chapter generation via Claude Code produces 50+ phrases per scenario.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/languide',
    tech: [{ name: 'Python', icon: 'python' }],
    features: [
      {
        title: 'Scenario Chapters',
        description:
          'Eleven structured chapters covering core phrases, transport, restaurants, and cultural guides.',
        icon: 'BookOpen',
      },
      {
        title: 'Pattern Templates',
        description:
          'Bracket-slot phrase patterns with substitutable vocabulary for flexible real-world usage.',
        icon: 'FileText',
      },
      {
        title: 'Politeness Tiers',
        description: 'Casual, polite, and very polite variants for every phrase collection.',
        icon: 'MessageSquare',
      },
      {
        title: 'PDF Generation',
        description:
          'Pandoc and XeLaTeX pipeline producing polished PDFs with full Unicode rendering.',
        icon: 'Printer',
      },
      {
        title: 'CJK Support',
        description:
          'Auto-detection and installation of CJK fonts for Japanese, Chinese, and Korean.',
        icon: 'Globe',
      },
      {
        title: 'AI Generation',
        description:
          'Claude Code skill automates full chapter generation with quality checklist validation.',
        icon: 'Brain',
      },
    ],
    hasDetailPage: false,
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
