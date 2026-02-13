'use client';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { mdxToMarkdown, type PostFrontmatter } from '../lib/mdxToMarkdown';

interface CopyMarkdownButtonProps {
  postBody: string;
  postFrontmatter: PostFrontmatter;
  slug: string;
}

export default function CopyMarkdownButton({
  postBody,
  postFrontmatter,
  slug,
}: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const markdown = mdxToMarkdown(postBody, postFrontmatter);
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = markdown;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
      aria-label={copied ? 'Copied markdown' : 'Copy as Markdown'}
      title="Copy as Markdown"
    >
      {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </motion.button>
  );
}
