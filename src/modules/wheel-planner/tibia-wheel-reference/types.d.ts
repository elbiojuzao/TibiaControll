/* 
 * This file is part of Tibia Wheel.
 * Copyright (c) 2022 Maciej Sopyło
 * 
 * Tibia Wheel is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU Lesser General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * Tibia Wheel is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

declare type Vocation = 'knight' | 'paladin' | 'sorcerer' | 'druid' | 'monk';

interface IconPos {
  x: number;
  y: number;
}

interface DedicationPerkBase {
  name: string;
  icon: number;
  template: string;
}

interface DedicationPerkVocation extends DedicationPerkBase {
  effect: Record<Vocation, number[]>;
}

interface DedicationPerkFlat extends DedicationPerkBase {
  effect: number[];
}

type DedicationPerk = DedicationPerkVocation | DedicationPerkFlat;

interface ConvictionPerkBase {
  name: string;
  template: string;
  /** Índice no sprite ANTIGO (2022, icons-skillwheel-mediumperks, 37 ícones) — só presente
   * pros conceitos que ainda existem hoje sem mudar (ver OLD_ICON no script que gera
   * data.yaml). Ausente = ícone genuinamente novo (Vessel Resonance, Monk, feitiços
   * renomeados) → cai no fallback de emoji (perk-emoji.ts), 2026-09-05. */
  icon?: number;
}

interface ConvictionPerkAmount extends ConvictionPerkBase {
  amount: number;
}

interface ConvictionPerkTiered extends ConvictionPerkBase {
  t1: string;
  t2: string;
}

interface ConvictionPerkSpecial extends ConvictionPerkBase {
  params: any[];
}

type ConvictionPerk = ConvictionPerkAmount | ConvictionPerkTiered | ConvictionPerkSpecial;

interface RevelationPerk {
  name: string;
  template: string;
  tiers: any[][];
}

declare module '*/data.yaml' {
  interface Data {
    positions: IconPos[];
    dedication: DedicationPerk[];
    conviction: ConvictionPerk[];
    revelation: RevelationPerk[];
    pointsPerCircle: number[];
    slicesPerCircle: number[];
    perks: {
      dedication: number[];
      conviction: Record<Vocation, number[]>;
      revelation: Record<Vocation, number[]>;
    }
  };

  const data: Data;

  export default data;
}

declare module '*.module.css' {
  const styles: Record<string, string>;
  export default styles;
}

