/**
 * Presets salvos da Roda de Destino (2026-09-08, pedido do usuário: "fazer uns cards em
 * baixo da roda de preset salvos... na tela tera o nome dado a roda e o lvl necessario -
 * que seria a quantidade de pontos + 50... ao clicar no card ele carrega a roda conforme
 * salvo"). Não é código do gitlab.com/klhio/tibia-wheel original — feature nova, privada
 * por conta (useAccount/useWheelPresets vêm de fora do port, do resto do app).
 *
 * Um preset é só o mesmo binário compacto que já vai no hash da URL pra compartilhar link
 * (`contextToBinary`/`state.level+vocation+perks`) — carregar um preset simplesmente seta
 * `location.hash` com esse binário, disparando o `hashchange` que o `RootContextProvider`
 * original já escuta sozinho (mesmo mecanismo reusado por GameCodeImportExport.tsx pro
 * import de código real do jogo). NÃO inclui as gemas do Ateliê — elas já não são salvas
 * no hash hoje (ver context.tsx), mesma limitação do link compartilhável.
 */
import React, { useContext, useState } from 'react';
import { RootContext } from '../context';
import { contextToBinary } from '../utils';
import { useAccount } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { useWheelPresets } from '@/hooks/useWheelPresets';
import type { WheelPreset } from '@/types';
import { Widget } from './Widget';
import { SavePresetModal } from './SavePresetModal';

import styles from './WheelPresets.module.css';

export const WheelPresets: React.FC = () => {
  const { level, vocation, perks, pointsMax, pointsLeft } = useContext(RootContext);
  const { accountId } = useAccount();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { presets, loading, error, savePreset, deletePreset } = useWheelPresets(accountId);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const pointsUsed = pointsMax - pointsLeft;
  const requiredLevel = pointsUsed + 50;

  const handleSave = async (name: string) => {
    setSaveError(null);
    try {
      await savePreset({
        name,
        vocation,
        level: requiredLevel,
        state: contextToBinary({ level, vocation, perks }),
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar preset.');
      throw err;
    }
  };

  const handleLoad = (preset: WheelPreset) => {
    if (pointsUsed > 0 && !window.confirm(`Carregar "${preset.name}"? Isso substitui a roda atual (não salva automaticamente).`)) return;
    location.hash = preset.state;
  };

  const handleDelete = async (preset: WheelPreset) => {
    if (!window.confirm(`Excluir o preset "${preset.name}"? Essa ação não pode ser desfeita.`)) return;
    setDeleteError(null);
    try {
      await deletePreset(preset.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir preset.');
    }
  };

  return <div className={styles.presets}>
    <div className={styles.header}>
      <span>Presets salvos</span>
      <button
        type="button"
        onClick={() => setShowSaveModal(true)}
        disabled={!isAuthenticated || authLoading || pointsUsed === 0}
        title={isAuthenticated ? (pointsUsed === 0 ? 'Invista pontos na roda antes de salvar' : 'Salvar preset') : 'Faça login pra salvar presets'}
        className="botao-primario">
          💾 Salvar preset
      </button>
    </div>

    {!isAuthenticated && !authLoading && (
      <p className={styles.hint}>🔒 Faça login pra salvar e carregar presets.</p>
    )}

    {saveError && <div className="banner-erro" style={{ marginBottom: '10px' }}>{saveError}</div>}
    {deleteError && <div className="banner-erro" style={{ marginBottom: '10px' }}>{deleteError}</div>}
    {error && <div className="texto-perigo" style={{ fontSize: '13px' }}>{error}</div>}

    {isAuthenticated && !loading && presets.length === 0 && (
      <p className={styles.hint}>Nenhum preset salvo ainda.</p>
    )}

    {isAuthenticated && presets.length > 0 && (
      <div className={styles.grid}>
        { presets.map((preset) => <Widget key={preset.id} className={styles.card}>
          <button type="button" className={styles.cardMain} onClick={() => handleLoad(preset)}>
            <strong className={styles.cardName}>{preset.name}</strong>
            <span className={styles.cardMeta}>{preset.vocation} · Lvl {preset.level}</span>
          </button>
          <button type="button" onClick={() => handleDelete(preset)} title="Excluir preset" className={styles.cardDelete}>🗑️</button>
        </Widget>) }
      </div>
    )}

    {showSaveModal && (
      <SavePresetModal level={requiredLevel} onClose={() => setShowSaveModal(false)} onSubmit={handleSave} />
    )}
  </div>;
};
