import type { DemoConfig, ProjectFeature, ProjectTech } from './projects';

export type ResearchCategory = 'paper' | 'tooling';

export interface ResearchItem {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: ResearchCategory;
  year: number;
  venue?: string;
  tags: string[];
  githubUrl: string;
  paperUrl?: string;
  tech: string[];
  hasDetailPage: boolean;
  detailTech?: ProjectTech[];
  features?: ProjectFeature[];
  demo?: DemoConfig;
}

export const research: ResearchItem[] = [
  // ── Papers & Theses ──────────────────────────────────────────
  {
    slug: 'linear-gp-thesis',
    title: 'Investigating Linear Genetic Programming with Q-Learning Integration',
    tagline: 'Honours thesis on hybrid evolutionary and reinforcement learning',
    description:
      'Honours thesis exploring hybrid Linear Genetic Programming and Q-Learning for reinforcement learning and classification tasks. Evaluates modular LGP architectures on CartPole, MountainCar, and Iris benchmarks with automated hyperparameter optimization via Optuna.',
    category: 'paper',
    year: 2024,
    venue: 'Dalhousie University — Honours Thesis',
    tags: [
      'genetic programming',
      'reinforcement learning',
      'evolutionary computation',
      'Q-learning',
    ],
    githubUrl: 'https://github.com/urmzd/linear-gp',
    paperUrl: 'https://web.cs.dal.ca/~mheywood/Thesis/UMukhammadnaim.pdf',
    tech: ['Rust', 'Python'],
    hasDetailPage: true,
    detailTech: [
      { name: 'Rust', icon: 'rust' },
      { name: 'Python', icon: 'python' },
    ],
    features: [
      {
        title: 'Genetic Operators',
        description:
          'Crossover, mutation, and selection operators for evolving program populations.',
        icon: 'Dna',
      },
      {
        title: 'Benchmark Datasets',
        description: 'Built-in support for Iris and other standard classification benchmarks.',
        icon: 'FlaskConical',
      },
      {
        title: 'Experiment Tracking',
        description: 'Track fitness, diversity, and convergence across generations.',
        icon: 'BarChart3',
      },
      {
        title: 'Rust Performance',
        description: 'Core evolution engine written in Rust for maximum throughput.',
        icon: 'Cpu',
      },
      {
        title: 'Python Analysis',
        description:
          'Python scripting layer for experiment visualization and statistical analysis.',
        icon: 'Brain',
      },
      {
        title: 'Configurable Runs',
        description: 'Fine-tune population size, mutation rates, and tournament parameters.',
        icon: 'Settings',
      },
    ],
    demo: {
      kind: 'image',
      images: [
        {
          src: '/projects/linear-gp/iris_baseline.png',
          alt: 'Iris baseline experiment results',
          caption: 'Baseline',
        },
        {
          src: '/projects/linear-gp/iris_crossover.png',
          alt: 'Iris crossover experiment results',
          caption: 'Crossover',
        },
        {
          src: '/projects/linear-gp/iris_mutation.png',
          alt: 'Iris mutation experiment results',
          caption: 'Mutation',
        },
        {
          src: '/projects/linear-gp/iris_full.png',
          alt: 'Iris full experiment results',
          caption: 'Full Pipeline',
        },
      ],
    },
  },
  {
    slug: 'lepus-classifier',
    title: 'Optimal CNN Architectures for Small-Dataset Image Classification',
    tagline: 'Demonstrating data quantity as the bottleneck for deep learning',
    description:
      'Research project examining whether CNN image classifiers can achieve good performance on very small datasets. Using only 85 images of two Lepus genus species, demonstrates that data quantity remains the fundamental bottleneck for deep learning — even with optimal architecture choices.',
    category: 'paper',
    year: 2022,
    venue: 'Dalhousie University — Course Project',
    tags: ['computer vision', 'CNN', 'small-dataset learning', 'image classification'],
    githubUrl: 'https://github.com/urmzd/lepus-classifier',
    tech: ['Python', 'PyTorch', 'OpenCV'],
    hasDetailPage: false,
  },
  {
    slug: 'md-classifier',
    title: 'Disease Classification from Patient-Described Symptoms',
    tagline: 'Transformers and CNNs for medical self-diagnosis from natural language',
    description:
      'Deep learning system combining transformers and CNNs to classify diseases from natural language symptom descriptions. Compares One-Hot and FastText-based preprocessing pipelines, achieving 90% recall on medical condition prediction.',
    category: 'paper',
    year: 2022,
    venue: 'Dalhousie University — Course Project',
    tags: ['NLP', 'medical diagnosis', 'transformers', 'CNN', 'disease classification'],
    githubUrl: 'https://github.com/urmzd/md-classifier',
    tech: ['Python', 'Keras', 'NLTK', 'Transformers'],
    hasDetailPage: false,
  },

  // ── Research Tooling ─────────────────────────────────────────
  {
    slug: 'linear-gp-framework',
    title: 'Linear GP Framework',
    tagline: 'Production-grade Rust framework for LGP research',
    description:
      'Production-grade Rust framework for Linear Genetic Programming research. Features modular trait-based architecture, Rayon-powered parallel fitness evaluation, Optuna hyperparameter optimization, and Python CLI tools for batch experiments and visualization.',
    category: 'tooling',
    year: 2024,
    tags: ['framework', 'genetic programming', 'evolutionary algorithms', 'optimization'],
    githubUrl: 'https://github.com/urmzd/linear-gp',
    tech: ['Rust', 'Python', 'Docker'],
    hasDetailPage: false,
  },
];

export function getResearchItem(slug: string): ResearchItem | undefined {
  return research.find((r) => r.slug === slug);
}
