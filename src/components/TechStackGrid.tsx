'use client';

import {
  SiDocker,
  SiGithubactions,
  SiGo,
  SiGooglechrome,
  SiKeras,
  SiNodedotjs,
  SiOpencv,
  SiPostgresql,
  SiPython,
  SiPytorch,
  SiReact,
  SiRust,
  SiSqlite,
  SiTailwindcss,
  SiTypescript,
} from '@icons-pack/react-simple-icons';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import type { ProjectTech } from '@/data/projects';

const iconMap: Record<string, React.ReactNode> = {
  go: <SiGo className="h-8 w-8" />,
  react: <SiReact className="h-8 w-8" />,
  typescript: <SiTypescript className="h-8 w-8" />,
  tailwindcss: <SiTailwindcss className="h-8 w-8" />,
  googlechrome: <SiGooglechrome className="h-8 w-8" />,
  rust: <SiRust className="h-8 w-8" />,
  python: <SiPython className="h-8 w-8" />,
  nodedotjs: <SiNodedotjs className="h-8 w-8" />,
  sqlite: <SiSqlite className="h-8 w-8" />,
  githubactions: <SiGithubactions className="h-8 w-8" />,
  pytorch: <SiPytorch className="h-8 w-8" />,
  opencv: <SiOpencv className="h-8 w-8" />,
  keras: <SiKeras className="h-8 w-8" />,
  docker: <SiDocker className="h-8 w-8" />,
  postgresql: <SiPostgresql className="h-8 w-8" />,
  wails: <span className="text-2xl font-bold">W</span>,
  nltk: <span className="text-2xl font-bold">N</span>,
};

interface TechStackGridProps {
  tech: ProjectTech[];
}

export default function TechStackGrid({ tech }: TechStackGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="container mx-auto px-4 py-12">
      <h2 className="mb-8 text-2xl font-bold">Tech Stack</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tech.map((t, i) => (
          <motion.div
            key={t.name}
            className="tech-stack-card group"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="mb-2 text-muted-foreground transition-colors group-hover:text-foreground">
              {iconMap[t.icon] ?? <span className="text-2xl font-bold">{t.name[0]}</span>}
            </div>
            <span className="text-sm font-medium">{t.name}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
