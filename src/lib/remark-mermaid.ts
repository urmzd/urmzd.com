/**
 * Remark plugin that transforms ```mermaid code fences into placeholder
 * divs carrying the diagram source in a data attribute.
 *
 * Rendering happens client-side via the MermaidRenderer component, which
 * lazy-loads the mermaid library only when a page contains diagrams and
 * re-renders on theme toggle (the build can't know the runtime theme
 * because dark mode is a class on <html>, not a media query).
 */
import type { Code, Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const remarkMermaid: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      if (index === undefined || !parent) return;
      if (node.lang !== 'mermaid') return;

      const source = escapeHtml(node.value);
      parent.children[index] = {
        type: 'html',
        value: `<div class="mermaid-diagram not-prose my-8 flex justify-center overflow-x-auto" data-diagram="${source}">
  <div class="mermaid-fallback whitespace-pre-wrap font-mono text-xs text-muted-foreground" aria-hidden="true">${source}</div>
</div>`,
      };
    });
  };
};

export default remarkMermaid;
