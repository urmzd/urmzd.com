'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { type ScriptType, scriptConfigs, translateLetters } from '@/data/scriptMappings';
import ScriptTranslator from './ScriptTranslator';

interface ScriptInlineProps {
  letters: string;
  targetScript: ScriptType;
  sourceScript?: ScriptType;
  className?: string;
}

export default function ScriptInline({
  letters,
  targetScript,
  sourceScript = 'latin',
  className,
}: ScriptInlineProps) {
  const [open, setOpen] = useState(false);
  const targetConfig = scriptConfigs[targetScript];

  // Build the translated string for inline display
  const translatedString = translateLetters(letters, targetScript)
    .filter(Boolean)
    .map((item) => item!.target.character)
    .join('');

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'inline cursor-pointer underline decoration-dotted underline-offset-2',
            'hover:decoration-solid focus:outline-none focus:ring-2 focus:ring-offset-2',
            className
          )}
          style={{ fontFamily: targetConfig.fontFamily }}
          dir={targetConfig.direction}
        >
          {translatedString}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 max-w-[90vw] md:max-w-2xl p-4 bg-background border rounded-xl shadow-lg"
          sideOffset={8}
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ScriptTranslator
                  letters={letters}
                  targetScript={targetScript}
                  sourceScript={sourceScript}
                  variant="compact"
                  animated={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
