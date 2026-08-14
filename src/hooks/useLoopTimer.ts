import { useEffect, useRef, useState } from 'react';

/**
 * Timer de loop independente e reusável — conta regressivo a partir de `durationSeconds`,
 * bipa (2 bipes curtos, mesmo som do Timers de boss) e reinicia sozinho ao chegar em 0.
 * Extraído em 2026-08-14 pro timer novo de poções de skill (10min), separado da lógica
 * combinada Timer Global + Timer de Loop já existente em TimersPage.tsx (que continua com
 * sua própria implementação — não vale a pena arriscar regressão só pra reusar aqui).
 */
export function useLoopTimer(durationSeconds: number, volume: number) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
  };

  const beep = (freq: number, duration: number, startTime: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const playDoubleBeep = () => {
    const ctx = audioCtxRef.current;
    if (volume === 0 || !ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    beep(1200, 0.1, now);
    beep(1200, 0.1, now + 0.15);
  };

  const triggerBlink = () => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 200);
  };

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 0) return prev - 1;
        playDoubleBeep();
        triggerBlink();
        return durationSeconds;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, volume, durationSeconds]);

  const toggle = () => {
    initAudio();
    setIsRunning((prev) => !prev);
  };

  const reset = () => {
    setIsRunning(false);
    setSecondsLeft(durationSeconds);
    setIsBlinking(false);
  };

  return { secondsLeft, isRunning, isBlinking, toggle, reset };
}
