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

export function todayAsBr(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}
