'use client';

import { useEffect } from 'react';

export default function HeadingLinkEnhancer() {
  useEffect(() => {
    const proseContainer = document.querySelector('.prose');
    if (!proseContainer) return;

    const headings = proseContainer.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]');

    headings.forEach((heading) => {
      // Skip if already enhanced
      if (heading.classList.contains('heading-enhanced')) return;
      heading.classList.add('heading-enhanced');

      // Create link button
      const linkButton = document.createElement('button');
      linkButton.className = 'heading-link-button';
      linkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
      linkButton.setAttribute('aria-label', 'Copy link to section');
      linkButton.setAttribute('title', 'Copy link to section');

      linkButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const id = heading.getAttribute('id');
        if (!id) return;

        const url = `${window.location.origin}${window.location.pathname}#${id}`;

        // Update URL hash
        history.pushState(null, '', `#${id}`);

        // Scroll to the heading
        heading.scrollIntoView({ behavior: 'smooth' });

        try {
          await navigator.clipboard.writeText(url);

          // Show copied feedback
          linkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          linkButton.classList.add('copied');

          setTimeout(() => {
            linkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
            linkButton.classList.remove('copied');
          }, 1500);
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
      });

      heading.appendChild(linkButton);
    });
  }, []);

  return null;
}
