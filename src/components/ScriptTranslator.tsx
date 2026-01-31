'use client';

import { motion } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  type ScriptType,
  type Letter,
  type ArabicLetter,
  scriptConfigs,
  getLetterMapping,
} from '@/data/scriptMappings';

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground shadow-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'p-4',
        compact: 'p-3',
        detailed: 'p-5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const gridVariants = cva('grid gap-4', {
  variants: {
    variant: {
      default: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
      compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
      detailed: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ScriptTranslatorProps extends VariantProps<typeof cardVariants> {
  letters: string;
  targetScript: ScriptType;
  sourceScript?: ScriptType;
  showArabicForms?: boolean;
  animated?: boolean;
  className?: string;
}

function isArabicLetter(letter: Letter | ArabicLetter): letter is ArabicLetter {
  return 'forms' in letter;
}

interface LetterCardProps {
  sourceLetter: Letter | ArabicLetter;
  targetLetter: Letter | ArabicLetter;
  sourceScript: ScriptType;
  targetScript: ScriptType;
  variant: 'default' | 'compact' | 'detailed' | null | undefined;
  showArabicForms: boolean;
  animated: boolean;
  index: number;
}

function LetterCard({
  sourceLetter,
  targetLetter,
  sourceScript,
  targetScript,
  variant,
  showArabicForms,
  animated,
  index,
}: LetterCardProps) {
  const targetConfig = scriptConfigs[targetScript];
  const sourceConfig = scriptConfigs[sourceScript];
  const isRtlTarget = targetConfig.direction === 'rtl';
  const effectiveVariant = variant || 'default';

  const cardContent = (
    <div className={cn(cardVariants({ variant: effectiveVariant }))}>
      {/* Source letter label */}
      <div className="text-xs text-muted-foreground font-medium mb-1">{sourceConfig.name}</div>

      {/* Source letter */}
      <div
        className={cn(
          'text-lg font-semibold text-foreground/70',
          effectiveVariant === 'compact' && 'text-base'
        )}
        style={{ fontFamily: sourceConfig.fontFamily }}
        dir={sourceConfig.direction}
      >
        {sourceLetter.character}
      </div>

      {/* Arrow */}
      <div className="text-muted-foreground my-2">↓</div>

      {/* Target letter - large display */}
      <div
        className={cn(
          'text-4xl font-bold text-foreground',
          effectiveVariant === 'compact' && 'text-3xl',
          effectiveVariant === 'detailed' && 'text-5xl'
        )}
        style={{ fontFamily: targetConfig.fontFamily }}
        dir={targetConfig.direction}
      >
        {targetLetter.character}
      </div>

      {/* Letter name */}
      <div
        className={cn(
          'text-sm font-medium text-foreground mt-2',
          effectiveVariant === 'compact' && 'text-xs'
        )}
      >
        {targetLetter.name}
      </div>

      {/* IPA pronunciation */}
      <div
        className={cn(
          'text-xs text-muted-foreground font-mono mt-1',
          effectiveVariant === 'compact' && 'hidden'
        )}
      >
        {targetLetter.ipa}
      </div>

      {/* Audio hint - only in default and detailed */}
      {effectiveVariant !== 'compact' && (
        <div className="text-xs text-muted-foreground/80 mt-2 italic leading-relaxed">
          {targetLetter.audioHint}
        </div>
      )}

      {/* Arabic forms section - only in detailed variant for Arabic target */}
      {effectiveVariant === 'detailed' &&
        showArabicForms &&
        isRtlTarget &&
        isArabicLetter(targetLetter) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground font-medium mb-2">Letter Forms</div>
            <div className="grid grid-cols-4 gap-2 text-center" dir="rtl">
              <div>
                <div className="text-2xl" style={{ fontFamily: targetConfig.fontFamily }}>
                  {targetLetter.forms.isolated}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Isolated</div>
              </div>
              <div>
                <div className="text-2xl" style={{ fontFamily: targetConfig.fontFamily }}>
                  {targetLetter.forms.initial}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Initial</div>
              </div>
              <div>
                <div className="text-2xl" style={{ fontFamily: targetConfig.fontFamily }}>
                  {targetLetter.forms.medial}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Medial</div>
              </div>
              <div>
                <div className="text-2xl" style={{ fontFamily: targetConfig.fontFamily }}>
                  {targetLetter.forms.final}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Final</div>
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * 0.1,
          ease: 'easeOut',
        }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

export default function ScriptTranslator({
  letters,
  targetScript,
  sourceScript = 'latin',
  variant = 'default',
  showArabicForms = true,
  animated = true,
  className,
}: ScriptTranslatorProps) {
  // Parse and translate letters
  const translatedLetters = letters
    .toUpperCase()
    .split('')
    .map((letter) => {
      const mapping = getLetterMapping(letter);
      if (!mapping) return null;
      return {
        source: mapping[sourceScript],
        target: mapping[targetScript],
        originalLetter: letter,
      };
    })
    .filter(Boolean) as Array<{
    source: Letter | ArabicLetter;
    target: Letter | ArabicLetter;
    originalLetter: string;
  }>;

  if (translatedLetters.length === 0) {
    return <div className="text-muted-foreground text-sm">No valid letters to translate.</div>;
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={gridVariants({ variant })}>
        {translatedLetters.map((item, index) => (
          <LetterCard
            key={`${item.originalLetter}-${index}`}
            sourceLetter={item.source}
            targetLetter={item.target}
            sourceScript={sourceScript}
            targetScript={targetScript}
            variant={variant}
            showArabicForms={showArabicForms}
            animated={animated}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
