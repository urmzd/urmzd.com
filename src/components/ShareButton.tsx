import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  IconShare,
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconLink,
  IconCheck,
} from '@tabler/icons-react';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'icon' | 'button';
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

  const shareOptions: ShareOption[] = [
    {
      name: 'X',
      icon: <IconBrandX size={18} />,
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank',
          'noopener,noreferrer'
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
          'noopener,noreferrer'
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
          'noopener,noreferrer'
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

      {!supportsNativeShare && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
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
  );
}
