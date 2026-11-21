import { ArrowUpRight, Star } from 'lucide-react';
import { useState } from 'react';
import StatusBadge, { type ProjectStatus } from './StatusBadge';

export interface ProjectCardData {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  language?: string;
  href?: string;
  image?: string;
  stars?: number;
  /** ISO date of the last push. */
  updated?: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
  /** Show the preview strip. Off for text-first listings such as research. */
  media?: boolean;
}

const MAX_CHIPS = 4;

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

function Preview({ project }: { project: ProjectCardData }) {
  const [failed, setFailed] = useState(false);

  if (!project.image || failed) {
    return (
      <div className="project-card-media project-card-placeholder" aria-hidden="true">
        <span className="project-card-monogram">{project.language ?? project.title}</span>
      </div>
    );
  }

  return (
    <div className="project-card-media">
      <img
        src={project.image}
        alt={`Preview of ${project.title}`}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function ProjectCard({ project, media = true }: ProjectCardProps) {
  const chips = [project.language, ...project.tags].filter(Boolean) as string[];
  const href = project.href ?? `/projects/${project.slug}`;

  return (
    <a href={href} className="project-card group flex h-full flex-col overflow-hidden !p-0">
      {media && <Preview project={project} />}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
            {project.title}
            {project.status === 'archived' && <StatusBadge status="archived" />}
          </h3>
          <ArrowUpRight
            className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>

        {(project.updated || (project.stars ?? 0) > 0) && (
          <p className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
            {project.updated && (
              <span>
                Updated <time dateTime={project.updated}>{formatUpdated(project.updated)}</time>
              </span>
            )}
            {(project.stars ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">Stars:</span>
                {project.stars}
              </span>
            )}
          </p>
        )}

        {project.description && (
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
        )}

        {chips.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2">
            {chips.slice(0, MAX_CHIPS).map((chip) => (
              <span key={chip} className="tech-badge">
                {chip}
              </span>
            ))}
            {chips.length > MAX_CHIPS && (
              <span className="tech-badge">+{chips.length - MAX_CHIPS}</span>
            )}
          </div>
        )}
      </div>
    </a>
  );
}
