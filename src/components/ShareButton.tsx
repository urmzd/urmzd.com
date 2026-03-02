'use client';
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconDownload,
  IconLink,
  IconShare,
} from '@tabler/icons-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { mdxToMarkdown, type PostFrontmatter } from '../lib/mdxToMarkdown';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'icon' | 'button';
  postBody?: string;
  postFrontmatter?: PostFrontmatter;
  slug?: string;
}

interface ShareOption {
  name: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function ShareButton({
  url,
  title,
  description = '',
  variant = 'button',
  postBody,
  postFrontmatter,
  slug,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  const handleDownload = () => {
    if (!postBody || !postFrontmatter) return;
    const markdown = mdxToMarkdown(postBody, postFrontmatter);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug || 'post'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const shareOptions: ShareOption[] = [
    {
      name: 'X',
      icon: <IconBrandX size={18} />,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank',
          'noopener,noreferrer',
        );
        setIsOpen(false);
      },
    },
    {
      name: 'LinkedIn',
      icon: <IconBrandLinkedin size={18} />,
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank',
          'noopener,noreferrer',
        );
        setIsOpen(false);
      },
    },
    {
      name: 'Facebook',
      icon: <IconBrandFacebook size={18} />,
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank',
          'noopener,noreferrer',
        );
        setIsOpen(false);
      },
    },
    ...(postBody && postFrontmatter
      ? [
          {
            name: 'Download',
            icon: <IconDownload size={18} />,
            action: handleDownload,
          },
        ]
      : []),
    {
      name: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? <IconCheck size={18} /> : <IconLink size={18} />,
      action: handleCopyLink,
    },
  ];

  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative" ref={menuRef}>
        <motion.button
          onClick={handleNativeShare}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground ${
            variant === 'icon' ? 'p-2' : ''
          }`}
          aria-label="Share"
        >
          <IconShare size={18} />
          {variant === 'button' && <span>Share</span>}
        </motion.button>
        <output className="sr-only" aria-live="polite">
          {copied ? 'Copied to clipboard' : ''}
        </output>

        {!supportsNativeShare && (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-dropdown mt-2 min-w-[160px] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
              >
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.name}
                    onClick={option.action}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  >
                    {option.icon}
                    <span>{option.name}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </MotionConfig>
  );
}
