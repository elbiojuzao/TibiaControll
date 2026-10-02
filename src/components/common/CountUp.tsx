import { useCountUp } from '@/hooks/useCountUp';

interface CountUpProps {
  value: number;
  /** Formata o número animado (ex: formatTibiaGold). Padrão: inteiro puro. */
  format?: (n: number) => string;
  /** Espera antes de começar a contar (ver useCountUp) — casa com o atraso da cascata de entrada. */
  delayMs?: number;
}

/** Número que anima até `value` — ver useCountUp. */
export function CountUp({ value, format, delayMs }: CountUpProps) {
  const animated = useCountUp(value, undefined, delayMs);
  return <>{format ? format(animated) : animated}</>;
}
