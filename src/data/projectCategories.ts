/**
 * Project categories for urmzd.com/projects.
 *
 * Order here is the order sections render in. A repo's category comes from, in
 * order: `category` in its SHOWCASE.md frontmatter, the explicit map below, then
 * the first rule whose topics match. Anything unmatched lands in Developer tools.
 */
export const CATEGORIES = [
  {
    id: 'agents',
    label: 'Agents & AI',
    blurb: 'Agent platforms, SDKs, memory and the protocols between them.',
  },
  {
    id: 'devtools',
    label: 'Developer tools',
    blurb: 'CLIs, generators and release tooling I use every day.',
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    blurb: 'Durable execution, pipelines and the plumbing underneath.',
  },
  {
    id: 'ml',
    label: 'Machine learning',
    blurb: 'Interpretable models, evolutionary search and RL environments.',
  },
  {
    id: 'learning',
    label: 'Learning & apps',
    blurb: 'Courses, study tools, games and small applications.',
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

const DEFAULT_CATEGORY: CategoryId = 'devtools';

/** Repos whose topics would place them in the wrong section. */
const EXPLICIT: Record<string, CategoryId> = {
  'lazyspeak.nvim': 'agents',
  'zigbee-skill': 'agents',
  whiteboardy: 'learning',
  agentspec: 'devtools',
  incipit: 'devtools',
  dotfiles: 'devtools',
  broadcast: 'devtools',
  'urmzd.com': 'learning',
};

const RULES: { id: CategoryId; topics: string[] }[] = [
  {
    id: 'learning',
    topics: [
      'education',
      'open-education',
      'educational',
      'language-learning',
      'game-development',
      'android',
      'mobile-development',
    ],
  },
  {
    id: 'ml',
    topics: [
      'machine-learning',
      'deep-learning',
      'reinforcement-learning',
      'genetic-programming',
      'interpretable-ml',
      'pytorch',
      'gymnasium',
    ],
  },
  {
    id: 'agents',
    topics: [
      'ai-agents',
      'agents',
      'agent-platform',
      'agent-memory',
      'agent-orchestration',
      'llm',
      'mcp',
      'rag',
      'research-agent',
      'local-llm',
    ],
  },
  {
    id: 'infra',
    topics: [
      'durable-execution',
      'stream-processing',
      'data-pipeline',
      'workflow',
      'event-sourcing',
    ],
  },
];

const KNOWN = new Set<string>(CATEGORIES.map((c) => c.id));

export function categoryFor(slug: string, topics: string[], override?: string): CategoryId {
  if (override && KNOWN.has(override)) return override as CategoryId;
  if (EXPLICIT[slug]) return EXPLICIT[slug];
  for (const rule of RULES) {
    if (rule.topics.some((t) => topics.includes(t))) return rule.id;
  }
  return DEFAULT_CATEGORY;
}
