import { describe, expect, it } from 'vitest';
import { computeCoinSaleTotal } from './drop-form-calculations';

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
