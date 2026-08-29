/** Conversões entre o formato de data nativo do <input type="date"> (YYYY-MM-DD) e o formato usado no app (DD/MM/YYYY) */

export function isoToBr(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

export function brToIso(br: string): string {
  if (!br) return '';
  const [day, month, year] = br.split('/');
  return `${year}-${month}-${day}`;
}

/** DD/MM/YYYY -> DD/MM (sem ano) — usado na mensagem de venda (2026-08-28, pedido do usuário) */
export function shortBr(br: string): string {
  if (!br) return '';
  const [day, month] = br.split('/');
  return `${day}/${month}`;
}

export function dateAsBr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function todayAsBr(): string {
  return dateAsBr(new Date());
}
