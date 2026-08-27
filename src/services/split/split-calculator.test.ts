import { describe, it, expect } from 'vitest';
import { calculateSplit, formatTibiaGold, parseTibiaGold } from './split-calculator';
import type { SplitCalculationInput } from '@/types';

describe('formatTibiaGold', () => {
  it('formata valores positivos com prefixo + e separador de milhar pt-BR', () => {
    expect(formatTibiaGold(1234567)).toBe('+1.234.567');
  });

  it('formata zero com prefixo + (padrão já usado nas telas de item pendente)', () => {
    expect(formatTibiaGold(0)).toBe('+0');
  });

  it('formata valores negativos com sinal de menos (bug real: saldo negativo de split saía sem sinal nenhum, "500" em vez de "-500")', () => {
    expect(formatTibiaGold(-500)).toBe('-500');
    expect(formatTibiaGold(-1234567)).toBe('-1.234.567');
  });
});

describe('parseTibiaGold', () => {
  it('extrai o número de uma string formatada com pontos e prefixo', () => {
    expect(parseTibiaGold('+1.234.567')).toBe(1234567);
  });

  it('mantém o sinal negativo', () => {
    expect(parseTibiaGold('-500')).toBe(-500);
  });

  it('retorna 0 para string sem nenhum dígito', () => {
    expect(parseTibiaGold('abc')).toBe(0);
  });
});

describe('calculateSplit', () => {
  it('retorna resultado vazio quando não há jogadores ativos', () => {
    const result = calculateSplit({ players: [] });
    expect(result.activePlayerCount).toBe(0);
    expect(result.fairShare).toBe(0);
    expect(result.globalBalance).toBe(0);
    expect(result.transfers).toEqual([]);
    expect(result.playerBalances).toEqual([]);
  });

  it('ignora jogadores marcados como excluídos no cálculo da cota', () => {
    const input: SplitCalculationInput = {
      players: [
        { name: 'A', balance: 300, waste: 0 },
        { name: 'B', balance: 300, waste: 0, excluded: true },
      ],
    };
    const result = calculateSplit(input);
    expect(result.activePlayerCount).toBe(1);
    expect(result.fairShare).toBe(300);
  });

  it('marca jogadores com saldo igual à cota justa como "settled", sem transferência', () => {
    const input: SplitCalculationInput = {
      players: [
        { name: 'A', balance: 100, waste: 0 },
        { name: 'B', balance: 100, waste: 0 },
      ],
    };
    const result = calculateSplit(input);
    expect(result.fairShare).toBe(100);
    expect(result.transfers).toEqual([]);
    expect(result.playerBalances.every((p) => p.role === 'settled')).toBe(true);
  });

  it('gera 1 transferência do devedor pro credor quando só 2 jogadores têm saldos diferentes', () => {
    const input: SplitCalculationInput = {
      players: [
        { name: 'A', balance: 1000, waste: 0 },
        { name: 'B', balance: 0, waste: 0 },
      ],
    };
    const result = calculateSplit(input);
    expect(result.fairShare).toBe(500);
    expect(result.transfers).toEqual([
      { from: 'A', to: 'B', amount: 500, tibiaCommand: 'transfer 500 to B' },
    ]);
  });

  it('subtrai gastos extras do saldo global antes de dividir a cota justa', () => {
    const input: SplitCalculationInput = {
      players: [
        { name: 'A', balance: 600, waste: 0 },
        { name: 'B', balance: 600, waste: 0 },
      ],
      extraExpenses: [{ amount: 200, paidBy: 'A' }],
    };
    const result = calculateSplit(input);
    expect(result.globalBalance).toBe(1000);
    expect(result.fairShare).toBe(500);
  });

  it('resolve matchmaking com múltiplos credores e devedores', () => {
    const input: SplitCalculationInput = {
      players: [
        { name: 'A', balance: 900, waste: 0 }, // devedor: +600 sobre a cota
        { name: 'B', balance: 300, waste: 0 }, // exatamente na cota
        { name: 'C', balance: 0, waste: 0 },   // credor: -300 sobre a cota
        { name: 'D', balance: 0, waste: 0 },   // credor: -300 sobre a cota
      ],
    };
    const result = calculateSplit(input);
    expect(result.fairShare).toBe(300);
    const totalTransferido = result.transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferido).toBe(600);
    expect(result.transfers.every((t) => t.from === 'A')).toBe(true);
  });
});
