import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBackgroundAudioOptions {
  src: string;
  loop?: boolean;
  targetVolume?: number;
  fadeInDuration?: number;
  beatIntensityRef?: React.MutableRefObject<number>;
}

export function useBackgroundAudio({
  src,
  loop = true,
  targetVolume = 0.3,
  fadeInDuration = 2000,
  beatIntensityRef,
}: UseBackgroundAudioOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const fadeIn = useCallback(
    (audio: HTMLAudioElement) => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      audio.volume = 0;
      const steps = 40;
      const stepMs = fadeInDuration / steps;
      const increment = targetVolume / steps;
      fadeIntervalRef.current = setInterval(() => {
        const next = Math.min(audio.volume + increment, targetVolume);
        audio.volume = next;
        if (next >= targetVolume) {
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }, stepMs);
    },
    [targetVolume, fadeInDuration]
  );

  const setupAnalyser = useCallback(
    (audio: HTMLAudioElement) => {
      if (!beatIntensityRef) return;

      // Already wired up — just resume if suspended
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        return;
      }

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Beat detection loop
      let smoothedIntensity = 0;
      const tick = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Average bass bins 0–4 (~0–300 Hz)
        let sum = 0;
        const bassBins = 5;
        for (let i = 0; i < bassBins; i++) {
          sum += dataArrayRef.current[i];
        }
        const raw = sum / bassBins / 255; // normalize to 0–1

        // Fast attack / slow decay smoothing
        if (raw > smoothedIntensity) {
          smoothedIntensity += (raw - smoothedIntensity) * 0.3;
        } else {
          smoothedIntensity += (raw - smoothedIntensity) * 0.05;
        }

        beatIntensityRef.current = smoothedIntensity;
        rafIdRef.current = requestAnimationFrame(tick);
      };
      rafIdRef.current = requestAnimationFrame(tick);
    },
    [beatIntensityRef]
  );

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = loop;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);

    // Attempt autoplay — will silently fail if browser blocks it
    audio
      .play()
      .then(() => {
        setupAnalyser(audio);
        fadeIn(audio);
      })
      .catch(() => {
        // Autoplay blocked — ensurePlaying() will retry on user gesture
      });

    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      cancelAnimationFrame(rafIdRef.current);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;

      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      sourceRef.current = null;
      dataArrayRef.current = null;
    };
  }, [src, loop, fadeIn, setupAnalyser]);

  const ensurePlaying = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Resume AudioContext on user gesture even if audio is already playing
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (!audio.paused) return;
    audio
      .play()
      .then(() => {
        setupAnalyser(audio);
        fadeIn(audio);
      })
      .catch(() => {});
  }, [fadeIn, setupAnalyser]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !audio.muted;
    audio.muted = next;
    setMuted(next);
    // When muted, zero out beat intensity
    if (next && beatIntensityRef) {
      beatIntensityRef.current = 0;
    }
  }, [beatIntensityRef]);

  return { muted, toggleMute, ensurePlaying, currentTime, duration };
}
