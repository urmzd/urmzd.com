'use client';
import { useScroll, useTransform, motion, type MotionValue } from 'motion/react';
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Subsection {
  label: string;
  content: React.ReactNode;
}

interface TimelineEntryData {
  title: string;
  content?: React.ReactNode;
  subsections?: Subsection[];
  compact?: boolean;
}

interface TimelineProps {
  data: TimelineEntryData[];
  title?: string;
  description?: string;
}

interface TimelineSegmentProps {
  startY: number;
  endY: number;
  segmentStart: number;
  segmentEnd: number;
  scrollYProgress: MotionValue<number>;
  opacityTransform: MotionValue<number>;
  isMobile: boolean;
}

const TimelineSegment = ({
  startY,
  endY,
  segmentStart,
  segmentEnd,
  scrollYProgress,
  opacityTransform,
  isMobile,
  isFirst,
  isLast,
}: TimelineSegmentProps & { isFirst?: boolean; isLast?: boolean }) => {
  const segmentHeight = endY - startY;
  const heightTransform = useTransform(scrollYProgress, [segmentStart, segmentEnd], ['0%', '100%']);

  if (segmentHeight <= 0) return null;

  // Create mask gradient for fade effect at edges
  const getMaskStyle = () => {
    if (isFirst && isLast) {
      return 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)';
    } else if (isFirst) {
      return 'linear-gradient(to bottom, transparent 0%, black 30%)';
    } else if (isLast) {
      return 'linear-gradient(to bottom, black 70%, transparent 100%)';
    }
    return undefined;
  };

  const maskStyle = getMaskStyle();

  return (
    <div
      style={{
        top: startY + 'px',
        height: segmentHeight + 'px',
        ...(maskStyle && {
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle,
        }),
      }}
      className={`absolute z-0 overflow-hidden w-[2px] bg-neutral-200/50 dark:bg-neutral-700/50 pointer-events-none ${
        isMobile ? 'md:hidden left-[84px]' : 'hidden md:block left-1/2 -translate-x-1/2'
      }`}
    >
      <motion.div
        style={{
          height: heightTransform,
          opacity: opacityTransform,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
        className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-purple-500 to-blue-500 rounded-full will-change-transform"
      />
    </div>
  );
};

export const Timeline = ({ data, title, description }: TimelineProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [dotPositions, setDotPositions] = useState<number[]>([]);
  const [glowIntensities, setGlowIntensities] = useState<number[]>([]);

  const setEntryRef = useCallback((el: HTMLDivElement | null, index: number) => {
    entryRefs.current[index] = el;
  }, []);

  const setDotRef = useCallback((el: HTMLDivElement | null, index: number) => {
    dotRefs.current[index] = el;
  }, []);

  useEffect(() => {
    const calculateDimensions = () => {
      if (ref.current) {
        const containerRect = ref.current.getBoundingClientRect();

        // Calculate positions of all dots relative to the container
        const positions: number[] = [];
        for (const dot of dotRefs.current) {
          if (!dot) continue;
          const dotRect = dot.getBoundingClientRect();
          // Get the center of the dot relative to the container
          positions.push(dotRect.top + dotRect.height / 2 - containerRect.top);
        }
        setDotPositions(positions);
      }
    };

    // Initial calculation after mount with a small delay for rendering
    const timeoutId = setTimeout(calculateDimensions, 100);

    // Also recalculate on resize
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [data?.length]);

  // Calculate glow intensity - dots stay lit once passed, dim if not yet reached or out of view
  useEffect(() => {
    const handleScroll = () => {
      const viewportTop = 0;
      const viewportBottom = window.innerHeight;
      const activationPoint = window.innerHeight * 0.4; // Dot activates when it reaches 40% from top

      const newIntensities = entryRefs.current.map((el) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const dotCenter = rect.top + 20; // Approximate dot position

        // If dot is above the viewport (scrolled past), keep it lit
        if (dotCenter < activationPoint) {
          // Fade out only when completely above viewport
          if (dotCenter < viewportTop - 100) {
            return 0;
          }
          return 1;
        }

        // If dot is below the viewport, dim
        if (dotCenter > viewportBottom) {
          return 0;
        }

        // Dot is in viewport but not yet passed - gradual fade in as it approaches activation point
        const distanceToActivation = dotCenter - activationPoint;
        const fadeInZone = viewportBottom - activationPoint;
        return Math.max(0, 1 - distanceToActivation / fadeInZone);
      });
      setGlowIntensities(newIntensities);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data?.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 50%'],
  });

  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const getDotStyles = (intensity: number) => {
    const baseClasses = 'h-4 w-4 rounded-full p-2 transition-all duration-500 ease-out';

    if (intensity > 0.1) {
      return {
        className: `${baseClasses} bg-purple-400 dark:bg-purple-500 border border-purple-400 dark:border-purple-500`,
      };
    }
    return {
      className: `${baseClasses} bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700`,
    };
  };

  return (
    <div
      className="w-full bg-background font-sans md:px-10 scroll-snap-y-proximity"
      ref={containerRef}
    >
      {(title || description) && (
        <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
          {title && <h2 className="text-lg md:text-4xl mb-4 text-foreground max-w-4xl">{title}</h2>}
          {description && (
            <p className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base max-w-sm">
              {description}
            </p>
          )}
        </div>
      )}

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {(data ?? []).map((item, index) => {
          const isEven = index % 2 === 0;

          const renderContent = () => (
            <>
              {item.content}
              {item.subsections?.map((sub, i) => (
                <div
                  key={i}
                  className={
                    i > 0 ? 'mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800' : ''
                  }
                >
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium">
                    {sub.label}
                  </span>
                  <div className="mt-2">{sub.content}</div>
                </div>
              ))}
            </>
          );

          const renderCompactContent = () => (
            <>
              {item.content}
              {item.subsections?.map((sub, i) => (
                <div
                  key={i}
                  className={
                    i > 0 ? 'mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800' : ''
                  }
                >
                  {sub.content}
                </div>
              ))}
            </>
          );

          return (
            <div
              key={index}
              ref={(el) => setEntryRef(el, index)}
              className={`${item.compact ? 'pt-6 md:pt-16' : 'pt-10 md:pt-40'} scroll-snap-start`}
            >
              {/* Mobile layout - date on left, dot center, content right */}
              <div className="flex md:hidden">
                {/* Date column - left side */}
                <div className="w-16 flex-shrink-0 text-right pr-2">
                  <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-500">
                    {item.title}
                  </h3>
                </div>

                {/* Dot column - center */}
                <div className="flex flex-col z-40 items-center self-start">
                  <div
                    ref={(el) => {
                      if (el && el.offsetWidth > 0) setDotRef(el, index);
                    }}
                    className="h-10 w-10 rounded-full bg-background flex items-center justify-center"
                  >
                    {(() => {
                      const dotStyles = getDotStyles(glowIntensities[index] || 0);
                      return <div className={dotStyles.className} />;
                    })()}
                  </div>
                </div>

                {/* Content column - right side */}
                <div className="relative pl-4 pr-4 flex-1 z-10">{renderContent()}</div>
              </div>

              {/* Desktop layout - alternating left/right */}
              {item.compact ? (
                <div
                  className={`hidden md:flex items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Content side */}
                  <div
                    className={`w-[calc(50%-2rem)] ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'} relative z-10`}
                  >
                    <div className={`${isEven ? 'ml-auto' : 'mr-auto'}`}>
                      {renderCompactContent()}
                    </div>
                  </div>

                  {/* Center line with dot only */}
                  <div className="relative flex flex-col items-center w-16 flex-shrink-0 z-10">
                    <div className="sticky top-40 z-40 flex items-center justify-center">
                      <div
                        ref={(el) => {
                          if (el && el.offsetWidth > 0) setDotRef(el, index);
                        }}
                        className="h-10 w-10 rounded-full bg-background flex items-center justify-center"
                      >
                        {(() => {
                          const dotStyles = getDotStyles(glowIntensities[index] || 0);
                          return <div className={dotStyles.className} />;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Date side - opposite of content */}
                  <div className={`w-[calc(50%-2rem)] ${isEven ? 'pl-8' : 'pr-8'} relative z-10`}>
                    <div
                      className={`sticky top-40 flex items-center h-10 ${isEven ? 'justify-start' : 'justify-end'}`}
                    >
                      <h3 className="text-xl md:text-3xl font-bold text-neutral-500 dark:text-neutral-500 whitespace-nowrap">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`hidden md:flex items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Content side */}
                  <div
                    className={`w-[calc(50%-2rem)] ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'} relative z-10`}
                  >
                    <div className={`${isEven ? 'ml-auto' : 'mr-auto'}`}>{renderContent()}</div>
                  </div>

                  {/* Center line with dot only */}
                  <div className="relative flex flex-col items-center w-16 flex-shrink-0 z-10">
                    <div className="sticky top-40 z-40 flex items-center justify-center">
                      <div
                        ref={(el) => {
                          if (el && el.offsetWidth > 0) setDotRef(el, index);
                        }}
                        className="h-10 w-10 rounded-full bg-background flex items-center justify-center"
                      >
                        {(() => {
                          const dotStyles = getDotStyles(glowIntensities[index] || 0);
                          return <div className={dotStyles.className} />;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Date side - opposite of content */}
                  <div className={`w-[calc(50%-2rem)] ${isEven ? 'pl-8' : 'pr-8'} relative z-10`}>
                    <div
                      className={`sticky top-40 flex items-center h-10 ${isEven ? 'justify-start' : 'justify-end'}`}
                    >
                      <h3 className="text-xl md:text-3xl font-bold text-neutral-500 dark:text-neutral-500 whitespace-nowrap">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Timeline segments - rendered between consecutive dots */}
        {dotPositions.length > 1 &&
          dotPositions.slice(0, -1).map((startY, index) => {
            const endY = dotPositions[index + 1];
            const totalHeight = dotPositions[dotPositions.length - 1] - dotPositions[0];
            const segmentStart = (startY - dotPositions[0]) / totalHeight;
            const segmentEnd = (endY - dotPositions[0]) / totalHeight;
            const isFirst = index === 0;
            const isLast = index === dotPositions.length - 2;

            return (
              <React.Fragment key={`segment-${index}`}>
                {/* Mobile segment */}
                <TimelineSegment
                  startY={startY}
                  endY={endY}
                  segmentStart={segmentStart}
                  segmentEnd={segmentEnd}
                  scrollYProgress={scrollYProgress}
                  opacityTransform={opacityTransform}
                  isMobile={true}
                  isFirst={isFirst}
                  isLast={isLast}
                />
                {/* Desktop segment */}
                <TimelineSegment
                  startY={startY}
                  endY={endY}
                  segmentStart={segmentStart}
                  segmentEnd={segmentEnd}
                  scrollYProgress={scrollYProgress}
                  opacityTransform={opacityTransform}
                  isMobile={false}
                  isFirst={isFirst}
                  isLast={isLast}
                />
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};
