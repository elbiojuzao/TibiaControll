import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectXpSnapshots, computeXpGain, todayInBrt } from './xp-collect.js';

describe('todayInBrt', () => {
  it('usa UTC-3: 02:00 UTC ainda é o dia anterior em Brasília', () => {
    expect(todayInBrt(new Date('2026-10-02T02:00:00Z'))).toBe('2026-10-01');
  });

  it('09:30 UTC (horário do cron) cai no próprio dia em Brasília', () => {
    expect(todayInBrt(new Date('2026-10-02T09:30:00Z'))).toBe('2026-10-02');
  });
});

describe('computeXpGain', () => {
  it('diferença entre o total de hoje e o anterior', () => {
    expect(computeXpGain(1_000, 400)).toBe(600);
  });

  it('negativo quando o personagem perdeu XP (morte)', () => {
    expect(computeXpGain(900, 1_000)).toBe(-100);
  });

  it('null sem snapshot anterior (1º dia de coleta)', () => {
    expect(computeXpGain(1_000, null)).toBeNull();
  });
});

describe('collectXpSnapshots', () => {
  let saveCall: { p_secret: string; p_rows: unknown[] } | null;
  let highscoreValues: Record<string, number>;

  beforeEach(() => {
    saveCall = null;
    highscoreValues = { Marugo: 1_500, novato: 700 };
    process.env.VITE_SUPABASE_URL = 'https://fake.supabase.co';
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fake';
    process.env.CRON_SECRET = 'segredo-do-cron';

    vi.stubGlobal('fetch', vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => '' });

      if (url.endsWith('/rpc/xp_cron_targets')) {
        expect(JSON.parse(String(init?.body))).toEqual({ p_secret: 'segredo-do-cron', p_today: '2026-10-02' });
        expect((init?.headers as Record<string, string>).apikey).toBe('sb_publishable_fake');
        return json([
          { member_id: 'm-1', account_id: 'acc-1', character_name: 'Marugo', world: 'Collabra', prev_total: 1_000, done_today: false },
          { member_id: 'm-2', account_id: 'acc-1', character_name: 'Novato', world: 'Collabra', prev_total: null, done_today: false },
          { member_id: 'm-3', account_id: 'acc-1', character_name: 'Sumido', world: 'Collabra', prev_total: 5, done_today: false },
        ]);
      }
      if (url.endsWith('/rpc/xp_cron_save')) {
        saveCall = JSON.parse(String(init?.body));
        return json((saveCall?.p_rows ?? []).length);
      }
      if (url.includes('/highscores/Collabra/experience/all/1')) {
        return json({
          highscores: {
            highscore_list: Object.entries(highscoreValues).map(([name, value]) => ({ name, value })),
            highscore_page: { current_page: 1, total_pages: 1 },
          },
        });
      }
      throw new Error(`fetch inesperado: ${url}`);
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('grava total, total anterior e ganho; um personagem fora do ranking não derruba os outros', async () => {
    const result = await collectXpSnapshots(new Date('2026-10-02T09:30:00Z'));

    expect(result.date).toBe('2026-10-02');
    expect(result.processed).toBe(2);
    expect(result.skippedStaleAccounts).toEqual([]);
    expect(result.alreadyDone).toBe(0);
    expect(result.failed).toEqual([{ character: 'Sumido', reason: 'não apareceu nos Highscores de Collabra' }]);

    expect(saveCall?.p_secret).toBe('segredo-do-cron');
    expect(saveCall?.p_rows).toEqual([
      { member_id: 'm-1', data: '2026-10-02', xp_total: 1_500, xp_total_anterior: 1_000, xp_ganho: 500 },
      { member_id: 'm-2', data: '2026-10-02', xp_total: 700, xp_total_anterior: null, xp_ganho: null },
    ]);
  });

  it('não grava nada quando TODOS os membros da conta vêm com ganho 0 (Highscore desatualizado)', async () => {
    highscoreValues = { Marugo: 1_000 };

    const result = await collectXpSnapshots(new Date('2026-10-02T09:30:00Z'));

    expect(result.processed).toBe(0);
    expect(result.skippedStaleAccounts).toEqual(['acc-1']);
    expect(saveCall).toBeNull();
  });

  it('não consulta nem regrava quem já foi coletado hoje (idempotente)', async () => {
    const base = globalThis.fetch as unknown as (input: string | URL, init?: RequestInit) => Promise<unknown>;
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL, init?: RequestInit) => {
      if (String(input).endsWith('/rpc/xp_cron_targets')) {
        return {
          ok: true, status: 200, text: async () => '',
          json: async () => [{ member_id: 'm-1', account_id: 'acc-1', character_name: 'Marugo', world: 'Collabra', prev_total: 1_000, done_today: true }],
        };
      }
      return base(input, init);
    }));

    const result = await collectXpSnapshots(new Date('2026-10-02T09:30:00Z'));

    expect(result.alreadyDone).toBe(1);
    expect(result.processed).toBe(0);
    expect(saveCall).toBeNull();
  });
});
