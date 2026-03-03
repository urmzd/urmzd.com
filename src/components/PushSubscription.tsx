import { Bell } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PUSH_API_BASE, urlBase64ToUint8Array } from '@/lib/pushUtils';

const DISMISSED_KEY = 'push-dismissed';
const SUBSCRIBED_KEY = 'push-subscribed';
const PAGE_COUNT_KEY = 'push-page-count';
const MIN_PAGES = 2;

const VAPID_PUBLIC_KEY = import.meta.env.PUBLIC_VAPID_KEY ?? '';

export default function PushSubscription() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY || !PUSH_API_BASE) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const subscribed = localStorage.getItem(SUBSCRIBED_KEY);
    if (dismissed || subscribed) return;

    const count = Number(localStorage.getItem(PAGE_COUNT_KEY) || '0') + 1;
    localStorage.setItem(PAGE_COUNT_KEY, String(count));

    if (count >= MIN_PAGES) {
      setVisible(true);
    }
  }, []);

  async function subscribe() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        dismiss();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch(`${PUSH_API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      localStorage.setItem(SUBSCRIBED_KEY, 'true');
      setVisible(false);
    } catch {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {visible && (
          <motion.div
            role="dialog"
            aria-label="Push notifications"
            aria-describedby="push-desc"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-4 left-4 z-modal w-80 rounded-xl border border-border/50 bg-background/70 p-4 shadow-lg backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Stay Updated</span>
            </div>
            <p id="push-desc" className="mb-4 text-sm text-muted-foreground">
              Get notified when new blog posts are published.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={subscribe}>
                Enable
              </Button>
              <Button size="sm" variant="outline" onClick={dismiss}>
                No thanks
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
