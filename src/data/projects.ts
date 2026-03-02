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
    slug: 'resume-generator',
    title: 'Resume Generator',
    tagline: 'Multi-format resumes from structured data',
    description:
      'A desktop and CLI application that transforms YAML, JSON, TOML, or Markdown resume definitions into beautifully formatted PDF, HTML, DOCX, LaTeX, and Markdown output. Built with Go for the processing pipeline and React for the desktop GUI.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/resume-generator',
    tech: [
      { name: 'Go', icon: 'go' },
      { name: 'React 19', icon: 'react' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'Wails v2', icon: 'wails' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' },
      { name: 'Cobra', icon: 'go' },
      { name: 'Rod', icon: 'googlechrome' },
    ],
    features: [
      {
        title: 'Multi-Format Input',
        description:
          'Define your resume in YAML, JSON, TOML, or Markdown — whichever fits your workflow.',
        icon: 'FileInput',
      },
      {
        title: 'Rich Output Formats',
        description: 'Export to PDF, HTML, DOCX, LaTeX, or Markdown with a single command.',
        icon: 'FileOutput',
      },
      {
        title: 'Desktop GUI',
        description:
          'Native desktop app built with Wails and React for a seamless editing experience.',
        icon: 'Monitor',
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
        title: 'Live Preview',
        description: 'Headless Chrome rendering via Rod for pixel-perfect PDF generation.',
        icon: 'Eye',
      },
    ],
    hasDetailPage: true,
  },
  {
    slug: 'semantic-release',
    title: 'Semantic Release',
    tagline: 'Automated versioning and changelog generation',
    description:
      'A Rust-based tool for automated semantic versioning and changelog generation based on conventional commits. Analyzes your git history, determines the next version bump, and generates changelogs — all without leaving the terminal.',
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
    tagline: 'Generate clients and servers from OpenAPI specs',
    description:
      'A code generator that produces typed clients and server stubs from OpenAPI specifications, with backends for multiple languages. Point it at a spec and get production-ready, type-safe code.',
    status: 'active',
    githubUrl: 'https://github.com/urmzd/openapi-generator',
    tech: [
      { name: 'Rust', icon: 'rust' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'React', icon: 'react' },
      { name: 'Python', icon: 'python' },
    ],
    features: [
      {
        title: 'Multi-Language Output',
        description:
          'Generate typed clients for TypeScript, Python, Rust, and more from a single spec.',
        icon: 'Code',
      },
      {
        title: 'Type Safety',
        description: 'Produces fully typed code with proper interfaces and validation.',
        icon: 'Shield',
      },
      {
        title: 'Server Stubs',
        description: 'Generate server scaffolding alongside client code for rapid API development.',
        icon: 'Server',
      },
      {
        title: 'OpenAPI 3.x',
        description: 'Full support for OpenAPI 3.0 and 3.1 specifications.',
        icon: 'FileText',
      },
      {
        title: 'Customizable Templates',
        description: 'Override code generation templates to match your project conventions.',
        icon: 'Settings',
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
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
