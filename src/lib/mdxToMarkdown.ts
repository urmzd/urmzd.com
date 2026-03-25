import { VISUAL_EMBEDS, type VisualEmbedName } from './visualEmbeds';

export interface PostFrontmatter {
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  heroImage?: string;
  tags: string[];
}

export function mdxToMarkdown(body: string, frontmatter: PostFrontmatter): string {
  let md = body;

  // 1. Strip import lines
  md = md.replace(/^import\s+.*$/gm, '');

  // 2. <PreviewLink client:load href="URL">Text</PreviewLink> → [Text](URL)
  md = md.replace(
    /<PreviewLink[^>]*\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/PreviewLink>/g,
    (_match, href: string, text: string) => `[${text.trim()}](${href})`,
  );

  // 3. <Phonetic client:load ipa="X" /> → /X/
  md = md.replace(/<Phonetic[^>]*\s+ipa="([^"]*)"[^>]*\/>/g, '/$1/');

  // 4. <ScriptInline client:load letters="X" targetScript="Y" /> → (X in Y script)
  md = md.replace(
    /<ScriptInline[^>]*\s+letters="([^"]*)"[^>]*\s+targetScript="([^"]*)"[^>]*\/>/g,
    '($1 in $2 script)',
  );

  // 5. Interactive visuals → clickable preview images linking to embed pages
  {
    const SITE = 'https://urmzd.com';
    const componentToSlug: Record<string, string> = {};
    for (const [slug, meta] of Object.entries(VISUAL_EMBEDS)) {
      componentToSlug[meta.component] = slug;
    }
    for (const [componentName, slug] of Object.entries(componentToSlug)) {
      const meta = VISUAL_EMBEDS[slug as VisualEmbedName];
      const previewUrl = `${SITE}/images/visuals/${slug}.png`;
      const embedUrl = `${SITE}/embed/${slug}`;
      md = md.replace(
        new RegExp(`<${componentName}[^>]*\\/?>`, 'g'),
        `[![${meta.alt}](${previewUrl})](${embedUrl})`,
      );
    }
  }

  // 6. <BlockQuote author="A" source="S">Text</BlockQuote> → > Text\n>\n> — A, S
  md = md.replace(
    /<BlockQuote[^>]*\s+author="([^"]*)"[^>]*\s+source="([^"]*)"[^>]*>([\s\S]*?)<\/BlockQuote>/g,
    (_match, author: string, source: string, text: string) => {
      const trimmed = text.trim();
      const quoted = trimmed
        .split('\n')
        .map((line) => `> ${line.trimStart()}`)
        .join('\n');
      return `${quoted}\n>\n> — ${author}, ${source}`;
    },
  );

  // 7. <PullQuote>Text</PullQuote> → > **Text**
  md = md.replace(/<PullQuote>([\s\S]*?)<\/PullQuote>/g, (_match, text: string) => {
    const trimmed = text.trim();
    return `> **${trimmed}**`;
  });

  // 8. <Aside label="L">Text</Aside> → > **L**\n>\n> Text (default label: "Side Note")
  md = md.replace(
    /<Aside(?:\s+label="([^"]*)")?[^>]*>([\s\S]*?)<\/Aside>/g,
    (_match, label: string | undefined, text: string) => {
      const heading = label || 'Side Note';
      const trimmed = text.trim();
      const quoted = trimmed
        .split('\n')
        .map((line) => `> ${line.trimStart()}`)
        .join('\n');
      return `> **${heading}**\n>\n${quoted}`;
    },
  );

  // 9. <ExploreCard client:load title="T">Content</ExploreCard> → ### T\n\nContent
  md = md.replace(
    /<ExploreCard[^>]*\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/ExploreCard>/g,
    (_match, title: string, content: string) => `### ${title}\n\n${content.trim()}`,
  );

  // 10. <Collapsible label="L">Content</Collapsible> → **L**\n\nContent
  md = md.replace(
    /<Collapsible[^>]*\s+label="([^"]*)"[^>]*>([\s\S]*?)<\/Collapsible>/g,
    (_match, label: string, content: string) => `**${label}**\n\n${content.trim()}`,
  );

  // 11. Parse <References items={[...]} /> and replace <Cite id={N} /> with inline links
  const citations = new Map<number, { text: string; url: string }>();
  const refsMatch = md.match(/<References\s+items=\{(\[[\s\S]*?\])\}\s*\/>/);
  if (refsMatch) {
    const itemRegex =
      /\{\s*id:\s*(\d+)\s*,\s*text:\s*(['"])(.*?)\2\s*,\s*url:\s*(['"])(.*?)\4\s*\}/g;
    for (const m of refsMatch[1].matchAll(itemRegex)) {
      citations.set(Number(m[1]), { text: m[3], url: m[5] });
    }
    md = md.replace(/<References\s+items=\{[\s\S]*?\}\s*\/>\s*/, '');
  }
  md = md.replace(/<Cite\s+id=\{(\d+)\}\s*\/>/g, (_match, idStr: string) => {
    const ref = citations.get(Number(idStr));
    return ref ? `[[${idStr}]](${ref.url})` : `[${idStr}]`;
  });

  // 12. Strip remaining self-closing JSX components not already handled
  md = md.replace(/<[A-Z]\w+[^>]*\/>/g, '');

  // 13. Strip remaining client:load / client:idle / client:visible directives
  md = md.replace(/\s+client:(load|idle|visible)/g, '');

  // 14. Collapse 3+ consecutive blank lines to 2
  md = md.replace(/\n{3,}/g, '\n\n');

  // Build frontmatter YAML
  const yamlLines = ['---'];
  yamlLines.push(`title: ${JSON.stringify(frontmatter.title)}`);
  yamlLines.push(`description: ${JSON.stringify(frontmatter.description)}`);
  yamlLines.push(`pubDate: ${frontmatter.pubDate}`);
  if (frontmatter.updatedDate) {
    yamlLines.push(`updatedDate: ${frontmatter.updatedDate}`);
  }
  if (frontmatter.heroImage) {
    yamlLines.push(`heroImage: ${JSON.stringify(frontmatter.heroImage)}`);
  }
  if (frontmatter.tags.length > 0) {
    yamlLines.push(`tags: [${frontmatter.tags.map((t) => JSON.stringify(t)).join(', ')}]`);
  }
  yamlLines.push('---');

  return yamlLines.join('\n') + '\n' + md.trim() + '\n';
}
