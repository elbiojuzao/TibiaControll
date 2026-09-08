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

import data from '../data.yaml';
import * as pako from 'pako';
import base64js from 'base64-js';

export function iconCircle(index: number): number {
  if (index < 4) return 0;
  if (index < 12) return 1;
  if (index < 24) return 2;
  if (index < 32) return 3;
  return 4;
}

export function sum(arr: number[]): number {
  return arr.reduce((sum, value) => sum + value, 0);
}

export function addInObject<T extends string | number | symbol>(
  obj: Record<T, number>, key: T, value: number,
) {
  if (!obj[key]) {
    obj[key] = value;
  } else {
    obj[key] += value;
  }
}

export function iconPointsRequirement(index: number): number {
  const circle = iconCircle(index);
  return sum(data.pointsPerCircle.slice(0, circle));
}

export function iconSection(index: number): number {
  const circle = iconCircle(index);
  const previous = sum(data.slicesPerCircle.slice(0, circle));

  return Math.floor((index - previous) / data.slicesPerCircle[circle] * 4);
}

type Perks = Record<number, number>;

export function iconIndexInCircle(index: number): number {
  const circle = iconCircle(index);
  const previous = sum(data.slicesPerCircle.slice(0, circle));
  return index - previous;
}

function iconAngles(index: number): [ number, number ] {
  const circle = iconCircle(index);
  const indexInCircle = iconIndexInCircle(index);
  const slice = 360 / data.slicesPerCircle[circle];
  return [ indexInCircle * slice, indexInCircle * slice + slice ];
}

function perkNeighbours(perks: Perks, index: number): number[] {
  const circle = iconCircle(index);
  if (circle === 0) {
    return [];
  }
  const section = iconSection(index);
  const previous = sum(data.slicesPerCircle.slice(0, circle));
  const indexInCircle = iconIndexInCircle(index);
  const maxInCircle = data.slicesPerCircle[circle];
  const [ startAngle, endAngle ] = iconAngles(index);
  const around = [
    indexInCircle > 0 ? index - 1 : previous + maxInCircle - 1,
    indexInCircle < maxInCircle - 1 ? index + 1 : previous,
    ...Object.entries(perks).filter(([ idx ]) => {
      if (iconCircle(+idx) !== circle - 1) {
        return false;
      }

      const [ start, end ] = iconAngles(+idx);
      return ((start >= startAngle && start <= endAngle) || (end <= endAngle && end >= startAngle)) && iconSection(+idx) === section;
    }).map(([ idx ]) => +idx),
  ];

  if (circle < 3) {
    return around;
  }

  if (circle === 4) {
    around.splice(0, 2);
  }

  if (iconSection(around[0]) !== section) {
    around.splice(0, 1);
  } else if (iconSection(around[1]) !== section) {
    around.splice(1, 1);
  }

  return around;
}

export function perkAvailable(perks: Perks, index: number): boolean {
  const circle = iconCircle(index);
  const neighbours = perkNeighbours(perks, index);
  return circle === 0 ||
         neighbours.some((idx) => perks[idx] === data.pointsPerCircle[iconCircle(idx)]);
}

export function sectionSum(perks: Perks, section: number): number {
  return sum(
    Object.entries(perks)
      .filter(([ idx ]) => iconSection(+idx) === section)
      .map(([ , points ]) => points)
  );
}

export function canReducePerk(perks: Perks, index: number): boolean {
  for (let k in perks) {
    const neighbours = perkNeighbours(perks, +k).filter((idx) => {
      const circle = iconCircle(idx);
      return perks[idx] === data.pointsPerCircle[circle];
    });
    if (perks[k] > 0 && neighbours.includes(index) && neighbours.length === 1) {
      return false;
    }
  }

  return true;
}

export function cssVars(vars: Record<string, any>): React.CSSProperties {
  for (let k in vars) {
    vars[`--${k}`] = vars[k];
    delete vars[k];
  }
  return vars as React.CSSProperties;
}

export function perkIsFlat(perk: DedicationPerk): perk is DedicationPerkFlat {
  return Array.isArray(perk.effect);
}

export function fillTemplate(template: string, params: any[]): string {
  return template.replace(/%(\d)/g, (_, match) => {
    const value = params[+match - 1];
    if (typeof value === 'number' && Math.floor(value) !== value) {
      return value.toFixed(2);
    }

    return value;
  });
}

export function perkIsAmount(perk: ConvictionPerk): perk is ConvictionPerkAmount {
  return perk.hasOwnProperty('amount');
}

export function perkIsTiered(perk: ConvictionPerk): perk is ConvictionPerkTiered {
  return perk.hasOwnProperty('t1');
}

export function perkIsSpecial(perk: ConvictionPerk): perk is ConvictionPerkSpecial {
  return perk.hasOwnProperty('params');
}

