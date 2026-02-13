'use client';

import { useEffect } from 'react';
import { enhanceCodeBlocks } from '../lib/enhanceCodeBlocks';

export default function CodeBlockEnhancer() {
  useEffect(() => {
    const proseContainer = document.querySelector('.prose');
    if (!proseContainer) return;
    enhanceCodeBlocks(proseContainer as HTMLElement);
  }, []);

  return null;
}
