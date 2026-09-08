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
import data from '../../data.yaml';
import { addInObject, iconCircle, iconSection } from '../utils';
import { activeBasicModTotals, BASIC_EFFECTS } from '../gem-logic';

import { PerkSummary } from './PerkSummary';
import { Widget } from './Widget';
import { GemPerksSummary } from './GemPerksSummary';
import perkStyles from './PerkSummary.module.css';

export const Summary: React.FC = () => {
  const {
    perks,
    revelation,
    vocation,
    gems,
  } = useContext(RootContext);

  const dedicationSum: Record<number, number> = {};
  const convictionSum: Record<number, number> = {};

  Object.entries(perks).forEach(([ key, points ]) => {
    const convictionIndex = data.perks.conviction[vocation][+key];
    const dedicationIndex = data.perks.dedication[+key];

    // special case for hp+mp so it doesn't show as a separate perk in the summary
    if (dedicationIndex === 2) {
      addInObject(dedicationSum, 0, points);
      addInObject(dedicationSum, 1, points);
    } else {
      addInObject(dedicationSum, dedicationIndex, points);
    }

    const circle = iconCircle(+key);
    if (points === data.pointsPerCircle[circle]) {
      // Vessel Resonance é uma Conviction Perk como outra qualquer no data.yaml original,
      // mas quando o domínio JÁ TEM uma gema equipada ela deixa de fazer sentido como
      // linha solta aqui — os mods da gema (somados no card de Dedication logo abaixo, ver
      // activeBasicModTotals) já representam esse vessel (2026-09-08, pedido do usuário:
      // "ao preencher um vessel resonance ele esta aparecendo em conviction perks, ele só
      // deve aparecer ali se o usuario não colocar uma gema"). Sem gema no domínio,
      // continua aparecendo normal (comportamento original).
      const isVesselResonance = data.conviction[convictionIndex]?.name?.startsWith('Vessel Resonance');
      const hasGemInDomain = !!gems[iconSection(+key)];
      if (!(isVesselResonance && hasGemInDomain)) {
        addInObject(convictionSum, convictionIndex, 1);
      }
    }
  });

  const dedication = Object.entries(dedicationSum).filter(([, value ]) => value > 0);
  const conviction = Object.entries(convictionSum).filter(([, value ]) => value > 0);
  const showRevelation = revelation.some((value) => value > 0);
  // Mods básicos das gemas equipadas somados por efeito (2026-09-08, pedido do usuário:
  // "a gema selecionada deve aparecer em dedications perks somando todos os valores") —
  // ver activeBasicModTotals em gem-logic.ts.
  const basicModTotals = activeBasicModTotals(gems, perks, vocation);

  return <>
    { (dedication.length > 0 || basicModTotals.length > 0) && <Widget>
      <span>Dedication perks:</span>
      <ul>
        { dedication.map(([ key, value ]) => <PerkSummary
            key={`dedication-${key}`}
            type="dedication"
            vocation={vocation}
            index={+key} value={value}/>)
        }
        { basicModTotals.map(({ effectId, text }) => <li key={`gem-effect-${effectId}`} className={perkStyles.perk}>
            <h2>{text} {BASIC_EFFECTS[effectId].name}</h2>
          </li>)
        }
      </ul>
    </Widget> }
    { conviction.length > 0 && <Widget>
      <span>Conviction perks:</span>
      <ul>
        { conviction.map(([ key, value ]) => <PerkSummary
            key={`conviction-${key}`}
            type="conviction"
            index={+key}
            value={value}/>)
        }
      </ul>
    </Widget> }
    { showRevelation && <Widget>
      <span>Revelation perks:</span>
      <ul>
        { data.perks.revelation[vocation]
          .slice()
          .map((idx, i) => [ idx, revelation[i] ])
          .filter(([, points ]) => points > 0)
          .sort(([ idxA ], [ idxB ]) => idxA - idxB)
          .map(([ idx, points ]) => <PerkSummary
            key={`revelation-${idx}`}
            type="revelation"
            index={+idx}
            value={points}/>) }
      </ul>
    </Widget> }
    <GemPerksSummary/>
  </>;
};
