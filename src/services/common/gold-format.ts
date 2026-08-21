/** Notação "kk" da comunidade Tibia — a cada 3 zeros, um "k" a mais (1.000→1k,
 * 1.000.000→1kk, 1.000.000.000→1kkk), até sobrar um número menor que mil, arredondado em
 * 2 casas. Usada só onde o espaço é curto (mensagem de WhatsApp, rótulo de gráfico) — o
 * resto do app usa formatTibiaGold() (valor por extenso), onde precisão exata importa
 * (comandos `transfer`, KPIs). Extraído de UnsoldItemsShareModal.tsx em 2026-08-21 pra
 * reuso no gráfico de tendência mensal do Dashboard (MonthlyTrendModal). */
export function formatGoldKK(value: number): string {
  const sign = value < 0 ? '-' : '+';
  let abs = Math.abs(value);
  let suffix = '';
  while (abs >= 1000) {
    abs /= 1000;
    suffix += 'k';
  }
  const rounded = Math.round(abs * 100) / 100;
  return `${sign}${rounded}${suffix}`;
}
