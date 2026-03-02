declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

import { Cookie } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'analytics-consent';
const GA_ID = 'G-C6ZEFE95YR';

function loadGA() {
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_ID);
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (consent === 'granted') {
      loadGA();
    } else if (consent === null) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'granted');
    setVisible(false);
    loadGA();
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'denied');
    setVisible(false);
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {visible && (
          <motion.div
            role="dialog"
            aria-label="Cookie consent"
            aria-describedby="cookie-consent-desc"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 z-modal w-80 rounded-xl border border-border/50 bg-background/70 p-4 shadow-lg backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Cookie className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Cookie Consent</span>
            </div>
            <p id="cookie-consent-desc" className="mb-4 text-sm text-muted-foreground">
              This site uses cookies for analytics.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={accept}>
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={decline}>
                Decline
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
