import {
  Activity,
  BarChart3,
  Brain,
  Code,
  Cpu,
  Dna,
  Eye,
  FileInput,
  FileOutput,
  FileText,
  FlaskConical,
  GitBranch,
  Github,
  Globe,
  Image,
  Layers,
  Layout,
  Monitor,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Shuffle,
  Tag,
  Terminal,
  Zap,
} from 'lucide-react';
import type { ProjectFeature } from '@/data/projects';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileInput,
  FileOutput,
  Monitor,
  Terminal,
  Layout,
  Eye,
  GitBranch,
  Tag,
  FileText,
  Zap,
  Settings,
  Code,
  Layers,
  BarChart3,
  Github,
  Activity,
  Cpu,
  Brain,
  Dna,
  FlaskConical,
  Shield,
  Server,
  RefreshCw,
  Image,
  Globe,
  Shuffle,
};

interface FeatureGridProps {
  features: ProjectFeature[];
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <section className="py-12">
      <h2 className="mb-8 text-2xl font-bold">Features</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = iconMap[feature.icon];
          return (
            <div key={feature.title} className="feature-card">
              {Icon && (
                <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
