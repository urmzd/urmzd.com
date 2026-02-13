import { getCollection } from 'astro:content';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { calculateReadTime } from '../../lib/readTime';

// Load fonts at module level for reuse
const interRegular = readFileSync(join(process.cwd(), 'public/fonts/Inter-Regular.ttf'));
const interBold = readFileSync(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'));

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('blog');

  // Generate paths for all blog posts plus the index page
  const blogPaths = posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      readTime: calculateReadTime(post.body || '').text,
    },
  }));

  // Add index page
  const indexPath = {
    params: { slug: 'index' },
    props: {
      title: 'urmzd.com',
      description: 'Personal website of urmzd',
    },
  };

  return [indexPath, ...blogPaths];
};

interface OGImageProps {
  title: string;
  description: string;
  pubDate?: Date;
  readTime?: string;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function OGImage({ title, description, pubDate, readTime }: OGImageProps) {
  const metadataText = pubDate && readTime ? `${formatDate(pubDate)} · ${readTime}` : undefined;
  return {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        backgroundColor: '#09090b',
        padding: '60px',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column' as const,
              gap: '24px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '56px',
                    fontWeight: 700,
                    color: '#fafafa',
                    lineHeight: 1.2,
                    maxWidth: '900px',
                  },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    color: '#a1a1aa',
                    lineHeight: 1.4,
                    maxWidth: '800px',
                  },
                  children: description,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            },
            children: [
              metadataText
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        color: '#71717a',
                        fontWeight: 400,
                      },
                      children: metadataText,
                    },
                  }
                : {
                    type: 'div',
                    props: {
                      style: { display: 'flex' },
                      children: [],
                    },
                  },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '32px',
                    color: '#71717a',
                    fontWeight: 500,
                  },
                  children: 'urmzd.com',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export const GET: APIRoute = async ({ props }) => {
  const { title, description, pubDate, readTime } = props as OGImageProps;

  // biome-ignore lint/suspicious/noExplicitAny: satori expects ReactNode but returns incompatible type
  const svg = await satori(OGImage({ title, description, pubDate, readTime }) as any, {
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
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
