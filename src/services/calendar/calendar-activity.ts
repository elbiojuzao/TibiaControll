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

export interface CalendarCell {
  day: number;
  dateKey: string;
  /** false pros dias de padding do mês anterior/seguinte (ver doc abaixo) — usado só pra
   * estilo (dimmed), a célula continua totalmente funcional (clicável, com atividade real
   * daquele dia) mesmo fora do mês em exibição. */
  inCurrentMonth: boolean;
}

/** Monta as células de 1 mês de calendário — extraído de CalendarioPage.tsx em 2026-09-02
 * pra ser reusado também pelo modo calendário do Histórico de Splits (ver
 * SplitsCalendarView.tsx), evitando duplicar a matemática de dia-da-semana/dias-no-mês.
 *
 * **Padding com dias reais do mês anterior/seguinte (2026-09-02, pedido do usuário: "para
 * melhor visualização deixe ver os ultimos dias do mes anterior até completar a linha da
 * semana e do mes seguinte tambem até completar a linha")** — antes o padding eram células
 * vazias (`day: null`); agora mostram o número e a atividade reais desses dias (só com
 * `inCurrentMonth: false` pro CSS aplicar um estilo apagado), como a maioria dos calendários
 * do mercado. `new Date(year, month, 0)` é o idiom padrão pra pegar o último dia do mês
 * ANTERIOR (o construtor de Date normaliza mês negativo/13 sozinho, então não precisa tratar
 * virada de ano manualmente). */
export function buildMonthCells(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    cells.push({ day, dateKey: formatDateKey(day, d.getMonth() + 1, d.getFullYear()), inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateKey: formatDateKey(day, month + 1, year), inCurrentMonth: true });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, nextDay);
    cells.push({ day: nextDay, dateKey: formatDateKey(nextDay, d.getMonth() + 1, d.getFullYear()), inCurrentMonth: false });
    nextDay++;
  }

  return cells;
}
