const categoryLabels: Record<string, string> = {
  ai: 'AI & Agents',
  cli: 'CLI & DevEnv',
  development: 'Development',
  security: 'Security',
  visual: 'Visual & Branding',
  agent: 'Agents',
  general: 'General',
  infrastructure: 'Infrastructure',
};

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export interface SkillSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  type: 'skill' | 'agent';
}
