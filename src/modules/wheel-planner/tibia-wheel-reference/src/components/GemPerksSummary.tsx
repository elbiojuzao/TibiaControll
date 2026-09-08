/**
 * "Gem Perks" no resumo (2026-09-05, pedido do usuário) — lista as gemas equipadas por
 * DOMÍNIO (1 gema por domínio, mods distribuídos pelas 3 fatias — ver
 * GemPicker.tsx/gem-logic.ts). Não é código do gitlab.com/klhio/tibia-wheel original;
 * mesmo padrão visual do Widget usado por Summary.tsx (Dedication/Conviction/Revelation),
 * só que os dados vêm do estado de gemas, não de `perks`.
 */
import React, { useContext } from 'react';
import { RootContext } from '../context';
import {
  GEM_NAMES,
  SUPREME_MODS,
  basicModName,
  basicModValues,
  domainCompassName,
  gemMatchBonus,
} from '../gem-logic';
import { Widget } from './Widget';

export const GemPerksSummary: React.FC = () => {
  const { vocation, gems } = useContext(RootContext);

  const equipped = Object.entries(gems)
    .filter(([, gem]) => gem !== null)
    .map(([domain, gem]) => ({ domain: +domain, gem: gem! }));

  if (equipped.length === 0) {
    return null;
  }

  return <Widget>
    <span>Gem perks:</span>
    <ul>
      { equipped.map(({ domain, gem }) => <li key={domain}>
        <h2>{GEM_NAMES[vocation][gem.size]} ({domainCompassName(domain)})</h2>
        <pre>
          <span>+{gemMatchBonus(gem.size)} Damage and Healing</span>
          { gem.basicMods.filter((slot) => slot.modIndex !== null).map((slot, i) => <span key={i}>
            {basicModName(slot.modIndex as number)}: {basicModValues(slot.modIndex as number, vocation, gem.tier)}
          </span>) }
          { gem.supremeMod?.modIndex !== null && gem.supremeMod !== null && <span>
            {SUPREME_MODS[gem.supremeMod.modIndex as number].name}: {SUPREME_MODS[gem.supremeMod.modIndex as number].values[gem.tier]}
          </span> }
        </pre>
      </li>) }
    </ul>
  </Widget>;
};
