"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 text-slate-950 transition-colors dark:bg-zinc-900",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={
          {
            "--aurora":
              "repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)",
            "--dark-gradient":
              "repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)",
            "--white-gradient":
              "repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)",
            "--transparent": "transparent",
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            `pointer-events-none absolute -inset-[10px] opacity-50 blur-[10px] invert filter will-change-transform
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            dark:[background-image:var(--dark-gradient),var(--aurora)]
            dark:invert-0
            after:absolute after:inset-0 after:animate-aurora after:[background-attachment:fixed]
            after:[background-image:var(--white-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            after:mix-blend-difference
            after:content-['']
            dark:after:[background-image:var(--dark-gradient),var(--aurora)]`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        />
      </div>
      {children}
    </div>
  );
};
