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
import type { FormEvent } from 'react';
import { RootContext } from '../context';

const VOCATION_MAP: Record<string, Vocation> = {
  'Elite Knight': 'knight',
  'Knight': 'knight',
  'Elder Druid': 'druid',
  'Druid': 'druid',
  'Royal Paladin': 'paladin',
  'Paladin': 'paladin',
  'Master Sorcerer': 'sorcerer',
  'Sorcerer': 'sorcerer',
};

export const CharacterSearch: React.FC = () => {
  const { setCharacter } = useContext(RootContext);
  const [ search, setSearch ] = useState('');
  const [ error, setError ] = useState('');

  function onInput(e: FormEvent<HTMLInputElement>) {
    setError('');
    setSearch((e.target as HTMLInputElement).value);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const res = await fetch(`https://api.tibiadata.com/v3/character/${encodeURIComponent(search)}`);
    const json = await res.json();
    const { character } = json.characters;
    
    if (character.name.toLowerCase() !== search.toLowerCase()) {
      setError(`Character "${search}" not found!`);
      return;
    }

    setCharacter(character.level, VOCATION_MAP[character.vocation]);
  }

  return <form onSubmit={onSubmit}>
    <input className="campo-input" placeholder="character search" value={search} onInput={onInput}/>
    { error && <span>{ error }</span> }
  </form>;
};
