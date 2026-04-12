/**
 * Remark plugin that transforms Obsidian-compatible callout syntax into
 * styled HTML matching our existing React components (BlockQuote, PullQuote, Aside).
 *
 * Supported callout types:
 *   > [!quote] Author, *Source*
 *   > quote text
 *
 *   > [!important]
 *   > pull quote text
 *
 *   > [!note] Optional Label
 *   > aside text
 *
 * These render identically to the JSX components they replace, and also
 * render natively in Obsidian as styled callouts.
 */
import type { Blockquote, Html, Paragraph, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const CALLOUT_REGEX = /^\[!(\w+)\]\s*(.*)?$/;

function extractCalloutInfo(
  node: Blockquote,
): { type: string; meta: string; bodyStartIndex: number } | null {
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== 'paragraph') return null;

  const firstInline = firstChild.children[0];
  if (!firstInline || firstInline.type !== 'text') return null;

  const lines = firstInline.value.split('\n');
  const match = lines[0].match(CALLOUT_REGEX);
  if (!match) return null;

  const type = match[1].toLowerCase();
  const meta = (match[2] || '').trim();

  // Remove the callout line from the text node
  if (lines.length > 1) {
    firstInline.value = lines.slice(1).join('\n');
    return { type, meta, bodyStartIndex: 0 };
  }

  // The callout marker was the only text in this inline — body starts at next child or next block child
  firstChild.children.splice(0, 1);
  // Remove leading breaks after the callout line
  while (firstChild.children[0]?.type === 'break') {
    firstChild.children.splice(0, 1);
  }

  if (firstChild.children.length === 0) {
    // Entire first paragraph was just the callout line — body is the remaining block children
    return { type, meta, bodyStartIndex: 1 };
  }

  return { type, meta, bodyStartIndex: 0 };
}

function blockquoteChildrenToHtml(node: Blockquote, startIndex: number): string {
  const parts: string[] = [];
  for (let i = startIndex; i < node.children.length; i++) {
    parts.push(nodeToHtml(node.children[i]));
  }
  return parts.join('\n');
}

function nodeToHtml(node: any): string {
  if (node.type === 'text') return escapeHtml(node.value);
  if (node.type === 'break') return '<br>';
  if (node.type === 'emphasis') return `<em>${childrenToHtml(node)}</em>`;
  if (node.type === 'strong') return `<strong>${childrenToHtml(node)}</strong>`;
  if (node.type === 'inlineCode') return `<code>${escapeHtml(node.value)}</code>`;
  if (node.type === 'link') return `<a href="${escapeAttr(node.url)}">${childrenToHtml(node)}</a>`;
  if (node.type === 'paragraph') return `<p>${childrenToHtml(node)}</p>`;
  if (node.type === 'html') return node.value;
  if (node.children) return childrenToHtml(node);
  return '';
}

function childrenToHtml(node: any): string {
  if (!node.children) return '';
  return node.children.map(nodeToHtml).join('');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Parse "Author, *Source*" from meta string
function parseAttribution(meta: string): { author: string; source?: string } | null {
  if (!meta) return null;
  // Match: Author, *Source* or Author, Source
  const match = meta.match(/^(.+?),\s*\*(.+?)\*$/);
  if (match) return { author: match[1].trim(), source: match[2].trim() };
  // Just author
  return { author: meta.trim() };
}

const remarkCallouts: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index, parent) => {
      if (index === undefined || !parent) return;

      const info = extractCalloutInfo(node);
      if (!info) return;

      let html: string;

      switch (info.type) {
        case 'quote': {
          const body = blockquoteChildrenToHtml(node, info.bodyStartIndex);
          const attr = parseAttribution(info.meta);
          if (attr) {
            html = `<figure class="not-prose my-8">
  <span class="select-none text-5xl leading-none text-brand/20" aria-hidden="true">&ldquo;</span>
  <blockquote class="-mt-6 pl-4 text-lg italic text-foreground/85">${body}</blockquote>
  <figcaption class="mt-3 pl-4 text-xs uppercase tracking-widest text-brand/70">
    &mdash;&nbsp;${escapeHtml(attr.author)}${attr.source ? `<cite class="not-italic">, ${escapeHtml(attr.source)}</cite>` : ''}
  </figcaption>
</figure>`;
          } else {
            html = `<figure class="not-prose my-8">
  <span class="select-none text-5xl leading-none text-brand/20" aria-hidden="true">&ldquo;</span>
  <blockquote class="-mt-6 pl-4 text-lg italic text-foreground/85">${body}</blockquote>
</figure>`;
          }
          break;
        }

        case 'important': {
          const body = blockquoteChildrenToHtml(node, info.bodyStartIndex);
          html = `<div class="not-prose my-10 border-y border-brand/25 py-6 text-center" role="presentation">
  <p class="mx-auto max-w-lg text-xl font-semibold md:text-2xl">${body}</p>
</div>`;
          break;
        }

        case 'note': {
          const label = info.meta || 'Side Note';
          const body = blockquoteChildrenToHtml(node, info.bodyStartIndex);
          html = `<aside class="not-prose my-6 rounded-r-lg border-l-2 border-muted-foreground/25 bg-muted/50 px-4 py-3">
  <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    ${escapeHtml(label)}
  </p>
  <div class="space-y-3 text-sm text-foreground/80">${body}</div>
</aside>`;
          break;
        }

        default:
          return;
      }

      const htmlNode: Html = { type: 'html', value: html };
      parent.children.splice(index as number, 1, htmlNode as any);
    });
  };
};

export default remarkCallouts;
