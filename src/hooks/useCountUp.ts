import { useEffect, useRef, useState } from 'react';

const DEFAULT_DURATION_MS = 900;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Número que "conta" do valor mostrado até `target` (easeOutCubic). Parte do que já estava na
 * tela, não de 0 — trocar de mês anima do valor antigo pro novo; na 1ª carga (0 → valor real)
 * conta do zero. Com prefers-reduced-motion pula direto pro valor final.
 *
 * `delayMs` conta a partir da MONTAGEM do componente (não de cada mudança de `target`): serve pra
 * a contagem começar quando a linha/box aparece na cascata de entrada (.anim-entrada); um valor
 * que chega depois desse tempo (dado carregado tarde) começa a contar na hora. */
export function useCountUp(target: number, durationMs = DEFAULT_DURATION_MS, delayMs = 0): number {
  const [value, setValue] = useState(0);
  const shownRef = useRef(0);
  const mountedAtRef = useRef(performance.now());

  useEffect(() => {
    if (prefersReducedMotion() || shownRef.current === target) {
      shownRef.current = target;
      setValue(target);
      return;
    }

    const from = shownRef.current;
    const start = Math.max(performance.now(), mountedAtRef.current + delayMs);
    let frame = 0;

    const tick = (now: number) => {
      if (now < start) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = progress >= 1 ? target : Math.round(from + (target - from) * eased);
      shownRef.current = current;
      setValue(current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, delayMs]);

  return value;
}
