import { describe, expect, it } from 'vitest';
import { buildCoinSaleMessage, computeCoinSaleTotal, computeUnitCoins, formatCoinsWithKK } from './drop-form-calculations';

describe('computeCoinSaleTotal', () => {
  it('multiplica a cotação da coin pela quantidade de coins vendidas', () => {
    expect(computeCoinSaleTotal(45_000, 3_000)).toBe(135_000_000);
  });

  it('arredonda pra gold inteiro quando o produto sai fracionado', () => {
    expect(computeCoinSaleTotal(45_000.5, 3)).toBe(135_002);
  });

  it('zera quando qualquer lado é zero, negativo ou não numérico', () => {
    expect(computeCoinSaleTotal(0, 3_000)).toBe(0);
    expect(computeCoinSaleTotal(45_000, 0)).toBe(0);
    expect(computeCoinSaleTotal(-1, 3_000)).toBe(0);
    expect(computeCoinSaleTotal(Number.NaN, 3_000)).toBe(0);
    expect(computeCoinSaleTotal(45_000, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('computeUnitCoins', () => {
  it('divide as coins vendidas pelos jogadores da party', () => {
    expect(computeUnitCoins(3_000, 4)).toBe(750);
  });

  it('arredonda pra baixo — o resto fica com quem vendeu', () => {
    expect(computeUnitCoins(2_500, 3)).toBe(833);
    expect(computeUnitCoins(10, 4)).toBe(2);
  });

  it('devolve 0 sem jogador, sem coins ou com valor inválido', () => {
    expect(computeUnitCoins(3_000, 0)).toBe(0);
    expect(computeUnitCoins(0, 4)).toBe(0);
    expect(computeUnitCoins(-5, 4)).toBe(0);
    expect(computeUnitCoins(Number.NaN, 4)).toBe(0);
  });
});

describe('formatCoinsWithKK', () => {
  it('mostra as coins com o equivalente em kk entre parênteses, sem o sinal +', () => {
    expect(formatCoinsWithKK(750, 45_000)).toBe('750 coins (33.75kk)');
    expect(formatCoinsWithKK(3_000, 45_000)).toBe('3.000 coins (135kk)');
  });

  it('sem cotação da coin mostra só as coins', () => {
    expect(formatCoinsWithKK(750, 0)).toBe('750 coins');
  });
});

describe('buildCoinSaleMessage', () => {
  it('diz que foi pago em coins e põe o equivalente em kk em cada quantia', () => {
    const msg = buildCoinSaleMessage(
      'Arboreal Crown', 'Plunder', '31/12/2027', 3_000, 45_000,
      [{ name: 'Koe Psciko', amount: 750 }],
      [{ name: 'Bruxxo', amount: 375 }],
    );
    expect(msg).toContain('*Arboreal Crown — Plunder 31/12*');
    expect(msg).toContain('💰 Venda: *3.000 coins (135kk)* — pago em coins');
    expect(msg).toContain('* Koe Psciko — 750 coins (33.75kk)');
    expect(msg).toContain('* Bruxxo — 375 coins (16.88kk)');
    expect(msg).toContain('*Total: 3.000 coins (135kk)*');
  });
});
