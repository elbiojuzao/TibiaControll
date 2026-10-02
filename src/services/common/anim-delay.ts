import type { CSSProperties } from 'react';

/** Atraso da animação de entrada (classe .anim-entrada, ver global.css) — monta a cascata do
 * Dashboard. `step` multiplica o índice; `max` evita que listas longas demorem demais;
 * `offset` é somado depois do teto (ex: gráfico do modal espera a abertura terminar). */
export function animDelay(index: number, step = 40, max = 400, offset = 0): CSSProperties {
  return { ['--anim-delay' as string]: `${Math.min(index * step, max) + offset}ms` };
}
