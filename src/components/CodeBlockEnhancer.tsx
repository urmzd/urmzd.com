'use client';

import { useEffect } from 'react';

export default function CodeBlockEnhancer() {
  useEffect(() => {
    const proseContainer = document.querySelector('.prose');
    if (!proseContainer) return;

    const preElements = proseContainer.querySelectorAll('pre');

    preElements.forEach((pre) => {
      // Skip if already enhanced
      if (pre.parentElement?.classList.contains('code-block-wrapper')) return;

      // Wrap pre in a container for positioning
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Create copy button
      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      button.setAttribute('aria-label', 'Copy code');
      button.setAttribute('title', 'Copy code');

      button.addEventListener('click', async () => {
        const code = pre.querySelector('code');
        const text = code?.textContent || pre.textContent || '';

        try {
          await navigator.clipboard.writeText(text);
          button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          button.classList.add('copied');

          setTimeout(() => {
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      });

      wrapper.appendChild(button);
    });
  }, []);

  return null;
}
