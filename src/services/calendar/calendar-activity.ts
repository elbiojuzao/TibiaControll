import type { Hunt, LootDrop, DayActivity } from '@/types';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Formata pra bater com o formato usado nos dados mock: DD/MM/YYYY */
export function formatDateKey(day: number, month: number, year: number): string {
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

/** Parseia DD/MM/YYYY -> timestamp (ms). Retorna NaN se o formato for inválido. */
export function parseDateKey(dateStr: string): number {
  const [day, month, year] = dateStr.split('/').map(Number);
  if (!day || !month || !year) return NaN;
  return new Date(year, month - 1, day).getTime();
}

export function groupActivityByDate(hunts: Hunt[], drops: LootDrop[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();

  const getOrCreate = (date: string): DayActivity => {
    let entry = map.get(date);
    if (!entry) {
      entry = { date, hunts: [], drops: [] };
      map.set(date, entry);
    }
    return entry;
  };

  for (const hunt of hunts) {
    getOrCreate(hunt.date).hunts.push(hunt);
  }
  for (const drop of drops) {
    getOrCreate(drop.date).drops.push(drop);
  }

  return map;
}

/** Data (em ms) mais recente entre hunts e drops, ou null se não houver nenhum registro */
export function findLatestActivityDate(hunts: Hunt[], drops: LootDrop[]): number | null {
  const timestamps = [
    ...hunts.map((h) => parseDateKey(h.date)),
    ...drops.map((d) => parseDateKey(d.date)),
  ].filter((t) => !Number.isNaN(t));

  if (timestamps.length === 0) return null;
  return Math.max(...timestamps);
}
