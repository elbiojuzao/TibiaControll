import type { CSSProperties } from 'react';

/** Atraso da animação de entrada (classe .anim-entrada, ver global.css) — monta a cascata do
 * Dashboard. `step` multiplica o índice; `max` evita que listas longas demorem demais;
 * `offset` é somado depois do teto (ex: gráfico do modal espera a abertura terminar). */
export function animDelay(index: number, step = 40, max = 400, offset = 0): CSSProperties {
  return { ['--anim-delay' as string]: `${animDelayMs(index, step, max, offset)}ms` };
}

/** Mesmo atraso de animDelay, em número — pra a contagem (CountUp/CountUpText) começar junto
 * com a entrada do elemento: passe os MESMOS parâmetros usados no animDelay do elemento. */
export function animDelayMs(index: number, step = 40, max = 400, offset = 0): number {
  return Math.min(index * step, max) + offset;
}
