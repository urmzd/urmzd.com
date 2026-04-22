import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { calculateReadTime } from '../../lib/readTime';

const interRegular = readFileSync(join(process.cwd(), 'public/fonts/Inter-Regular.ttf'));
const interBold = readFileSync(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'));
const logoSvg = readFileSync(join(process.cwd(), 'public/images/logo-mark.svg'), 'utf-8');
const logoDataUri = `data:image/svg+xml;base64,${Buffer.from(logoSvg.replace('currentColor', '#F8C300')).toString('base64')}`;

// Pre-process author image: crop to square from center, resize to 96px (2x for retina), sRGB
const authorDataUriPromise = sharp(join(process.cwd(), 'public/images/author.png'))
  .resize(96, 96, { fit: 'cover', position: 'top' })
  .toColourspace('srgb')
  .removeAlpha()
  .png()
  .toBuffer()
  .then((buf) => `data:image/png;base64,${buf.toString('base64')}`);

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');
  const stories = await getCollection('stories');

  const blogPaths = posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      readTime: calculateReadTime(post.body || '').text,
      tags: post.data.tags,
      slug: `blog/${post.id}`,
    },
  }));

  const storyPaths = stories.map((story) => ({
    params: { slug: story.id },
    props: {
      title: story.data.title,
      description: story.data.description,
      pubDate: story.data.pubDate,
      readTime: calculateReadTime(story.body || '').text,
      tags: story.data.tags,
      slug: `creative-writing/${story.id}`,
    },
  }));

  const indexPath = {
    params: { slug: 'index' },
    props: {
      title: 'Urmzd Mukhammadnaim',
      description:
        'Software engineer based in Austin, Texas. Building tools that turn structured thinking into working software — from developer utilities and ML pipelines to interactive web experiences.',
      tags: [] as string[],
      slug: '',
    },
  };

  return [indexPath, ...blogPaths, ...storyPaths];
};

interface OGImageProps {
  title: string;
  description: string;
  pubDate?: Date;
  readTime?: string;
  tags: string[];
  slug: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const C = {
  bg: '#1a1a1e',
  cardBg: '#222226',
  cardBorder: '#2e2e33',
  text: '#fafafa',
  muted: '#a1a1aa',
  mutedSubtle: '#71717a',
  brand: '#F8C300',
  glowBg: '#2a2518',
} as const;

// biome-ignore lint/suspicious/noExplicitAny: satori vdom nodes
type Node = any;

function div(style: Record<string, unknown>, children: Node[]): Node {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children } };
}

function text(style: Record<string, unknown>, value: string): Node {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children: value } };
}

function img(src: string, w: number, h: number, style: Record<string, unknown> = {}): Node {
  return { type: 'img', props: { src, width: w, height: h, style } };
}

function OGImage(
  { title, description, pubDate, readTime, tags, slug }: OGImageProps,
  authorDataUri: string,
): Node {
  const pageUrl = slug ? `urmzd.com/${slug}` : 'urmzd.com';
  const hasMetadata = !!(pubDate && readTime);
  const displayTags = tags.slice(0, 4);
  const metaLine = hasMetadata ? `${formatDate(pubDate!)}  ·  ${readTime}` : '';

  // Tag pills joined with middot
  const tagText = displayTags.length > 0 ? displayTags.join('  ·  ') : '';

  // Bottom section children
  const bottomChildren: Node[] = [
    // Gold accent line
    div({ width: '120px', height: '2px', backgroundColor: C.brand, opacity: 0.5 }, []),
  ];

  if (tagText) {
    bottomChildren.push(
      text(
        {
          fontSize: '14px',
          color: C.mutedSubtle,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 400,
        },
        tagText,
      ),
    );
  }

  // Author row
  const authorInfoChildren: Node[] = [
    text({ fontSize: '18px', color: C.text, fontWeight: 500 }, 'Urmzd'),
  ];
  if (metaLine) {
    authorInfoChildren.push(
      text({ fontSize: '16px', color: C.mutedSubtle, fontWeight: 400 }, metaLine),
    );
  }
  authorInfoChildren.push(
    text({ fontSize: '15px', color: C.mutedSubtle, fontWeight: 400 }, pageUrl),
  );

  bottomChildren.push(
    div({ alignItems: 'center', gap: '14px' }, [
      // Avatar with gold ring
      div(
        {
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: `2px solid ${C.brand}`,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        },
        [img(authorDataUri, 48, 48, { borderRadius: '50%' })],
      ),
      // Author name + meta + url
      div({ flexDirection: 'column', gap: '2px' }, authorInfoChildren),
    ]),
  );

  return div(
    {
      height: '100%',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.bg,
      fontFamily: 'Inter',
      position: 'relative',
    },
    [
      // Background glow — top-right
      div(
        {
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          backgroundColor: C.glowBg,
          opacity: 0.6,
        },
        [],
      ),
      // Background glow — bottom-left
      div(
        {
          position: 'absolute',
          bottom: '-80px',
          left: '-80px',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          backgroundColor: '#1e2218',
          opacity: 0.5,
        },
        [],
      ),
      // Main card
      div(
        {
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '1120px',
          height: '550px',
          backgroundColor: C.cardBg,
          borderRadius: '20px',
          border: `1px solid ${C.cardBorder}`,
          padding: '48px 52px',
        },
        [
          // Top: logo + title + description
          div({ flexDirection: 'column', gap: '20px' }, [
            img(logoDataUri, 40, 40),
            text(
              {
                fontSize: '48px',
                fontWeight: 700,
                color: C.text,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                maxWidth: '900px',
              },
              title,
            ),
            text(
              {
                fontSize: '22px',
                color: C.muted,
                lineHeight: 1.5,
                maxWidth: '800px',
              },
              description,
            ),
          ]),
          // Bottom: accent line + tags + author
          div({ flexDirection: 'column', gap: '16px' }, bottomChildren),
        ],
      ),
    ],
  );
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description, pubDate, readTime, tags, slug } = props as OGImageProps;
  const authorDataUri = await authorDataUriPromise;

  // biome-ignore lint/suspicious/noExplicitAny: satori expects ReactNode but returns incompatible type
  const svg = await satori(
    OGImage({ title, description, pubDate, readTime, tags, slug }, authorDataUri) as any,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interRegular,
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
