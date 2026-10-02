import { useCountUp } from '@/hooks/useCountUp';

interface CountUpTextProps {
  /** Texto já formatado que contém UM número, ex: "+156.587.468", "-476.736.286", "Axe 134",
   * "2044". Sem dígito (ex: "Lvl Atingido", "—") aparece como está, sem animar. */
  text: string;
  delayMs?: number;
}

/** prefixo (sinal, rótulo) + número (com ou sem pontos de milhar) + sufixo */
const PARTS_RE = /^(\D*?)(\d[\d.]*)(\D*)$/;

/** Anima o número dentro de um texto já formatado (tabela de XP/metas do Dashboard, onde os
 * valores chegam como string — sinal "+"/"-" e pontos de milhar inclusos). Preserva prefixo/
 * sufixo e só usa pontos de milhar se o texto original usava (pra "1973" não virar "1.973"). */
export function CountUpText({ text, delayMs }: CountUpTextProps) {
  const match = PARTS_RE.exec(text);
  const digits = match ? match[2] : '';
  const target = match ? Number(digits.replace(/\./g, '')) : 0;
  const animated = useCountUp(target, undefined, delayMs);

  if (!match) return <>{text}</>;
  const [, prefix, numberText, suffix] = match;
  const shown = numberText.includes('.') ? animated.toLocaleString('pt-BR') : String(animated);
  return <>{prefix}{shown}{suffix}</>;
}
