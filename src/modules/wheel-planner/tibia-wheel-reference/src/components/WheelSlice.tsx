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

import styles from './WheelSlice.module.css';
import data from '../../data.yaml';
import { createSVGArc, deg2rad, iconCircle, iconIndexInCircle, iconSection, perkAvailable, rotate } from '../utils';
import { RootContext } from '../context';
import classNames from 'classnames';
import { convictionEmoji, dedicationEmoji } from '../perk-emoji';
import { sliceLabel } from '../slice-label';
import { realConvictionIconUrl } from '../real-perk-icons';
import { gemElementIconUrlAtPosition, vesselSlotPosition } from '../gem-logic';

// TODO: this is a bit of a mess, maybe clean up all the variables?

interface Props {
  index: number;
  showLabel: boolean;
}

export const WheelSlice: React.FC<Props> = ({ index, showLabel }) => {
  const {
    perks,
    pointsLeft,
    vocation,
    setPerk,
    selectedPerk,
    selectPerk,
    gems,
  } = useContext(RootContext);

  const r = iconCircle(index);
  const section = iconSection(index);
  const maxPoints = data.pointsPerCircle[r];
  const p = (perks[index]) / maxPoints;
  const indexInCircle = iconIndexInCircle(index);
  const segmentDeg = 360 / data.slicesPerCircle[r];
  const angle = 360 / data.slicesPerCircle[r] * (indexInCircle + 1);
  const iconOffset = r === 3 ? indexInCircle % 2 === 0 ? 0.35 : 0.65 : 0.5;
  const radius = r * 52 + 26;
  const segment = deg2rad(segmentDeg);
  const convictionIndex = data.perks.conviction[vocation][index];
  const dedicationIndex = data.perks.dedication[index];
  const convictionPerk = data.conviction[convictionIndex];
  const dedicationPerk = data.dedication[dedicationIndex];
  /** Se essa fatia é uma das 3 de Vessel Resonance do domínio e a posição dela (0/1/2, em
   * ordem de anel) recebeu um mod de proteção elemental da gema do domínio, essa imagem
   * substitui o ícone padrão (2026-09-05, pedido do usuário: "substituir a imagem do
   * vessel vazio pela imagem da proteção" — corrigido pra usar a gema do DOMÍNIO, não da
   * fatia, ver gem-logic.ts). */
  const gemIcon = gemElementIconUrlAtPosition(gems[section], vesselSlotPosition(index));
  const convictionRealIcon = gemIcon ?? realConvictionIconUrl(convictionPerk.name);
  const [ iconX, iconY ] = rotate(radius, 0, segment * iconOffset - deg2rad(angle));
  const isAvailable = perkAvailable(perks, index);
  
  const arcRadius = r * 52;
  const innerWidth = 50 * p + 1;
  const inner = createSVGArc(arcRadius, innerWidth, segment);
  const outer = createSVGArc(arcRadius + innerWidth, 50 - innerWidth + 1, segment);
  const hover = createSVGArc(arcRadius, r === 4 ? 50.5 : 52, segment * (r === 4 ? 0.67 : r === 3 ? 0.68 : 1));
  const isSelected = selectedPerk === index;
  const hoverTransform = r === 4
    ? `rotate(${segmentDeg * -0.165})`
    : r === 3
      ? `rotate(${segmentDeg * (indexInCircle % 2 === 0 ? 0: -0.32)})`
      : '';

  function onRightClick(e: React.MouseEvent) {
    e.preventDefault();

    if (perks[index] === maxPoints || pointsLeft === 0) {
      setPerk(index, 0);
      return;
    }

    setPerk(index, perks[index] + pointsLeft);
  }

  function onClick() {
    selectPerk(isSelected ? null : index);
  }

  return <g
    transform={`rotate(${angle})`}
    className={classNames(
      styles.slice,
      styles[`section-${section}`],
      isSelected && styles.selected,
      !isAvailable && styles.locked,
    )}
    onClick={onClick}
    onContextMenu={onRightClick}>
      <defs>
        <path d={hover} id={`hover-${index}`}/>
        <clipPath id={`hover-clip-${index}`}>
          <use xlinkHref={`#hover-${index}`}/>
        </clipPath>
      </defs>
    <path className={styles.outer} d={outer}/>
    <path className={styles.inner} d={inner}/>
    <path
      className={styles.hover}
      d={hover}
      clipPath={`url(#hover-clip-${index})`}
      transform={hoverTransform}
      />
    <g transform={`rotate(${-angle}) translate(${Math.round(iconX)}, ${Math.round(iconY)})`}>
      <circle r="15" fill="#00000080"/>
      { convictionPerk.icon !== undefined
        ? <rect width="30" height="30" transform="translate(-15, -15)" fill={`url(#medium-${convictionPerk.icon})`}/>
        : convictionRealIcon
          ? <image href={convictionRealIcon} width="30" height="30" transform="translate(-15, -15)" style={{ imageRendering: 'pixelated' }}/>
          : <text fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize="16">{convictionEmoji(convictionPerk.name)}</text> }
      { dedicationPerk.icon !== undefined
        ? <rect width="16" height="16" transform="translate(-24, 1)" fill={`url(#small-${dedicationPerk.icon})`}/>
        : <text fill="#ffffff" x="-16" y="9" textAnchor="middle" dominantBaseline="central" fontSize="11">{dedicationEmoji(dedicationIndex)}</text> }
    </g>
    { showLabel && <g transform={`rotate(${-angle}) translate(${Math.round(iconX)}, ${Math.round(iconY) + 20})`}>
      <text textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#ffffffb0" style={{ pointerEvents: 'none' }}>{sliceLabel(index)}</text>
    </g> }
  </g>;
}
