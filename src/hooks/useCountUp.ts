import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION_MS = 900;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Número que "conta" do valor mostrado até `target` (easeOutCubic). Parte do que já estava na
 * tela, não de 0 — trocar de mês anima do valor antigo pro novo; na 1ª carga (0 → valor real)
 * conta do zero. Com prefers-reduced-motion pula direto pro valor final. */
export function useCountUp(target: number, durationMs = DEFAULT_DURATION_MS): number {
  const [value, setValue] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || shownRef.current === target) {
      shownRef.current = target;
      setValue(target);
      return;
    }

    const from = shownRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = progress >= 1 ? target : Math.round(from + (target - from) * eased);
      shownRef.current = current;
      setValue(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
