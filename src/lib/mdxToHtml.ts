import { VISUAL_EMBEDS, type VisualEmbedName } from './visualEmbeds';

export interface PostFrontmatter {
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  heroImage?: string;
  shareText?: string;
  tags: string[];
}

interface MdxToHtmlOptions {
  /** Use h2 for sections (twitter) or h3 (linkedin) */
  headingLevel: 2 | 3;
}

/**
 * Convert MDX blog body to clean HTML.
 * Strips all MDX components, inlines citations, converts interactive visuals
 * to clickable preview images, and converts markdown formatting to HTML.
 */
export function mdxToHtml(body: string, options: MdxToHtmlOptions): string {
  let text = body;

  // 1. Strip import lines
  text = text.replace(/^import\s+.*$/gm, '');

  // 2. <PreviewLink client:load href="URL">Text</PreviewLink> → <a>
  text = text.replace(
    /<PreviewLink[^>]*\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/PreviewLink>/g,
    (_match, href: string, content: string) =>
      `<a href="${escapeAttr(href)}">${content.trim()}</a>`,
  );

  // 3. <Phonetic client:load ipa="X" /> → /X/
  text = text.replace(/<Phonetic[^>]*\s+ipa="([^"]*)"[^>]*\/>/g, '/$1/');

  // 4. <ScriptInline client:load letters="X" targetScript="Y" /> → (X in Y script)
  text = text.replace(
    /<ScriptInline[^>]*\s+letters="([^"]*)"[^>]*\s+targetScript="([^"]*)"[^>]*\/>/g,
    '($1 in $2 script)',
  );

  // 5. Interactive visuals → clickable preview images
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
      text = text.replace(
        new RegExp(`<${componentName}[^>]*\\/?>`, 'g'),
        `<a href="${escapeAttr(embedUrl)}"><img src="${escapeAttr(previewUrl)}" alt="${escapeAttr(meta.alt)}" style="max-width:100%"></a>`,
      );
    }
  }

  // 6. <BlockQuote author="A" source="S">Text</BlockQuote> → <blockquote>
  text = text.replace(
    /<BlockQuote[^>]*\s+author="([^"]*)"[^>]*\s+source="([^"]*)"[^>]*>([\s\S]*?)<\/BlockQuote>/g,
    (_match, author: string, source: string, content: string) =>
      `<blockquote>${content.trim()}<br><br>— ${author}, ${source}</blockquote>`,
  );

  // 7. <PullQuote>Text</PullQuote> → <blockquote><strong>
  text = text.replace(
    /<PullQuote>([\s\S]*?)<\/PullQuote>/g,
    (_match, content: string) => `<blockquote><strong>${content.trim()}</strong></blockquote>`,
  );

  // 8. <Aside label="L">Text</Aside> → <blockquote>
  text = text.replace(
    /<Aside(?:\s+label="([^"]*)")?[^>]*>([\s\S]*?)<\/Aside>/g,
    (_match, label: string | undefined, content: string) => {
      const heading = label || 'Side Note';
      return `<blockquote><strong>${heading}</strong><br><br>${content.trim()}</blockquote>`;
    },
  );

  // 9. <ExploreCard title="T">Content</ExploreCard> → heading + content
  const hTag = `h${options.headingLevel + 1}`;
  text = text.replace(
    /<ExploreCard[^>]*\s+title="([^"]*)"[^>]*>([\s\S]*?)<\/ExploreCard>/g,
    (_match, title: string, content: string) => `<${hTag}>${title}</${hTag}>\n\n${content.trim()}`,
  );

  // 10. <Collapsible label="L">Content</Collapsible> → <strong> + content
  text = text.replace(
    /<Collapsible[^>]*\s+label="([^"]*)"[^>]*>([\s\S]*?)<\/Collapsible>/g,
    (_match, label: string, content: string) => `<strong>${label}</strong>\n\n${content.trim()}`,
  );

  // 11. Parse <References> and replace <Cite> with inline links
  const citations = new Map<number, { text: string; url: string }>();
  const refsMatch = text.match(/<References\s+items=\{(\[[\s\S]*?\])\}\s*\/>/);
  if (refsMatch) {
    const itemRegex =
      /\{\s*id:\s*(\d+)\s*,\s*text:\s*(['"])(.*?)\2\s*,\s*url:\s*(['"])(.*?)\4\s*\}/g;
    for (const m of refsMatch[1].matchAll(itemRegex)) {
      citations.set(Number(m[1]), { text: m[3], url: m[5] });
    }
    text = text.replace(/<References\s+items=\{[\s\S]*?\}\s*\/>\s*/, '');
  }
  text = text.replace(/<Cite\s+id=\{(\d+)\}\s*\/>/g, (_match, idStr: string) => {
    const ref = citations.get(Number(idStr));
    return ref ? `<a href="${escapeAttr(ref.url)}">[${idStr}]</a>` : `[${idStr}]`;
  });

  // 12. Strip remaining self-closing JSX components
  text = text.replace(/<[A-Z]\w+[^>]*\/>/g, '');

  // 13. Strip client:* directives
  text = text.replace(/\s+client:(load|idle|visible)/g, '');

  // 14. Convert fenced code blocks to <pre><code> and protect from inline transforms
  const codeBlocks: string[] = [];
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const langAttr = lang ? ` data-lang="${lang}"` : '';
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code${langAttr}>${escaped.trimEnd()}</code></pre>`);
    return `ZCODEZ${idx}Z`;
  });

  // 14a. Convert inline code and protect from further transforms
  const inlineCode: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    const idx = inlineCode.length;
    inlineCode.push(`<code>${code}</code>`);
    return `ZINLINEZ${idx}Z`;
  });

  // 14b. Extract footnote definitions and replace inline references
  const footnotes = new Map<string, string>();
  text = text.replace(/^\[\^(\d+)\]:\s*(.+)$/gm, (_match, id: string, content: string) => {
    footnotes.set(id, content);
    return '';
  });
  if (footnotes.size > 0) {
    // Replace inline footnote references with superscript links
    text = text.replace(
      /\[\^(\d+)\]/g,
      (_match, id: string) => `<sup><a href="#fn-${id}" id="fnref-${id}">[${id}]</a></sup>`,
    );
    // Append footnotes section as a preserved block
    const fnEntries = Array.from(footnotes.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([id, content]) => `<li id="fn-${id}">${content}</li>`)
      .join('\n');
    const fnIdx = codeBlocks.length;
    codeBlocks.push(`<hr>\n<ol>\n${fnEntries}\n</ol>`);
    text += `\n\nZCODEZ${fnIdx}Z`;
  }

  // 15. Convert markdown headings to HTML
  const headingTag = `h${options.headingLevel}`;
  text = text.replace(/^##\s+(.+)$/gm, `<${headingTag}>$1</${headingTag}>`);
  // Strip any ### or deeper — flatten to same level
  text = text.replace(/^###\s+(.+)$/gm, `<${headingTag}>$1</${headingTag}>`);

  // 16. Convert markdown inline formatting to HTML
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, linkText: string, url: string) => `<a href="${escapeAttr(url)}">${linkText}</a>`,
  );

  // 17. Convert markdown horizontal rules
  text = text.replace(/^---$/gm, '<hr>');

  // 18. Protect block-level HTML from paragraph wrapping
  const preserved: string[] = [];
  text = text.replace(/<(pre|ol|ul|blockquote|hr|div)[\s>][\s\S]*?<\/\1>|<hr>/g, (match) => {
    const idx = preserved.length;
    preserved.push(match);
    return `ZBLOCKZ${idx}Z`;
  });

  // 19. Wrap paragraphs — split on double newlines, wrap non-tag blocks in <p>
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const htmlBlocks = blocks.map((block) => {
    if (/^Z(BLOCKZ|CODEZ)\d+Z$/.test(block)) return block;
    if (/^<(h[1-6]|hr|blockquote|a|img|p|div|ul|ol|pre)/i.test(block)) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  });

  let result = htmlBlocks.join('\n\n');

  // 20. Restore preserved blocks, code blocks, and inline code
  result = result.replace(/ZBLOCKZ(\d+)Z/g, (_match, idx: string) => preserved[Number(idx)]);
  result = result.replace(/ZCODEZ(\d+)Z/g, (_match, idx: string) => codeBlocks[Number(idx)]);
  result = result.replace(/ZINLINEZ(\d+)Z/g, (_match, idx: string) => inlineCode[Number(idx)]);

  return result;
}

/** Get the citations map from an MDX body for external use */
export function extractCitations(body: string): Map<number, { text: string; url: string }> {
  const citations = new Map<number, { text: string; url: string }>();
  const refsMatch = body.match(/<References\s+items=\{(\[[\s\S]*?\])\}\s*\/>/);
  if (refsMatch) {
    const itemRegex =
      /\{\s*id:\s*(\d+)\s*,\s*text:\s*(['"])(.*?)\2\s*,\s*url:\s*(['"])(.*?)\4\s*\}/g;
    for (const m of refsMatch[1].matchAll(itemRegex)) {
      citations.set(Number(m[1]), { text: m[3], url: m[5] });
    }
  }
  return citations;
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
