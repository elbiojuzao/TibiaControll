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
import classNames from 'classnames';
import { RootContext } from '../context';

import styles from './VocationSelector.module.css';

const VOCATIONS: Vocation[] = [ 'knight', 'druid', 'paladin', 'sorcerer', 'monk' ]

export const VocationSelector: React.FC = () => {
  const { vocation, setVocation } = useContext(RootContext);

  return <div className={styles.vocationSelector}>
    { VOCATIONS.map((voc) => <button
      key={voc}
      className={classNames(voc === vocation && styles.active)}
      onClick={() => setVocation(voc)}>
        { voc }
    </button>) }
  </div>;
}
