/** Let local visual embeds participate in the page's vertical scroll. */
export function resizeEmbeds() {
  const cleanups: (() => void)[] = [];

  for (const frame of document.querySelectorAll<HTMLIFrameElement>('iframe[data-visual-embed]')) {
    const url = new URL(frame.src, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/embed/')) continue;

    let observer: ResizeObserver | undefined;
    let pending = 0;

    const connect = () => {
      observer?.disconnect();
      cancelAnimationFrame(pending);
      // Navigation away from a local embed must retain normal iframe behavior.
      let body: HTMLElement | undefined;
      try {
        body = frame.contentDocument?.querySelector<HTMLElement>('[data-embed-body]') ?? undefined;
      } catch {
        return;
      }
      // Lazy iframes initially expose an about:blank document. Wait for the
      // actual embed before measuring, or that empty viewport can shrink away.
      if (!body) return;

      const resize = () => {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => {
          if (!body.isConnected) return;
          const styles = getComputedStyle(frame);
          const borders = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
          // Measure natural body height, not document.scrollHeight, which is at
          // least the iframe's current viewport height and prevents shrinking.
          const height = Math.ceil(body.getBoundingClientRect().height + borders);
          if (height > 0 && frame.style.height !== `${height}px`) {
            frame.style.height = `${height}px`;
          }
        });
      };

      observer = new ResizeObserver(resize);
      observer.observe(body);
      resize();
    };

    frame.addEventListener('load', connect);
    connect();
    cleanups.push(() => {
      frame.removeEventListener('load', connect);
      observer?.disconnect();
      cancelAnimationFrame(pending);
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
