/**
 * Import/export do código REAL do jogo (2026-09-05, pedido do usuário: "estude sobre a
 * importação e exportação de roda de habilidade... o jogo aceita a importação e export
 * deste site [tibiapal.com]"). Não é código do gitlab.com/klhio/tibia-wheel original — é
 * uma implementação nova, baseada em engenharia reversa.
 *
 * O gerador de código do tibiapal.com roda dentro de um módulo WebAssembly compilado
 * (ilegível). O formato, porém, é o MESMO que o cliente oficial do jogo entende (você cola
 * o código copiado do jogo num planner, ou vice-versa) — e esse formato está documentado em
 * código Lua LEGÍVEL no otclient (cliente alternativo open-source de Tibia, precisa
 * implementar o mesmo formato pra interoperar com servidores reais):
 * https://github.com/opentibiabr/otclient/blob/main/modules/game_wheel/classes/wheelclass.lua
 * (funções onImportConfig/onExportConfig/getExportCode) e
 * https://github.com/opentibiabr/otclient/blob/main/modules/corelib/string.lua
 * (pack_custom/unpack_custom, confirma little-endian pro campo de pontos).
 *
 * FORMATO (ex.: "K0Y2AgDP4jAQA"):
 * - 2 caracteres de prefixo = vocação: K0=knight, P0=paladin, S0=sorcerer, D0=druid, M0=monk.
 * - resto = base64 URL-safe (`-`/`_` no lugar de `+`/`/`, sem padding `=`) de bytes:
 *   - bytes[0..1]: pontos totais disponíveis (uint16 little-endian) — equivale ao nosso
 *     `pointsMax` (= level - 50 no RootContextProvider).
 *   - bytes[2..37] (até 36, o que faltar no fim conta como 0): pontos investidos por
 *     fatia, 1 byte cada, numa ORDEM PRÓPRIA DO JOGO — agrupados de 9 em 9 por domínio
 *     (TL/TR/BR/BL, na ordem que o código do otclient usa), e dentro de cada grupo de 9
 *     sempre em ordem crescente de anel: 1 fatia do anel1 + 2 do anel2 + 3 do anel3 + 2 do
 *     anel4 + 1 do anel5 — confirmado batendo o `maxPoints` de cada posição (WheelBonus no
 *     otclient) contra `pointsPerCircle` (data.yaml). Os 4 grupos batem exatamente com os
 *     4 domínios de tela já confirmados neste projeto (raw domain 0=SE,1=SW,2=NW,3=NE).
 *   - bytes[38..41]: até 4 gemas do Ateliê (255 = nenhuma) — não usamos (sem Ateliê no
 *     nosso planner), sempre omitidos/ignorados.
 *
 * RISCO CONHECIDO: dentro de um grupo com mais de 1 fatia por anel (anel2: 2, anel3: 3,
 * anel4: 2), não foi possível confirmar com 100% de certeza a DIREÇÃO da sub-ordem (qual
 * sub-posição nossa bate com qual posição no fluxo de bytes do jogo) só por leitura
 * estática do otclient — assumimos aqui que segue a mesma direção de `iconIndexInCircle`
 * (utils.ts). Se um teste com código real do jogo mostrar que está invertido pra algum
 * anel, ajustar só `SUB_POSITION_DIRECTION` abaixo (não muda o resto do formato).
 */
import base64js from 'base64-js';
import data from '../data.yaml';
import { iconCircle, iconIndexInCircle, iconSection } from './utils';

const VOCATION_PREFIX: Record<Vocation, string> = {
  knight: 'K0',
  paladin: 'P0',
  sorcerer: 'S0',
  druid: 'D0',
  monk: 'M0',
};

const PREFIX_TO_VOCATION: Record<string, Vocation> = Object.fromEntries(
  Object.entries(VOCATION_PREFIX).map(([vocation, prefix]) => [prefix, vocation as Vocation]),
);

/** Offset (dentro do bloco de 36 bytes) de cada grupo de domínio do JOGO, indexado pelo
 * domínio BRUTO do nosso próprio código (`iconSection()`): raw0=SE(grupo BR, offset 18),
 * raw1=SW(grupo BL, offset 27), raw2=NW(grupo TL, offset 0), raw3=NE(grupo TR, offset 9). */
