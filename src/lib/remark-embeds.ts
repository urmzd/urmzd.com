/**
 * Remark plugin that transforms embed comments into iframes.
 *
 * Syntax (works in both Obsidian and standard markdown):
 *   <!-- embed:critical-thinking-loop -->
 *   <!-- embed:gp-evolution -->
 *
 * Resolves to an iframe pointing to /embed/<name> with responsive sizing.
 * The embed name must exist in VISUAL_EMBEDS.
 */
import type { Html, Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { VISUAL_EMBEDS } from './visualEmbeds';

const EMBED_REGEX = /^<!--\s*embed:(\S+)\s*-->$/;

const remarkEmbeds: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'html', (node: Html, index, parent) => {
      if (index === undefined || !parent) return;

      const match = node.value.trim().match(EMBED_REGEX);
      if (!match) return;

      const name = match[1];
      const meta = VISUAL_EMBEDS[name as keyof typeof VISUAL_EMBEDS];
      if (!meta) return;

      const iframe = `<div class="not-prose my-8">
  <iframe
    src="/embed/${name}"
    title="${meta.alt}"
    class="w-full rounded-lg border border-border"
    style="height: 500px;"
    loading="lazy"
    sandbox="allow-scripts allow-same-origin"
  ></iframe>
</div>`;

      node.value = iframe;
    });
  };
};

export default remarkEmbeds;
