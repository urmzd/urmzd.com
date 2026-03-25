'use client';
import { IconBrandLinkedin, IconBrandX, IconCheck, IconLink, IconShare } from '@tabler/icons-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  shareText?: string;
  variant?: 'icon' | 'button';
}

export default function ShareButton({
  url,
  title,
  description = '',
  shareText,
  variant = 'button',
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

  const shareMessage = shareText || description;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareMessage, url });
      } catch {
        // User cancelled
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
    }, 1500);
  };

  const shareOptions = [
    {
      name: 'X',
      icon: <IconBrandX size={18} />,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareMessage)}&via=urmzd_`,
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
          onClick={handleShare}
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
                className="absolute left-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
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
