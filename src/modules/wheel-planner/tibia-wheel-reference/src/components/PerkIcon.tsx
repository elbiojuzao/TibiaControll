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

import styles from './PerkIcon.module.css';
import data from '../../data.yaml';
import { cssVars } from '../utils';
import classNames from 'classnames';
import { convictionEmoji, dedicationEmoji } from '../perk-emoji';
import { realConvictionIconUrl } from '../real-perk-icons';

interface Props {
  type: 'dedication' | 'conviction' | 'revelation';
  icon: number;
}

/** Revelation Perks têm sprite real (baixado de tibiapal.com, 2026-09-04) — continuam
 * usando o background-image via CSS, indexado pelo catálogo novo direto (o sprite bate
 * 1:1). Dedication/Conviction usam o sprite ANTIGO (2022) só onde o perk tem `icon` definido
 * em data.yaml (mesmo conceito de antes — ver OLD_ICON no gerador de data.yaml); Conviction
 * sem `icon` do sprite antigo tenta um ícone real individual (`real-perk-icons.ts`, 2026-09-05
 * — cobre o Monk inteiro + feitiços renomeados desde 2022); só cai no emoji genérico
 * (perk-emoji.ts) o que não tem nenhum dos dois (Vessel Resonance, "Thousand Fist Blows"). */
export const PerkIcon: React.FC<Props> = ({ type, icon }) => {
  const perk = data[type][icon];

  if (type === 'revelation') {
    return <em
      className={classNames(styles.icon, styles[type])}
      style={cssVars({ icon })}
      title={perk.name}/>;
  }

  const spriteIcon = 'icon' in perk ? perk.icon : undefined;
  if (spriteIcon !== undefined) {
    return <em
      className={classNames(styles.icon, styles[type])}
      style={cssVars({ icon: spriteIcon })}
      title={perk.name}/>;
  }

  if (type === 'conviction') {
    const realIcon = realConvictionIconUrl(perk.name);
    if (realIcon) {
      return <em
        className={classNames(styles.icon, styles[type])}
        style={{ backgroundImage: `url(${realIcon})`, backgroundPosition: '0 0', backgroundSize: 'contain' }}
        title={perk.name}/>;
    }
  }

  const emoji = type === 'dedication' ? dedicationEmoji(icon) : convictionEmoji(perk.name);
  return <em className={classNames(styles.icon, styles[type])} title={perk.name}>{emoji}</em>;
};
