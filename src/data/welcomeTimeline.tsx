import PreviewLink from '@/components/PreviewLink';
import TimelineImage from '@/components/TimelineImage';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface Subsection {
  label: string;
  content: React.ReactNode;
}

interface TimelineEntryData {
  title: string;
  compact?: boolean;
  subsections?: Subsection[];
}

export const welcomeTimelineData: TimelineEntryData[] = [
  {
    title: '2000',
    subsections: [
      {
        label: 'Origin',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
              Born in Dushanbe, Tajikistan.
            </p>
            <TimelineImage
              src="/images/welcome/020_tajikistan.webp"
              alt="Tajikistan"
              caption="Dushanbe, Tajikistan"
            />
          </>
        ),
      },
    ],
  },
  {
    title: '2006',
    subsections: [
      {
        label: 'Relocation',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
              Moved to Halifax, Nova Scotia.
            </p>
            <TimelineImage
              src="/images/welcome/021_halifax.webp"
              alt="Halifax"
              caption="Halifax, Nova Scotia"
            />
          </>
        ),
      },
    ],
  },
  {
    title: '2008',
    subsections: [
      {
        label: 'Relocation',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
              Moved to Toronto, Ontario.
            </p>
            <TimelineImage
              src="/images/welcome/023_toronto.webp"
              alt="Toronto"
              caption="Toronto, Ontario"
            />
          </>
        ),
      },
    ],
  },
  {
    title: '2010',
    subsections: [
      {
        label: 'Creative',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Created a YouTube channel and started my short stint as a Graphics Designer and Video
              Effects Editor.
            </p>
            <YouTubeEmbed id="dTXesih2y7A" title="Graphics design work" />
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
              <PreviewLink href="https://www.behance.net/gallery/243044625/Title-Sequence-%28Intro%29">
                Title Sequences
              </PreviewLink>
              <PreviewLink href="https://www.behance.net/gallery/144658347/3D-Realism">
                3D Realism
              </PreviewLink>
              <PreviewLink href="https://www.behance.net/gallery/144658193/Low-Polygon">
                Low Polygon
              </PreviewLink>
            </div>
          </>
        ),
      },
    ],
  },
  {
    title: '2014',
    compact: true,
    subsections: [
      {
        label: 'Martial Arts',
        content: (
          <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400">
            Started{' '}
            <PreviewLink href="https://en.wikipedia.org/wiki/Muay_Thai">Muay Thai</PreviewLink>
          </p>
        ),
      },
    ],
  },
  {
    title: '2015',
    subsections: [
      {
        label: 'Competition',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Competed for the first time in Muay Thai.
            </p>
            <YouTubeEmbed id="OiWDNeRD8u8" title="First Muay Thai competition" />
          </>
        ),
      },
    ],
  },
  {
    title: '2018',
    subsections: [
      {
        label: 'Competition',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Had my last amateur Muay Thai fight.
            </p>
            <YouTubeEmbed id="3tH2AivVQDQ" title="Last Muay Thai fight" />
          </>
        ),
      },
      {
        label: 'Education',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Went to Dalhousie University out in Halifax, Nova Scotia to pursue Computer Science &
              Mathematics.
            </p>
            <TimelineImage
              src="/images/welcome/026_dalhousie.webp"
              alt="Dalhousie University"
              caption="Dalhousie University, Halifax"
            />
          </>
        ),
      },
    ],
  },
  {
    title: '2021',
    compact: true,
    subsections: [
      {
        label: 'Martial Arts',
        content: (
          <p className="text-base md:text-lg text-neutral-600 dark:text-neutral-400">
            Started{' '}
            <PreviewLink href="https://en.wikipedia.org/wiki/Brazilian_jiu-jitsu">
              Brazilian Jiu-Jitsu
            </PreviewLink>
          </p>
        ),
      },
    ],
  },
  {
    title: '2022',
    subsections: [
      {
        label: 'Competition',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Competed for the first time in Brazilian Jiu-Jitsu.
            </p>
            <YouTubeEmbed id="CbufTZ4ab8o" title="First BJJ competition" />
          </>
        ),
      },
    ],
  },
  {
    title: '2023',
    subsections: [
      {
        label: 'Education',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              Graduated from Dalhousie University in May with a Bachelor of Computer Science with
              Honours, a minor in Mathematics, and a certificate in Artificial Intelligence &
              Intelligent Systems. During my time at Dalhousie I connected and worked with amazing
              people through internships, contracts, and projects.
            </p>
            <PreviewLink href="https://www.arxiv.org/abs/2601.09736">Honors Thesis</PreviewLink>
          </>
        ),
      },
      {
        label: 'Competition',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base mb-4">
              By the end of the year, I had dominated at the BJJ tournaments and earned my blue
              belt. This is one of the first tournaments where I was able to get 4 straight
              submissions — receiving my first gold medal.
            </p>
            <YouTubeEmbed id="Pk-F9U032Nc" title="BJJ tournament - first win" />
          </>
        ),
      },
    ],
  },
  {
    title: '2024',
    subsections: [
      {
        label: 'Travel',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
              Started travelling. I&apos;ve been to 9 different countries since February and hope to
              learn about more cultures and study many more languages.
            </p>
            <TimelineImage
              src="/images/welcome/014_mountain.webp"
              alt="Travelling"
              caption="Travelling the world"
            />
          </>
        ),
      },
      {
        label: 'Relocation',
        content: (
          <>
            <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
              Moved to Austin, Texas.
            </p>
            <TimelineImage
              src="/images/welcome/022_austin.webp"
              alt="Austin, Texas"
              caption="Austin, Texas"
            />
          </>
        ),
      },
    ],
  },
  {
    title: 'Now',
    subsections: [
      {
        label: 'Present',
        content: (
          <p className="text-neutral-800 dark:text-neutral-200 text-sm md:text-base">
            Building things and writing about it :)
          </p>
        ),
      },
    ],
  },
];
