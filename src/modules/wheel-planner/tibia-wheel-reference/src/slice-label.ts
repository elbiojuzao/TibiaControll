import data from '../data.yaml';
import { iconCircle, iconIndexInCircle, iconSection } from './utils';

/** Apelido "tipo xadrez" pra cada fatia/canto da roda (2026-09-04, pedido do usuário pra
 * facilitar de apontar uma posição específica na conversa) — não é parte do código copiado,
 * só um rótulo visual em cima da geometria real. Número = anel (1=centro a 5=borda), letra
 * minúscula extra quando o anel tem mais de 1 fatia por domínio (ex.: anel 2 tem 3 fatias por
 * domínio → A3a/A3b/A3c). O medalhão de Revelation de cada domínio usa só a letra.
 *
 * Letra = posição real na TELA, em ordem de leitura (A=noroeste, B=nordeste, C=sudoeste,
 * D=sudeste) — corrigido em 2026-09-05 (o usuário reportou "a fatia A está invertida"): o
 * índice de domínio bruto (`iconSection()`, 0-3) NÃO renderiza nessa ordem na tela (é
 * SE,SW,NW,NE por como o `WheelRevelation`/`WheelSlice` do código copiado calculam a
 * rotação) — confirmado via inspeção direta do DOM (posição real de `rect[fill^="url(#large-"]`
 * e dos rótulos do anel 0). Esse array só RE-MAPEIA o índice bruto pra letra de tela; não
 * muda nenhum dado de conviction/dedication/revelation, só como ele é rotulado aqui. */
const DOMAIN_LETTER = ['D', 'C', 'A', 'B'];
const SUB_LETTER = ['a', 'b', 'c'];

export function sliceLabel(index: number): string {
  const ring = iconCircle(index);
  const domain = iconSection(index);
  const slotsPerDomain = data.slicesPerCircle[ring] / 4;
  const posInRing = iconIndexInCircle(index);
  const subIndex = posInRing % slotsPerDomain;

  const base = `${DOMAIN_LETTER[domain]}${ring + 1}`;
  return slotsPerDomain > 1 ? `${base}${SUB_LETTER[subIndex]}` : base;
}

export function cornerLabel(domain: number): string {
  return DOMAIN_LETTER[domain];
}
