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

import React from 'react';

import { PerkIcon } from './PerkIcon';

import data from '../../data.yaml';
import styles from './PerkSummary.module.css';
import { fillTemplate, perkIsAmount, perkIsSpecial, perkIsTiered } from '../utils';
import classNames from 'classnames';

interface Props {
  type: 'dedication' | 'conviction' | 'revelation';
  index: number;
  value: any;
  vocation?: Vocation;
  as?: React.ElementType;
}

export const PerkSummary: React.FC<Props> = (props) => {
  const { type, index, as: Element = 'li' } = props;

  return <Element className={classNames(styles.perk, styles[type])}>
    <PerkIcon type={type} icon={index}/>
    { type === 'dedication' && <DedicationPerkSummary { ...props }/> }
    { type === 'conviction' && <ConvictionPerkSummary { ...props }/> }
    { type === 'revelation' && <RevelationPerkSummary { ...props }/> }
  </Element>;
};

const DedicationPerkSummary: React.FC<Props> = ({ index, value, vocation }) => {
  const perk = data.dedication[index];
  // shows knight if no vocation specified
  const effect = Array.isArray(perk.effect) ? perk.effect : perk.effect[vocation ?? 'knight'];

  return <>
    <h2>{ fillTemplate(perk.template, effect.map((v) => v * value)) }</h2>
  </>;
};

const ConvictionPerkSummary: React.FC<Props> = ({ index, value }) => {
  const perk = data.conviction[index];

  return <>
    <h2 className={classNames(!perkIsAmount(perk) && styles.special)}>
      { perkIsAmount(perk) ? fillTemplate(perk.template, [ perk.amount * value ]) : perk.name }
    </h2>
    { perkIsSpecial(perk) && <pre>
      { fillTemplate(perk.template, perk.params) }
    </pre> }
    { perkIsTiered(perk) && <pre>
      <span className={classNames(styles.tier1, value >= 1 && styles.active)}>{ perk.t1 }</span>
      <span className={classNames(styles.tier2, value === 2 && styles.active)}>{ perk.t2 }</span>
    </pre> }
  </>;
} ;

const RevelationPerkSummary: React.FC<Props> = ({ index, value }) => {
  const perk = data.revelation[index];
  
  return <>
    <h2>{perk.name} {new Array(value).fill('I').join('')}</h2>
    <pre>
      { value > 0 && fillTemplate(perk.template, perk.tiers[value - 1]) }
    </pre>
  </>;
};
