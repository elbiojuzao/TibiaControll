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

import React, { useContext, useMemo, useRef } from 'react';
import { RootContext } from '../context';
import { contextToCip } from '../utils';

import styles from './ClientCode.module.css';

export const ClientCode: React.FC = () => {
  const {
    vocation,
    perks,
    level
  } = useContext(RootContext);
  const input = useRef<HTMLInputElement>(null);

  const code = useMemo(() => contextToCip({ vocation, perks, level }), [ vocation, perks, level ]);

  function copyCode() {
    input.current?.select();
    document.execCommand("copy");
    window.getSelection()?.removeAllRanges();
  }

  return <div className={styles.code}>
    <label htmlFor="client-code">Client code:</label>
    <input className="campo-input" ref={input} id="client-code" name="client-code" readOnly value={code}/>
    <button onClick={copyCode}>📋</button>
  </div>;
};
