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

  // 5. <WelcomeTimeline ... /> → placeholder
  md = md.replace(
    /<WelcomeTimeline[^>]*\/>/g,
    '*[Interactive timeline — visit the original post to view]*',
  );

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

  // 11. Strip remaining client:load / client:idle directives
  md = md.replace(/\s+client:(load|idle)/g, '');

  // 12. Collapse 3+ consecutive blank lines to 2
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
