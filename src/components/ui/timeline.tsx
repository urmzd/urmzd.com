"use client";
import { useScroll, useTransform, motion, type MotionValue } from "motion/react";
import React, { useEffect, useRef, useState, useCallback } from "react";

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
}: TimelineSegmentProps) => {
  const segmentHeight = endY - startY;
  const heightTransform = useTransform(
    scrollYProgress,
    [segmentStart, segmentEnd],
    ["0%", "100%"]
  );

  if (segmentHeight <= 0) return null;

  return (
    <div
      style={{
        top: startY + "px",
        height: segmentHeight + "px",
      }}
      className={`absolute z-0 overflow-hidden w-[2px] bg-neutral-200/50 dark:bg-neutral-700/50 ${
        isMobile ? "md:hidden left-8" : "hidden md:block left-1/2 -translate-x-1/2"
      }`}
    >
      <motion.div
        style={{
          height: heightTransform,
          opacity: opacityTransform,
        }}
        className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"
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

  // Calculate glow intensity based on distance from viewport center
  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      const newIntensities = entryRefs.current.map((el) => {
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        const dotCenter = rect.top + 20; // Approximate dot position
        const distance = Math.abs(dotCenter - viewportCenter);
        const maxDistance = window.innerHeight / 2;
        // Intensity is 1 at center, 0 at edge, with smooth falloff
        return Math.max(0, 1 - distance / maxDistance);
      });
      setGlowIntensities(newIntensities);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data?.length]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  const getDotStyles = (intensity: number) => {
    const baseClasses = "h-4 w-4 rounded-full p-2 transition-all duration-300";
    const glowOpacity = intensity * 0.6;
    const insetOpacity = intensity * 0.3;

    if (intensity > 0.1) {
      return {
        className: `${baseClasses} bg-purple-400 dark:bg-purple-500 border border-purple-400 dark:border-purple-500`,
        style: {
          boxShadow: `0 0 15px rgba(168,85,247,${glowOpacity}), inset 0 0 8px rgba(255,255,255,${insetOpacity})`,
        },
      };
    }
    return {
      className: `${baseClasses} bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700`,
      style: {},
    };
  };

  return (
    <div
      className="w-full bg-background font-sans md:px-10 scroll-snap-y-proximity"
      ref={containerRef}
    >
      {(title || description) && (
        <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
          {title && (
            <h2 className="text-lg md:text-4xl mb-4 text-foreground max-w-4xl">
              {title}
            </h2>
          )}
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
                <div key={i} className={i > 0 ? "mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800" : ""}>
                  <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 font-medium">
                    {sub.label}
                  </span>
                  <div className="mt-2">
                    {sub.content}
                  </div>
                </div>
              ))}
            </>
          );

          return (
            <div
              key={index}
              ref={(el) => setEntryRef(el, index)}
              className={`${item.compact ? "pt-6 md:pt-16" : "pt-10 md:pt-40"} scroll-snap-start`}
            >
              {/* Mobile layout - vertical stack */}
              <div className="flex md:hidden">
                <div className="sticky flex flex-col z-40 items-center top-40 self-start">
                  <div
                    ref={(el) => { if (el && el.offsetWidth > 0) setDotRef(el, index); }}
                    className="h-10 absolute left-3 w-10 rounded-full bg-background flex items-center justify-center"
                  >
                    {(() => {
                      const dotStyles = getDotStyles(glowIntensities[index] || 0);
                      return <div className={dotStyles.className} style={dotStyles.style} />;
                    })()}
                  </div>
                </div>
                <div className="relative pl-20 pr-4 w-full">
                  <h3 className="block text-2xl mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500">
                    {item.title}
                  </h3>
                  {renderContent()}
                </div>
              </div>

              {/* Desktop layout - alternating left/right, or centered for compact */}
              {item.compact ? (
                <div className="hidden md:flex flex-col items-center justify-center">
                  {/* Center line with year badge */}
                  <div className="relative flex flex-col items-center">
                    <div
                      ref={(el) => { if (el && el.offsetWidth > 0) setDotRef(el, index); }}
                      className="h-10 w-10 rounded-full bg-background flex items-center justify-center z-40"
                    >
                      {(() => {
                        const dotStyles = getDotStyles(glowIntensities[index] || 0);
                        return <div className={dotStyles.className} style={dotStyles.style} />;
                      })()}
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-neutral-500 dark:text-neutral-500 mt-2 whitespace-nowrap">
                      {item.title}
                    </h3>
                    {/* Content below year */}
                    <div className="mt-2 text-center">
                      {renderContent()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`hidden md:flex items-start ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Content side */}
                  <div className={`w-[calc(50%-2rem)] ${isEven ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className={`${isEven ? 'ml-auto' : 'mr-auto'}`}>
                      {renderContent()}
                    </div>
                  </div>

                  {/* Center line with year badge */}
                  <div className="relative flex flex-col items-center w-16 flex-shrink-0">
                    <div className="sticky top-40 z-40 flex flex-col items-center">
                      <div
                        ref={(el) => { if (el && el.offsetWidth > 0) setDotRef(el, index); }}
                        className="h-10 w-10 rounded-full bg-background flex items-center justify-center"
                      >
                        {(() => {
                          const dotStyles = getDotStyles(glowIntensities[index] || 0);
                          return <div className={dotStyles.className} style={dotStyles.style} />;
                        })()}
                      </div>
                      <h3 className="text-xl md:text-3xl font-bold text-neutral-500 dark:text-neutral-500 mt-2 whitespace-nowrap">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* Spacer side */}
                  <div className="w-[calc(50%-2rem)]" />
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
                />
              </React.Fragment>
            );
          })}
      </div>
    </div>
  );
};
