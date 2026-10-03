import { describe, expect, it } from 'vitest';
import { buildTierCostRows, formatCostKk } from './tier-cost-table';
import { FUSION_GOLD_COST, TRANSFER_GOLD_COST } from './tier-cost-data';

describe('buildTierCostRows', () => {
  const rows = buildTierCostRows();

  it('cobre os tiers 1 a 10 em ordem', () => {
    expect(rows.map((r) => r.tier)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('Fusão e Convergência vêm das mesmas tabelas que a calculadora usa', () => {
    expect(rows[0].fusion.gold).toBe(8_000_000);
    expect(rows[9].fusion.gold).toBe(15_000_000_000);
    expect(rows[0].convergence.gold).toBe(55_000_000);
    expect(rows[9].convergence.gold).toBe(125_000_000_000);
  });

  it('Transferência pelo tier resultante: sem tier 10 (exigiria doador tier 11)', () => {
    expect(rows[0].transfer).toEqual({ gold: 20_000_000, cores: 1 });
    expect(rows[8].transfer).toEqual({ gold: 15_000_000_000, cores: 60 });
    expect(rows[9].transfer).toBeNull();
  });

  it('Transferência por Convergência tem os 10 tiers, até 300kkk e 85 cores', () => {
    expect(rows[0].convergenceTransfer).toEqual({ gold: 65_000_000, cores: 1 });
    expect(rows[9].convergenceTransfer).toEqual({ gold: 300_000_000_000, cores: 85 });
  });

  it('Transferência do tier k custa o mesmo que a Fusão para o tier k+1 (padrão dos preços atuais)', () => {
    for (let k = 1; k <= 9; k++) {
      expect(TRANSFER_GOLD_COST[k]).toBe(FUSION_GOLD_COST[4][k + 1]);
    }
  });
});

describe('formatCostKk', () => {
  it('abrevia em kk/kkk com vírgula decimal e sem sinal', () => {
    expect(formatCostKk(8_000_000)).toBe('8kk');
    expect(formatCostKk(65_000_000)).toBe('65kk');
    expect(formatCostKk(2_500_000_000)).toBe('2,5kkk');
    expect(formatCostKk(5_250_000_000)).toBe('5,25kkk');
    expect(formatCostKk(300_000_000_000)).toBe('300kkk');
  });
});
