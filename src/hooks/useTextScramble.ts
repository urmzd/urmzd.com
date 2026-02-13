import { useEffect, useRef, useState } from 'react';

const SEED_CHARS = 'ʊəˈːˌɑɪ/MNDZKHPLABCEFGIJOQRSTUVWXY0123456789!@#$%';

function randomChar() {
  return SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
}

export function useTextScramble(text: string, options?: { speed?: number; revealDelay?: number }) {
  const { speed = 40, revealDelay = 30 } = options ?? {};
  const [displayText, setDisplayText] = useState(text);
  const cancelRef = useRef<(() => void) | null>(null);
  const isFirstRender = useRef(true);
  const prevTextRef = useRef(text);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayText(text);
      prevTextRef.current = text;
      return;
    }

    cancelRef.current?.();

    const prev = prevTextRef.current;
    const target = text;
    const prevLen = prev.length;
    const targetLen = target.length;
    prevTextRef.current = text;

    // Mutable animation state
    let phase: 'encrypt' | 'resize' | 'decrypt' = 'encrypt';
    let len = prevLen;
    const encrypted = new Set<number>();
    const decrypted = new Set<number>();
    let cancelled = false;

    // Render current frame based on phase + state
    // Preserve spaces from the reference text so word-break points stay stable
    function render() {
      const buf: string[] = [];
      for (let i = 0; i < len; i++) {
        if (phase === 'decrypt' && decrypted.has(i)) {
          buf.push(target[i]);
        } else if (phase === 'encrypt' && !encrypted.has(i) && i < prevLen) {
          buf.push(prev[i]);
        } else {
          const ref = phase === 'encrypt' ? prev : target;
          buf.push(i < ref.length && ref[i] === ' ' ? ' ' : randomChar());
        }
      }
      setDisplayText(buf.join(''));
    }

    // Continuous cycling of scrambled positions
    const tickId = setInterval(render, speed);

    // Phase 1 — Encrypt: scramble old text from edges inward
    function encrypt() {
      if (cancelled) return;
      if (encrypted.size >= prevLen) {
        phase = 'resize';
        resize();
        return;
      }
      const half = Math.floor(encrypted.size / 2);
      encrypted.add(half);
      if (prevLen - 1 - half !== half) encrypted.add(prevLen - 1 - half);
      setTimeout(encrypt, revealDelay * 0.5);
    }

    // Phase 2 — Resize: grow or shrink one char at a time toward target length
    function resize() {
      if (cancelled) return;
      if (len === targetLen) {
        phase = 'decrypt';
        decrypt();
        return;
      }
      len += len < targetLen ? 1 : -1;
      render();
      setTimeout(resize, speed * 0.3);
    }

    // Phase 3 — Decrypt: reveal target text from center outward
    function decrypt() {
      if (cancelled) return;
      if (decrypted.size >= targetLen) {
        clearInterval(tickId);
        setDisplayText(target);
        return;
      }
      const mid = Math.floor(targetLen / 2);
      const r = Math.floor(decrypted.size / 2);
      if (mid + r < targetLen) decrypted.add(mid + r);
      if (mid - r - 1 >= 0) decrypted.add(mid - r - 1);
      // Catch any remaining indices
      if (decrypted.size >= targetLen - 1) {
        for (let i = 0; i < targetLen; i++) decrypted.add(i);
      }
      setTimeout(decrypt, revealDelay);
    }

    setTimeout(encrypt, speed);

    const cancel = () => {
      cancelled = true;
      clearInterval(tickId);
    };
    cancelRef.current = cancel;
    return cancel;
  }, [text, speed, revealDelay]);

  return displayText;
}
