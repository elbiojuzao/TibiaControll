/**
 * Ateliê de Gemas (2026-09-05, pedido do usuário) — ver `gem-logic.ts` pro modelo de
 * dados correto (1 gema por DOMÍNIO, mods distribuídos pelas 3 fatias). Não é código do
 * gitlab.com/klhio/tibia-wheel original. Aparece quando a fatia selecionada é uma
 * "Vessel Resonance" (SelectionPanel.tsx) — qualquer uma das 3 do domínio abre o MESMO
 * card, já que a gema é do domínio inteiro, não da fatia individual.
 */
import React, { useContext } from 'react';
import classNames from 'classnames';
import { RootContext } from '../context';
import {
  GEM_NAMES,
  SUPREME_MODS,
  basicModName,
  basicModNameWithValues,
  basicModOptionsForSlot,
  basicModValues,
  createEmptyGem,
  domainCompassName,
  gemMatchBonus,
  maxGemSize,
  supremeModsForVocation,
  vesselResonanceLevel,
} from '../gem-logic';
import type { GemSize } from '../gem-logic';
import { basicModIconUrl, supremeModIconUrl } from '../gem-mod-icons';
import { Widget } from './Widget';

import styles from './GemPicker.module.css';

interface Props {
  domain: number;
}

export const GemPicker: React.FC<Props> = ({ domain }) => {
  const { vocation, perks, gems, setGem } = useContext(RootContext);
  const available = maxGemSize(perks, domain);
  const gem = gems[domain] ?? null;
  const vrLevel = vesselResonanceLevel(perks, domain);

  function selectSize(size: GemSize | -1) {
    setGem(domain, size === -1 ? null : createEmptyGem(size));
  }

  function updateTier(tier: number) {
    if (!gem) return;
    setGem(domain, { ...gem, tier });
  }

  function updateBasicMod(slotIndex: number, modIndex: number | null) {
    if (!gem) return;
    const basicMods = gem.basicMods.slice();
    basicMods[slotIndex] = { modIndex };
    setGem(domain, { ...gem, basicMods });
  }

  function updateSupremeMod(modIndex: number | null) {
    if (!gem?.supremeMod) return;
    setGem(domain, { ...gem, supremeMod: { modIndex } });
  }

  const supremeOptions = supremeModsForVocation(vocation);

  return <Widget className={styles.gemPicker}>
    <span>Ateliê de Gemas</span>

    <div className={styles.slotIndicator}>
      <span className={styles.slotDomain}>{domainCompassName(domain)}</span>
      <span className={styles.slotGrade}>VR {vrLevel}</span>
    </div>

    { available === -1 && <p className={styles.hint}>
      Maximize a 1ª fatia de Vessel Resonance deste domínio pra desbloquear uma gema.
    </p> }

    { available >= 0 && <>
      <div className={styles.gradeButtons}>
        <button className={classNames('botao-secundario', gem === null && styles.active)} onClick={() => selectSize(-1)}>
          Nenhuma
        </button>
        { ([0, 1, 2] as GemSize[]).filter((size) => size <= available).map((size) => <button
          key={size}
          className={classNames('botao-secundario', gem?.size === size && styles.active)}
          onClick={() => selectSize(size)}>
            {GEM_NAMES[vocation][size]}
        </button>) }
      </div>

      { gem && <>
        <div className={styles.modRow}>
          <span className={styles.modGradeLabel}>Grau da gema (Fragment Workshop)</span>
          <div className={styles.modGrades}>
            { [0, 1, 2, 3].map((t) => <button
              key={t}
              className={classNames('botao-secundario', gem.tier === t && styles.active)}
              onClick={() => updateTier(t)}>
                {t}
            </button>) }
          </div>
        </div>

        <p className={classNames(styles.hint, 'texto-sucesso')}>
          +{gemMatchBonus(gem.size)} Damage and Healing
        </p>

        { gem.basicMods.map((slot, i) => <div key={i} className={styles.modRow}>
          <div className={styles.modIconGrid}>
            <button
              type="button"
              className={classNames(styles.modIconButton, slot.modIndex === null && styles.active)}
              title="Nenhum"
              onClick={() => updateBasicMod(i, null)}>
                ✕
            </button>
            { basicModOptionsForSlot(i).map((modIndex) => <button
              key={modIndex}
              type="button"
              className={classNames(styles.modIconButton, slot.modIndex === modIndex && styles.active)}
              title={basicModNameWithValues(modIndex, vocation, gem.tier)}
              onClick={() => updateBasicMod(i, modIndex)}>
                <img src={basicModIconUrl(modIndex)} width={30} height={30} alt={basicModName(modIndex)}/>
            </button>) }
          </div>
          { slot.modIndex !== null &&
            <span className={styles.modValue}>{basicModName(slot.modIndex)}: {basicModValues(slot.modIndex, vocation, gem.tier)}</span> }
        </div>) }

        { gem.supremeMod && <div className={styles.modRow}>
          <div className={styles.modIconGrid}>
            <button
              type="button"
              className={classNames(styles.modIconButton, gem.supremeMod.modIndex === null && styles.active)}
              title="Nenhum"
              onClick={() => updateSupremeMod(null)}>
                ✕
            </button>
            { supremeOptions.map((mod) => <button
              key={mod.index}
              type="button"
              className={classNames(styles.modIconButton, gem.supremeMod?.modIndex === mod.index && styles.active)}
              title={`${mod.name} (${mod.values[0]})`}
              onClick={() => updateSupremeMod(mod.index)}>
                <img src={supremeModIconUrl(mod.index)} width={35} height={35} alt={mod.name}/>
            </button>) }
          </div>
          { gem.supremeMod.modIndex !== null &&
            <span className={styles.modValue}>{SUPREME_MODS[gem.supremeMod.modIndex].name}: {SUPREME_MODS[gem.supremeMod.modIndex].values[gem.tier]}</span> }
        </div> }
      </> }
    </> }
  </Widget>;
};
