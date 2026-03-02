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
    title: 'Reinforced Linear Genetic Programming',
    tagline: 'Using Q-Learning to automate register-action assignments in LGP',
    description:
      'Proposes Reinforced Linear Genetic Programming (RLGP), a novel hybrid that layers Q-Learning on top of LGP to learn optimal register-action assignments — eliminating the need for manual mapping. Evaluated on OpenAI Gym CartPole-v1 and MountainCar-v0 benchmarks. LGP achieved a mean reward of 454 on CartPole; RLGP solved the task but plateaued early at 213, suggesting the Q-Learning exploration-exploitation balance needs further tuning.',
    category: 'paper',
    year: 2023,
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
    title:
      'The Lepus Classifier: Exploring Image Classification with Convolutional Neural Networks',
    tagline: 'CNN image classification on a 85-image dataset of rabbits and hares',
    description:
      'Examines methods to improve CNN performance without large datasets or specialized hardware. Trained on just 85 web-scraped images of Eastern cottontail rabbits and European hares, using Stratified K-Fold Cross Validation to handle the small, unbalanced dataset. Best configuration achieved 0.647 test accuracy (F1 0.575, precision 0.8, recall 0.625) with SGD+momentum and batch size 2. Demonstrates that even with optimal architecture choices and dropout regularization, data quantity remains the fundamental bottleneck.',
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
    title: 'Classification of Ailments Given Description of Symptoms',
    tagline: 'CNN-based medical condition prediction from natural language symptom descriptions',
    description:
      'Addresses the challenge of preliminary medical self-diagnosis by developing a CNN that returns the most probable condition given a natural language symptom description. Compares two preprocessing pipelines — One-Hot Encoding (56x4210 word-stem matrix) and unsupervised FastText embeddings — on data sourced from UpToDate and Mayo Clinic. The One-Hot CNN achieved 90% recall, with perfect precision on migraines and tetanus; FastText underperformed due to semantic information loss during processing.',
    category: 'paper',
    year: 2022,
    venue: 'Dalhousie University — Course Project',
    tags: ['NLP', 'medical diagnosis', 'CNN', 'disease classification'],
    githubUrl: 'https://github.com/urmzd/md-classifier',
    tech: ['Python', 'Keras', 'NLTK'],
    hasDetailPage: false,
  },

  // ── Research Tooling ─────────────────────────────────────────
  {
    slug: 'linear-gp-framework',
    title: 'linear-gp',
    tagline: 'Memory-safe Rust framework for LGP experimentation',
    description:
      'Open-source framework introduced alongside the RLGP thesis, written in memory-safe Rust for extensible LGP experimentation. Provides a modular trait-based architecture, Rayon-powered parallel fitness evaluation, Optuna hyperparameter optimization with PostgreSQL backend, and Python CLI tools for batch experiments, visualization, and analysis.',
    category: 'tooling',
    year: 2023,
    tags: ['framework', 'genetic programming', 'evolutionary algorithms', 'optimization'],
    githubUrl: 'https://github.com/urmzd/linear-gp',
    tech: ['Rust', 'Python', 'Docker'],
    hasDetailPage: false,
  },
];

export function getResearchItem(slug: string): ResearchItem | undefined {
  return research.find((r) => r.slug === slug);
}
