import { Github } from 'lucide-react';
import type { Project } from '@/data/projects';
import ShareButton from './ShareButton';

interface ProjectHeroProps {
  project: Project;
}

export default function ProjectHero({ project }: ProjectHeroProps) {
  return (
    <section className="pt-28 pb-12">
      <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">{project.title}</h1>

      <p className="mb-6 max-w-2xl text-lg text-muted-foreground">{project.tagline}</p>

      <div className="flex gap-3">
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Github className="h-4 w-4" />
          View on GitHub
        </a>
        <ShareButton
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={project.title}
          description={project.tagline}
        />
      </div>
    </section>
  );
}
