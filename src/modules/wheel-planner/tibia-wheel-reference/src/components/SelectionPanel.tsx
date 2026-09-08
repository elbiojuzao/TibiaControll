/**
 * Painel "Selection" — 2026-09-05, pedido do usuário: reorganizar o layout pra ficar
 * parecido com a referência (screenshot do tibiapal.com), com o campo de adicionar/remover
 * pontos do perk selecionado na COLUNA ESQUERDA da roda (a soma de buffs vai na direita, ver
 * `Summary.tsx`). Não é código do gitlab.com/klhio/tibia-wheel original — é este mesmo bloco
 * (JSX + lógica, sem alteração) que antes vinha DENTRO de `Wheel.tsx` (renderizado embaixo do
 * SVG), só que extraído pra um componente próprio pra poder ficar numa coluna separada no
 * grid de `App.tsx`. O CSS equivalente ao que existia em `Wheel.module.css` (que estilizava
 * esse bloco via `.wheel section article:first-child/nth-child(2)`, escopado à seção da
 * roda) foi replicado em `SelectionPanel.module.css`, escopado a este componente.
 */
import React, { useContext } from 'react';
import { RootContext } from '../context';

import data from '../../data.yaml';
import { iconCircle, iconSection, perkIsTiered } from '../utils';
import { PerkSummary } from './PerkSummary';
import { Widget } from './Widget';
import { GemPicker } from './GemPicker';

import styles from './SelectionPanel.module.css';

export const SelectionPanel: React.FC = () => {
  const { vocation, perks, selectedPerk, setPerk } = useContext(RootContext);

  if (selectedPerk === null) {
    return null;
  }

  function addToSelected(value: number) {
    return () => {
      setPerk(selectedPerk as number, perks[selectedPerk as number] + value);
    };
  }

  const selectedMax = data.pointsPerCircle[iconCircle(selectedPerk)];
  const selectedDedication = data.perks.dedication[selectedPerk];
  const selectedConviction = data.perks.conviction[vocation][selectedPerk];
  const isVessel = data.conviction[selectedConviction].name.startsWith('Vessel Resonance');

  return <div className={styles.stack}>
    <Widget className={styles.selectionPanel}>
      <PerkSummary as="article" type="conviction" index={selectedConviction} value={perkIsTiered(data.conviction[selectedConviction]) ? 0 : 1}/>
      <PerkSummary as="article" type="dedication" index={selectedDedication} value={1}/>
      <fieldset>
        <button onClick={addToSelected(1)}>+1</button>
        <button onClick={addToSelected(10)}>+10</button>
        <button onClick={addToSelected(250)}>+max</button>
        <span>{perks[selectedPerk]}/{selectedMax}</span>
        <button onClick={addToSelected(-250)}>-max</button>
        <button onClick={addToSelected(-10)}>-10</button>
        <button onClick={addToSelected(-1)}>-1</button>
      </fieldset>
    </Widget>
    { isVessel && <GemPicker domain={iconSection(selectedPerk)}/> }
  </div>;
};
