'use client';

import { ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import type { Project } from '@/data/projects';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <motion.a
      href={project.hasDetailPage ? `/projects/${project.slug}` : project.githubUrl}
      target={project.hasDetailPage ? undefined : '_blank'}
      rel={project.hasDetailPage ? undefined : 'noopener noreferrer'}
      className="project-card group block"
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <StatusBadge status={project.status} />
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-foreground">{project.title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{project.tagline}</p>

      <div className="flex flex-wrap gap-2">
        {project.tech.slice(0, 5).map((t) => (
          <span key={t.name} className="tech-badge">
            {t.name}
          </span>
        ))}
        {project.tech.length > 5 && <span className="tech-badge">+{project.tech.length - 5}</span>}
      </div>
    </motion.a>
  );
}
