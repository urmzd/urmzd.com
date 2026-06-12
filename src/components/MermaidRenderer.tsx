'use client';

import { useEffect } from 'react';

/**
 * Renders all `.mermaid-diagram` placeholders produced by remark-mermaid.
 * The mermaid library is imported only when the page actually contains
 * diagrams. Diagrams re-render when the `dark` class on <html> toggles,
 * so they always match the active theme.
 */
export default function MermaidRenderer() {
  useEffect(() => {
    const containers = Array.from(document.querySelectorAll<HTMLElement>('.mermaid-diagram'));
    if (containers.length === 0) return;

    let disposed = false;
    let observer: MutationObserver | undefined;
    let renderPass = 0;

    (async () => {
      const mermaid = (await import('mermaid')).default;
      if (disposed) return;

      let lastTheme: string | undefined;

      const renderAll = async () => {
        const isDark = document.documentElement.classList.contains('dark');
        const theme = isDark ? 'dark' : 'neutral';
        if (theme === lastTheme) return;
        lastTheme = theme;

        mermaid.initialize({
          startOnLoad: false,
          theme,
          securityLevel: 'strict',
          fontFamily: 'inherit',
        });

        const pass = ++renderPass;
        await Promise.all(
          containers.map(async (el, i) => {
            const source = el.dataset.diagram;
            if (!source) return;
            try {
              const { svg } = await mermaid.render(`mermaid-${pass}-${i}`, source);
              if (!disposed && pass === renderPass) el.innerHTML = svg;
            } catch (err) {
              console.error('Mermaid render failed:', err);
            }
          }),
        );
      };

      await renderAll();

      observer = new MutationObserver(() => {
        void renderAll();
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
