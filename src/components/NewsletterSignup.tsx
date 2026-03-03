'use client';
import { Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'newsletter-dismissed';
const SUBSCRIBED_KEY = 'newsletter-subscribed';
const PAGE_COUNT_KEY = 'newsletter-page-count';
const MIN_PAGES = 2;

const BUTTONDOWN_USERNAME = import.meta.env.PUBLIC_BUTTONDOWN_USERNAME ?? '';

export default function NewsletterSignup() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!BUTTONDOWN_USERNAME) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const subscribed = localStorage.getItem(SUBSCRIBED_KEY);
    if (dismissed || subscribed) return;

    const count = Number(localStorage.getItem(PAGE_COUNT_KEY) || '0') + 1;
    localStorage.setItem(PAGE_COUNT_KEY, String(count));

    if (count >= MIN_PAGES) {
      setVisible(true);
    }
  }, []);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    const email = inputRef.current?.value.trim();
    if (!email) return;

    setStatus('loading');

    try {
      const res = await fetch(
        `https://buttondown.com/api/emails/embed-subscribe/${BUTTONDOWN_USERNAME}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ email }),
        },
      );

      if (res.ok || res.redirected) {
        setStatus('success');
        localStorage.setItem(SUBSCRIBED_KEY, 'true');
        setTimeout(() => setVisible(false), 2000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Newsletter signup"
      aria-describedby="newsletter-desc"
      className="fixed bottom-4 left-4 z-modal w-80 rounded-xl border border-border/50 bg-background/70 p-4 shadow-lg backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
        <span>Stay Updated</span>
      </div>

      {status === 'success' ? (
        <p className="text-sm text-muted-foreground">Check your email to confirm.</p>
      ) : (
        <>
          <p id="newsletter-desc" className="mb-3 text-sm text-muted-foreground">
            Get notified when new posts are published.
          </p>
          <form onSubmit={subscribe} className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="email"
              required
              placeholder="you@example.com"
              className="h-8 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </Button>
              <Button size="sm" variant="outline" type="button" onClick={dismiss}>
                No thanks
              </Button>
            </div>
            {status === 'error' && (
              <p className="text-xs text-destructive">Something went wrong. Try again.</p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
