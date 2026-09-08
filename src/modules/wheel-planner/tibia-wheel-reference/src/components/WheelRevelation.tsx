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

import React, { useContext } from 'react';
import { RootContext } from '../context';
import { createSVGArc, progressForRevelation, rotate } from '../utils';
import { corners, balls } from '../wheelCorners';

import styles from './WheelRevelation.module.css';
import data from '../../data.yaml';
import classNames from 'classnames';
import { cornerLabel } from '../slice-label';

interface Props {
  index: number;
  showLabel: boolean;
}

export const WheelRevelation: React.FC<Props> = ({ index, showLabel }) => {
  const { revelation, vocation, perks } = useContext(RootContext);
  const icon = data.perks.revelation[vocation][index];
  const level = revelation[index] as keyof typeof corners;
  // 172 → 261 (center of the svg) - 89 (half of the corner image)
  const [ x, y ] = rotate(172, 172, Math.PI / 2 * -index);
  // 48 → found experimentally to align the icon
  const [ iconX, iconY ] = rotate(48, 48, Math.PI / 2 * -index);
  // 46.5 → same as above
  const [ ballsX, ballsY ] = rotate(46.5, 46.5, Math.PI / 2 * -index);
  const progress = createSVGArc(17, 6, Math.PI * 2 * progressForRevelation(perks, index));

  return <g transform={`translate(${Math.round(x)}, ${Math.round(y)})`}>
    <g transform="translate(-89, -89)">
      <image
        transform={`translate(${89-42.5}, ${89-42.5})`}
        x={ballsX}
        y={ballsY}
        className={styles[`section-${index}`]}
        href={balls[index]}
        width={85}
        height={85}/>
      <image
        href={corners[level][index]}
        width={178}
        height={178}/>
    </g>
    <g
      className={classNames(styles.progress, styles[`psection-${index}`])}
      transform={`translate(${iconX}, ${iconY}) rotate(-90) scale(1 -1)`}>
        <circle r={23}/>
        <path d={progress}/>
    </g>
    <rect
      width={34}
      height={34}
      transform={`translate(${iconX - 17}, ${iconY - 17})`}
      fill={`url(#large-${icon})`}/>
    { showLabel && <text
      x={iconX}
      y={iconY + 28}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="10"
      fill="#ffffffb0"
      style={{ pointerEvents: 'none' }}>{cornerLabel(index)}</text> }
  </g>
};
