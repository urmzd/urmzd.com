'use client';

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
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
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
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">Features</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => {
          const Icon = iconMap[feature.icon];
          return (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {Icon && (
                <div className="mb-3 inline-flex rounded-lg border border-border p-2 text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
