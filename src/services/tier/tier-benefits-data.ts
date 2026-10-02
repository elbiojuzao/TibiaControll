/**
 * Bônus (em %) que cada tier dá ao item, por efeito do Exaltation Forge.
 * Fontes: tibia.fandom.com/wiki/Equipment_Upgrade, guildstats.eu (guia da Forja) e
 * tibiaroute.com (Exaltation Overload — os valores do tier 2 conferem). O tier 0 não dá bônus.
 * A tabela é a mesma pra qualquer classificação; a classe só limita o tier máximo
 * (ver MAX_TIER_BY_CLASSIFICATION). Atualizar aqui se a CipSoft mudar os valores.
 */

export type TierEffectKey = 'onslaught' | 'ruse' | 'momentum' | 'transcendence' | 'amplification';

export interface TierEffect {
  key: TierEffectKey;
  name: string;
  slot: string;
  description: string;
  /** Índice 0 = tier 1 ... índice 9 = tier 10 */
  valuesByTier: number[];
}

export const TIER_EFFECTS: TierEffect[] = [
  {
    key: 'onslaught',
    name: 'Onslaught (Fatal)',
    slot: 'Armas',
    description: 'Chance de um golpe fatal: +60% de dano extra no ataque.',
    valuesByTier: [0.5, 1.05, 1.7, 2.45, 3.3, 4.25, 5.3, 6.45, 7.7, 9.05],
  },
  {
    key: 'ruse',
    name: 'Ruse (Dodge)',
    slot: 'Armaduras',
    description: 'Chance de desviar completamente de um ataque, sem tomar dano.',
    valuesByTier: [0.5, 1.03, 1.62, 2.28, 3.0, 3.78, 4.62, 5.52, 6.48, 7.51],
  },
  {
    key: 'momentum',
    name: 'Momentum',
    slot: 'Capacetes',
    description: 'A cada 2 segundos, chance de reduzir em 2s o cooldown de todas as suas skills.',
    valuesByTier: [2.0, 4.05, 6.2, 8.45, 10.8, 13.25, 15.8, 18.45, 21.2, 24.05],
  },
  {
    key: 'transcendence',
    name: 'Transcendence',
    slot: 'Calças (legs)',
    description: 'Chance de ativar o Avatar (nível 3) por 7 segundos enquanto ataca.',
    valuesByTier: [0.13, 0.27, 0.44, 0.64, 0.86, 1.11, 1.38, 1.68, 2.0, 2.35],
  },
  {
    key: 'amplification',
    name: 'Amplification',
    slot: 'Botas',
    description: 'Amplifica a chance de ativação dos outros efeitos de tier equipados em você.',
    valuesByTier: [2.5, 5.4, 9.1, 13.6, 18.9, 25.0, 31.9, 39.6, 48.1, 57.4],
  },
];

export const TIER_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