const GAME_GROUP_OFFSET_BY_RAW_DOMAIN = [18, 27, 0, 9];

/** Se um teste real mostrar a sub-ordem invertida pra algum anel, trocar o `false` pra
 * `true` no anel correspondente (chave = número do anel, 0-4). */
const SUB_POSITION_REVERSED: Record<number, boolean> = {
  0: false,
  1: false,
  2: false,
  3: false,
  4: false,
};

function gameOffsetWithinGroup(ring: number, subPosition: number, slotsPerDomain: number): number {
  const pos = SUB_POSITION_REVERSED[ring] ? slotsPerDomain - 1 - subPosition : subPosition;

  switch (ring) {
    case 0: return 0;
    case 1: return 1 + pos;
    case 2: return 3 + pos;
    case 3: return 6 + pos;
    case 4: return 8;
    default: throw new Error(`invalid ring: ${ring}`);
  }
}

/** Índice nosso (0-35) -> posição do byte de pontos investidos no formato do jogo (0-35,
 * dentro do bloco de 36 — some 2 pra virar posição real dentro do buffer completo). */
function ourIndexToGameSlot(index: number): number {
  const ring = iconCircle(index);
  const domain = iconSection(index);
  const posInRing = iconIndexInCircle(index);
  const slotsPerDomain = data.slicesPerCircle[ring] / 4;
  const subPosition = posInRing % slotsPerDomain;

  return GAME_GROUP_OFFSET_BY_RAW_DOMAIN[domain] + gameOffsetWithinGroup(ring, subPosition, slotsPerDomain);
}

/** Tabela inversa (posição do byte do jogo -> índice nosso), computada uma vez. */
const GAME_SLOT_TO_OUR_INDEX: number[] = new Array(36);
for (let ourIndex = 0; ourIndex < 36; ourIndex++) {
  GAME_SLOT_TO_OUR_INDEX[ourIndexToGameSlot(ourIndex)] = ourIndex;
}

function toUrlSafeBase64(standard: string): string {
  return standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(urlSafe: string): string {
  let standard = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  while (standard.length % 4 !== 0) {
    standard += '=';
  }
  return standard;
}

export function encodeGameWheelCode(
  vocation: Vocation,
  pointsMax: number,
  perks: Record<number, number>,
): string {
  const bytes = new Uint8Array(2 + 36);
  const clampedPoints = Math.max(0, Math.min(65535, Math.round(pointsMax)));
  bytes[0] = clampedPoints & 0xff;
  bytes[1] = (clampedPoints >> 8) & 0xff;

  for (let ourIndex = 0; ourIndex < 36; ourIndex++) {
    const gameSlot = ourIndexToGameSlot(ourIndex);
    bytes[2 + gameSlot] = Math.max(0, Math.min(255, Math.round(perks[ourIndex] ?? 0)));
  }

  const base64 = base64js.fromByteArray(bytes);
  return VOCATION_PREFIX[vocation] + toUrlSafeBase64(base64);
}

export interface DecodedGameWheelCode {
  vocation: Vocation;
  pointsMax: number;
  perks: Record<number, number>;
}

export function decodeGameWheelCode(rawCode: string): DecodedGameWheelCode | null {
  const code = rawCode.trim();
  if (code.length < 3) {
    return null;
  }

  const vocation = PREFIX_TO_VOCATION[code.slice(0, 2)];
  if (!vocation) {
    return null;
  }

  let bytes: Uint8Array;
  try {
    bytes = base64js.toByteArray(fromUrlSafeBase64(code.slice(2)));
  } catch {
    return null;
  }

  if (bytes.length < 2) {
    return null;
  }

  const pointsMax = bytes[0] | (bytes[1] << 8);
  const perks: Record<number, number> = {};
  for (let i = 0; i < 36; i++) {
    perks[i] = 0;
  }

  for (let gameSlot = 0; gameSlot < 36 && 2 + gameSlot < bytes.length; gameSlot++) {
    const ourIndex = GAME_SLOT_TO_OUR_INDEX[gameSlot];
    const ring = iconCircle(ourIndex);
    const maxForRing = data.pointsPerCircle[ring];
    perks[ourIndex] = Math.max(0, Math.min(maxForRing, bytes[2 + gameSlot]));
  }

  return { vocation, pointsMax, perks };
}