const CIP_INDEX_MAP: Record<number, number> = {
  34: 0,
  29: 1,
  20: 2,
  21: 3,
  30: 4,
  35: 5,
  28: 6,
  19: 7,
  9: 8,
  10: 9,
  22: 10,
  31: 11,
  18: 12,
  8: 13,
  2: 14,
  3: 15,
  11: 16,
  23: 17,
  17: 18,
  7: 19,
  1: 20,
  0: 21,
  4: 22,
  12: 23,
  27: 24,
  16: 25,
  6: 26,
  5: 27,
  13: 28,
  24: 29,
  33: 30,
  26: 31,
  15: 32,
  14: 33,
  25: 34,
  32: 35,
}
const INDEX_CIP_MAP: Record<number, number> = Object.entries(CIP_INDEX_MAP)
.reduce((res, [ k, v ]) => ({ ...res, [v]: k }), {});

const CIP_VOCATION_MAP: Record<Vocation, string> = {
  knight: 'EK',
  druid: 'ED',
  paladin: 'RP',
  sorcerer: 'MS',
  monk: 'MK',
};
const VOCATION_CIP_MAP: Record<string, Vocation> = Object.entries(CIP_VOCATION_MAP)
  .reduce((res, [ k, v ]) => ({ ...res, [v]: k }), {});

export function contextToCip(context: DataContext) {
  const buf = new ArrayBuffer(36);
  const byteView = new Uint8Array(buf);

  Object.entries(context.perks).forEach(([ k, v ]) => {
    byteView[CIP_INDEX_MAP[+k]] = v;
  });

  const output = base64js.fromByteArray(byteView);
  return `${CIP_VOCATION_MAP[context.vocation]}${output}`;
}

export function cipToContext(input: string): DataContext {
  const vocation = VOCATION_CIP_MAP[input.slice(0, 2)];
  const data = new Uint8Array(base64js.toByteArray(input.slice(2)));

  const ret: DataContext = {
    level: 50,
    vocation,
    perks: {},
  };

  for (let i = 0; i < 36; i++) {
    ret.perks[INDEX_CIP_MAP[i]] = data[i];
    ret.level += data[i];
  }

  return ret;
}

export function isCipCode(input: string): boolean {
  return input.length === 50 && Object.values(CIP_VOCATION_MAP).includes(input.slice(0, 2));
}

interface DataContext {
  level: number;
  vocation: Vocation;
  perks: Record<number, number>;
}

const VOCATIONS: Vocation[] = [ 'knight', 'druid', 'paladin', 'sorcerer', 'monk' ];
// http://localhost:1234/#eJzrEGYAAiMGMPBmQIAUKD0NRJxgAAAyYALb
export function contextToBinary(context: DataContext) {
  const buf = new ArrayBuffer(39);
  const dataView = new DataView(buf);
  const byteView = new Uint8Array(buf);

  dataView.setUint16(0, context.level, false);
  byteView[2] = VOCATIONS.indexOf(context.vocation);
  Object.entries(context.perks).forEach(([ k, v ]) => {
    byteView[3 + +k] = v;
  });

  const output = pako.deflateRaw(byteView);
  
  return base64js.fromByteArray(output);
}

export function binaryToContext(input: string): DataContext {
  const data = new Uint8Array(base64js.toByteArray(input));
  const result = pako.inflateRaw(data);
  const dataView = new DataView(result.buffer);

  const ret: DataContext = {
    level: dataView.getUint16(0, false),
    vocation: VOCATIONS[result[2]],
    perks: {},
  };

  for (let i = 3; i <= 38; i++) {
    ret.perks[i - 3] = result[i];
  }

  return ret;
}

export const REVELATION_THRESHOLDS = [ 1000, 500, 250, 0 ];

export function levelForRevelation(perks: Perks, section: number) {
  return REVELATION_THRESHOLDS.length - REVELATION_THRESHOLDS.findIndex((v) => v <= sectionSum(perks, section)) - 1;
}

export function progressForRevelation(perks: Perks, section: number) {
  const sum = sectionSum(perks, section);
  const currentLevel = REVELATION_THRESHOLDS.length - levelForRevelation(perks, section) - 1;
  const lastThreshold = REVELATION_THRESHOLDS[currentLevel];
  const nextThreshold = REVELATION_THRESHOLDS[currentLevel - 1];

  if (!nextThreshold) {
    return 1.0;
  }

  return (sum - lastThreshold) / (nextThreshold - lastThreshold);
}

export function deg2rad(degrees: number) {
  return degrees * Math.PI / 180;
}

export function rotate(x: number, y: number, radians: number) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [
    cos * x + sin * y,
    cos * y - sin * x,
  ];
}

export function createSVGArc(radius: number, width: number, segment: number): string {
  const r2 = radius + width;
  const [ xInner, yInner ] = rotate(radius, 0, segment);
  const [ xOuter, yOuter ] = rotate(r2, 0, segment);
  const big = segment > Math.PI;

  return [
    `M${radius} 0`,
    `L${r2} 0`,
    `A${r2} ${r2}, 0, ${big ? 1 : 0}, 0, ${xOuter}, ${yOuter}`,
    `L${xInner} ${yInner}`,
    `A${radius} ${radius}, 0, ${big ? 1 : 0}, 1, ${radius}, 0`,
  ].join('');
}

export function createEmptyPerks(): Perks {
  const ret: Perks = {};
  for (let i = 0; i < 36; i++) {
    ret[i] = 0;
  }
  return ret;
}
