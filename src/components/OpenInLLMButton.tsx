'use client';
import { SiAnthropic, SiGooglegemini } from '@icons-pack/react-simple-icons';
import { IconCheck, IconSparkles } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { mdxToMarkdown, type PostFrontmatter } from '../lib/mdxToMarkdown';

interface OpenInLLMButtonProps {
  postBody: string;
  postFrontmatter: PostFrontmatter;
}

interface LLMOption {
  name: string;
  icon: React.ReactNode;
  url: string;
}

export default function OpenInLLMButton({ postBody, postFrontmatter }: OpenInLLMButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedTo, setCopiedTo] = useState<string | null>(null);
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

  const getMarkdown = () => mdxToMarkdown(postBody, postFrontmatter);

  const llmOptions: LLMOption[] = [
    {
      name: 'Claude',
      icon: <SiAnthropic size={18} />,
      url: 'https://claude.ai/new',
    },
    {
      name: 'Gemini',
      icon: <SiGooglegemini size={18} />,
      url: 'https://gemini.google.com/app',
    },
  ];

  const handleOpen = async (option: LLMOption) => {
    const markdown = getMarkdown();
    const prompt = `Summarize this article:\n\n${markdown}`;
    await navigator.clipboard.writeText(prompt);
    window.open(option.url, '_blank', 'noopener,noreferrer');
    setCopiedTo(option.name);
    setIsOpen(false);
    setTimeout(() => setCopiedTo(null), 3000);
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        aria-label="Summarize with LLM"
        title="Summarize with LLM"
      >
        {copiedTo ? <IconCheck size={18} /> : <IconSparkles size={18} />}
        <span>{copiedTo ? `Copied! Paste in ${copiedTo}` : 'Summarize'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-dropdown mt-2 min-w-[160px] overflow-hidden rounded-lg border border-border bg-background shadow-lg"
          >
            {llmOptions.map((option) => (
              <motion.button
                key={option.name}
                onClick={() => handleOpen(option)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                {option.icon}
                <span>{option.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
