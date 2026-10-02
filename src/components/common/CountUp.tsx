import { useCountUp } from '@/hooks/useCountUp';

interface CountUpProps {
  value: number;
  /** Formata o número animado (ex: formatTibiaGold). Padrão: inteiro puro. */
  format?: (n: number) => string;
}

/** Número que anima até `value` — ver useCountUp. */
export function CountUp({ value, format }: CountUpProps) {
  const animated = useCountUp(value);
  return <>{format ? format(animated) : animated}</>;
}
