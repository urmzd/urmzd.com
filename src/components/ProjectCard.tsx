import { ExternalLink } from 'lucide-react';
import StatusBadge, { type ProjectStatus } from './StatusBadge';

export interface ProjectCardData {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  language?: string;
  href?: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const chips = [project.language, ...project.tags].filter(Boolean) as string[];
  const href = project.href ?? `/projects/${project.slug}`;

  return (
    <a href={href} className="project-card group block">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {project.title}
          {project.status === 'archived' && <StatusBadge status="archived" />}
        </h3>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {project.description && (
        <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.slice(0, 6).map((chip) => (
            <span key={chip} className="tech-badge">
              {chip}
            </span>
          ))}
          {chips.length > 6 && <span className="tech-badge">+{chips.length - 6}</span>}
        </div>
      )}
    </a>
  );
}
