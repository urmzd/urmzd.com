import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load fonts at module level for reuse
const interRegular = readFileSync(
  join(process.cwd(), "public/fonts/Inter-Regular.ttf")
);
const interBold = readFileSync(
  join(process.cwd(), "public/fonts/Inter-Bold.ttf")
);

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog");

  // Generate paths for all blog posts plus the index page
  const blogPaths = posts.map((post) => ({
    params: { slug: post.id },
    props: {
      title: post.data.title,
      description: post.data.description,
    },
  }));

  // Add index page
  const indexPath = {
    params: { slug: "index" },
    props: {
      title: "urmzd.com",
      description: "Personal website of urmzd",
    },
  };

  return [indexPath, ...blogPaths];
};

interface OGImageProps {
  title: string;
  description: string;
}

function OGImage({ title, description }: OGImageProps) {
  return {
    type: "div",
    props: {
      style: {
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        backgroundColor: "#09090b",
        padding: "60px",
        fontFamily: "Inter",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              gap: "24px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "56px",
                    fontWeight: 700,
                    color: "#fafafa",
                    lineHeight: 1.2,
                    maxWidth: "900px",
                  },
                  children: title,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "28px",
                    color: "#a1a1aa",
                    lineHeight: 1.4,
                    maxWidth: "800px",
                  },
                  children: description,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "32px",
                    color: "#71717a",
                    fontWeight: 500,
                  },
                  children: "urmzd.com",
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
  const { title, description } = props as { title: string; description: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(OGImage({ title, description }) as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Inter",
        data: interRegular,
        weight: 400,
        style: "normal",
      },
      {
        name: "Inter",
        data: interBold,
        weight: 700,
        style: "normal",
      },
    ],
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
