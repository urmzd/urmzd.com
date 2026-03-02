'use client';

import { useRef, useState } from 'react';

const STEPS = [
  {
    role: 'system',
    label: 'SYSTEM',
    content: 'You are a chatbot. When given a user message, respond like a normal person.',
  },
  {
    role: 'user',
    label: 'USER',
    content: 'Hi',
  },
  {
    role: 'assistant',
    label: 'ASSISTANT',
    content: 'Howdy — are the cows behaving correctly?',
  },
] as const;

const CHAR_DELAY = 22;
const STEP_DELAY = 500;

const roleStyle: Record<string, string> = {
  system: 'text-chat-system',
  user: 'text-chat-user',
  assistant: 'text-chat-assistant',
};

export default function ChatDemo() {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [typed, setTyped] = useState('');
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const cancelRef = useRef(false);

  const reset = () => {
    cancelRef.current = true;
    setVisibleSteps(0);
    setTyped('');
    setPlaying(false);
    setDone(false);
    setTimeout(() => {
      cancelRef.current = false;
    }, 50);
  };

  const play = () => {
    if (playing || done) return;
    cancelRef.current = false;
    setPlaying(true);

    const runStep = (stepIdx: number) => {
      if (cancelRef.current || stepIdx >= STEPS.length) {
        if (!cancelRef.current) setDone(true);
        setPlaying(false);
        return;
      }

      const content = STEPS[stepIdx].content;
      let charIdx = 0;

      const typeChar = () => {
        if (cancelRef.current) return;
        charIdx++;
        setTyped(content.slice(0, charIdx));
        if (charIdx < content.length) {
          setTimeout(typeChar, CHAR_DELAY);
        } else {
          setTimeout(() => {
            if (cancelRef.current) return;
            setVisibleSteps(stepIdx + 1);
            setTyped('');
            setTimeout(() => runStep(stepIdx + 1), STEP_DELAY);
          }, STEP_DELAY);
        }
      };

      typeChar();
    };

    runStep(visibleSteps);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-chat-border bg-chat-bg font-mono text-sm">
      {/* title bar */}
      <div className="flex items-center justify-between border-b border-chat-border px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-terminal-dot-close/80" />
          <span className="h-3 w-3 rounded-full bg-terminal-dot-minimize/80" />
          <span className="h-3 w-3 rounded-full bg-terminal-dot-expand/80" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-chat-text transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={play}
            disabled={playing || done}
            className="rounded bg-chat-border px-2 py-0.5 text-xs text-chat-text hover:bg-muted disabled:opacity-40 transition-colors"
          >
            {playing ? 'Running…' : done ? 'Done' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* body */}
      <div className="space-y-3 p-4 min-h-[7rem]">
        {STEPS.slice(0, visibleSteps).map((step) => (
          <div key={step.role} className="flex gap-3">
            <span
              className={`shrink-0 w-20 text-right text-xs pt-0.5 font-bold ${roleStyle[step.role]}`}
            >
              {step.label}
            </span>
            <span className="text-chat-text">{step.content}</span>
          </div>
        ))}

        {/* currently typing step */}
        {playing && visibleSteps < STEPS.length && (
          <div className="flex gap-3">
            <span
              className={`shrink-0 w-20 text-right text-xs pt-0.5 font-bold ${roleStyle[STEPS[visibleSteps].role]}`}
            >
              {STEPS[visibleSteps].label}
            </span>
            <span className="text-chat-text">
              {typed}
              <span className="animate-pulse">▍</span>
            </span>
          </div>
        )}

        {/* idle placeholder */}
        {!playing && visibleSteps === 0 && !done && (
          <p className="text-muted-foreground text-xs">Press ▶ Run to step through the exchange.</p>
        )}
      </div>
    </div>
  );
}
