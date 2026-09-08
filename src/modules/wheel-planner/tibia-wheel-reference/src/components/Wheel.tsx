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

import React, { useContext, useState } from 'react';
import { RootContext } from '../context';

import largeIcons from '../../assets/skillwheel/icons-skillwheel-largeperks.webp';
import mediumIcons from '../../assets/skillwheel/icons-skillwheel-mediumperks.webp';
import smallIcons from '../../assets/skillwheel/icons-skillwheel-smallperks.webp';

import styles from './Wheel.module.css';
import data from '../../data.yaml';
import { cssVars } from '../utils';
import { WheelSlice } from './WheelSlice';
import { Widget } from './Widget';
import { WheelRevelation } from './WheelRevelation';
import { GameCodeImportExport } from './GameCodeImportExport';

/** Todas as vocações usam a mesma rotação (2026-09-04): os graus antigos (90/-90/180/0)
 * compensavam uma inconsistência real dos dados de 2022, em que "Gift of Life" caía num
 * domínio diferente por vocação — corrigido junto com a reescrita de `data.yaml` (agora
 * TODAS as vocações têm Gift of Life fixo no domínio 0), então a rotação não precisa mais
 * compensar nada. */
const ROTATIONS: Record<Vocation, number> = {
  knight: 0,
  paladin: 0,
  sorcerer: 0,
  druid: 0,
  monk: 0,
};
const CORNERS = new Array(4).fill(0).map((_, i) => i);
const SLICES = new Array(36).fill(0).map((_, i) => 35 - i);

/** Tamanho REAL do sprite antigo (2022) — não o tamanho do catálogo novo. Só os perks com
 * `icon` definido em data.yaml usam esses patterns; o resto cai no emoji (ver
 * WheelSlice.tsx/PerkIcon.tsx). Ver comentário de `icon?` em types.d.ts. */
const OLD_MEDIUM_SPRITE_COUNT = 37;
const OLD_SMALL_SPRITE_COUNT = 9;

export const Wheel: React.FC = () => {
  const {
    vocation,
    pointsLeft,
    pointsMax,
    reset,
    setLevel,
  } = useContext(RootContext);

  /** Campo de pontos máximos editável (2026-09-05, pedido do usuário: "no campo de used
   * points vamos trocar o 4000 por um campo aonde o usuario pode colocar um valor e esse
   * ser o maximo de pontos que pode ser gasto") — o `RootContextProvider` deles calcula
   * `pointsMax = level - 50` a partir de "level" (pensado pra colar o nível do
   * personagem); aqui a gente edita esse "level" indiretamente, sempre em função do valor
   * de pontos máximos que o usuário digita, sem expor o conceito de "level" na UI. */
  function onMaxPointsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
    setLevel(value + 50);
  }

  /** Nomes das casas (tipo xadrez, ex.: A2a) começam ESCONDIDOS (2026-09-05, pedido do
   * usuário) — só aparecem quando ligados aqui, pra não poluir a roda por padrão. */
  const [ showLabels, setShowLabels ] = useState(false);

  return <section
    className={styles.wheel}
    style={cssVars({ rotation: `${ROTATIONS[vocation]}deg` })}>
      <svg width="522" height="522" xmlns="http://www.w3.org/2000/svg" fill="transparent">
        <defs>
          { new Array(OLD_MEDIUM_SPRITE_COUNT).fill(0).map((_, i) => <pattern
            key={`medium-${i}`}
            id={`medium-${i}`}
            patternUnits="userSpaceOnUse"
            width="30"
            height="30">
              <image
                href={mediumIcons}
                x={i * -30}
                y="0"
                width={30 * OLD_MEDIUM_SPRITE_COUNT}
                height="30"/>
          </pattern>) }
          { new Array(OLD_SMALL_SPRITE_COUNT).fill(0).map((_, i) => <pattern
            key={`small-${i}`}
            id={`small-${i}`}
            patternUnits="userSpaceOnUse"
            width="16"
            height="16">
              <image
                href={smallIcons}
                x={i * -16}
                y="0"
                width={16 * OLD_SMALL_SPRITE_COUNT}
                height="16"/>
          </pattern>) }
          { new Array(data.revelation.length).fill(0).map((_, i) => <pattern
            key={`large-${i}`}
            id={`large-${i}`}
            patternUnits="userSpaceOnUse"
            width="34"
            height="34">
              <image
                href={largeIcons}
                x={i * -34}
                y="0"
                width={34 * data.revelation.length}
                height="34"/>
          </pattern>) }
        </defs>
        <g transform="translate(261, 261)">
          { CORNERS.map((i) => <WheelRevelation key={`corner-${i}`} index={i} showLabel={showLabels}/>)}
          { SLICES.map((i) => <WheelSlice key={`slice-${i}`} index={i} showLabel={showLabels}/>) }
        </g>
      </svg>
      <Widget>
        <p>
          Used points: { pointsMax - pointsLeft }/
          <input
            className="campo-input"
            type="number"
            min={0}
            value={Math.max(0, pointsMax)}
            onChange={onMaxPointsChange}
            style={{ display: 'inline-block', width: '70px', margin: '0 4px', padding: '2px 6px' }}
          />
          <button
            className="botao-secundario"
            style={{ float: 'right', padding: '4px 10px' }}
            onClick={reset}>
              reset
          </button>
        </p>
        <p>
          <label className="label-checkbox">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)}/>
            Mostrar nomes das casas
          </label>
        </p>
        <details>
          <summary>Usage</summary>
          <p>
            The interface works like in the game - click to select a perk and use buttons
            to add or remove points. Right click on a slice to fill it completely; if it's already
            full or you have no points left it will be cleared instead.
          </p>
          <p>
            You can share your builds using the URL - it automatically updates on any change.
          </p>
        </details>
      </Widget>
      <GameCodeImportExport/>
  </section>;
}
