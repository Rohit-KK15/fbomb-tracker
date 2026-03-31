"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAnimationOptions {
  duration: number; // ms
  onComplete?: () => void;
}

export function useAnimation({ duration, onComplete }: UseAnimationOptions) {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - pausedAtRef.current * duration;
      }

      const elapsed = timestamp - startTimeRef.current;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        onComplete?.();
      }
    },
    [duration, onComplete]
  );

  const play = useCallback(() => {
    if (progress >= 1) {
      pausedAtRef.current = 0;
      startTimeRef.current = null;
    }
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, progress]);

  const pause = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    pausedAtRef.current = progress;
    startTimeRef.current = null;
    setIsPlaying(false);
  }, [progress]);

  const seek = useCallback(
    (p: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const clamped = Math.max(0, Math.min(1, p));
      setProgress(clamped);
      pausedAtRef.current = clamped;
      startTimeRef.current = null;
      if (isPlaying) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [isPlaying, animate]
  );

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    setIsPlaying(false);
    pausedAtRef.current = 0;
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { progress, isPlaying, play, pause, seek, reset };
}
