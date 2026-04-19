import { ExternalLink, FileText, Github, Star } from 'lucide-react';
import ShareButton from './ShareButton';
import StatusBadge, { type ProjectStatus } from './StatusBadge';

export interface ProjectHeroData {
  title: string;
  description: string;
  status: ProjectStatus;
  githubUrl: string;
  homepageUrl?: string;
  language?: string;
  stars: number;
  pushedAt: Date;
  year?: number;
  venue?: string;
  paperUrl?: string;
}

interface ProjectHeroProps {
  project: ProjectHeroData;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProjectHero({ project }: ProjectHeroProps) {
  return (
    <section className="pt-28 pb-12">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">{project.title}</h1>
        <StatusBadge status={project.status} />
      </div>

      {project.description && (
        <p className="mb-6 max-w-2xl text-lg text-muted-foreground">{project.description}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {project.year && <span>{project.year}</span>}
        {project.venue && <span>{project.venue}</span>}
        {project.language && <span>{project.language}</span>}
        {project.stars > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {project.stars}
          </span>
        )}
        <span>Updated {formatDate(project.pushedAt)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
        {project.homepageUrl && (
          <a
            href={project.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" />
            Homepage
          </a>
        )}
        {project.paperUrl && (
          <a
            href={project.paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            Paper
          </a>
        )}
        <ShareButton
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={project.title}
          description={project.description}
        />
      </div>
    </section>
  );
}
