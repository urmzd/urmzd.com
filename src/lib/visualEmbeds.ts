export const VISUAL_EMBEDS = {
  'critical-thinking-loop': {
    component: 'CriticalThinkingLoop',
    alt: 'Interactive diagram: Question, Research, Validate, Reflect cycle',
  },
  'first-principles': {
    component: 'FirstPrinciplesVisual',
    alt: 'Interactive visual: stripping assumptions to reveal foundational truths',
  },
  'confirmation-bias': {
    component: 'ConfirmationBiasVisual',
    alt: 'Interactive visual: evidence cards showing how confirmation bias filters contradicting data',
  },
  extrapolation: {
    component: 'ExtrapolationVisual',
    alt: 'Interactive chart: linear regression overshooting a nonlinear trend when projected beyond observed data',
  },
  consilience: {
    component: 'ConsilienceVisual',
    alt: 'Interactive visual: independent sources converging on the same conclusion',
  },
  'search-landscape': {
    component: 'SearchLandscapeVisual',
    alt: 'Interactive visual: navigating a solution landscape with local and global optima',
  },
  'gp-evolution': {
    component: 'GPEvolutionVisualizer',
    alt: 'Interactive simulation: genetic evolution across generations with selection, crossover, and mutation',
  },
  'chat-demo': {
    component: 'ChatDemo',
    alt: 'Interactive demo: a chatbot exchange showing system prompt, user message, and model response',
  },
  'welcome-timeline': {
    component: 'WelcomeTimeline',
    alt: 'Interactive timeline of welcome milestones',
  },
} as const;

export type VisualEmbedName = keyof typeof VISUAL_EMBEDS;
