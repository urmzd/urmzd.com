import { ExternalLink } from 'lucide-react';
import type { Project } from '@/data/projects';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a
      href={project.hasDetailPage ? `/projects/${project.slug}` : project.githubUrl}
      target={project.hasDetailPage ? undefined : '_blank'}
      rel={project.hasDetailPage ? undefined : 'noopener noreferrer'}
      className="project-card group block"
    >
      <h3 className="mb-1 flex items-center justify-between text-lg font-semibold text-foreground">
        {project.title}
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">{project.tagline}</p>

      <div className="flex flex-wrap gap-2">
        {project.tech.slice(0, 5).map((t) => (
          <span key={t.name} className="tech-badge">
            {t.name}
          </span>
        ))}
        {project.tech.length > 5 && <span className="tech-badge">+{project.tech.length - 5}</span>}
      </div>
    </a>
  );
}
