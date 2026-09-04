import { useMemo, useState } from 'react';
import { formatTibiaGold } from '@/services/split';
import { readUnsavedSplitDrafts, removeUnsavedSplitDraft } from '@/services/split/unsaved-split-drafts';

/** "Rascunhos não salvos" (2026-09-04, pedido do usuário: "seria bom tambem ter o split
 * que o usuario fez e não salvou... ficar salvo em localstore ou cache dos ultimos 5") —
 * splits que foram PROCESSADOS na calculadora mas nunca chegaram a ser salvos no banco
 * (log bruto guardado em localStorage, ver services/split/unsaved-split-drafts.ts).
 * "Carregar" repopula o textarea e reprocessa, "✕" descarta o rascunho sem tocar no
 * textarea/cálculo atual (não é soft delete de banco — é só limpar o cache local, não
 * precisa de confirmação pesada). `version` (prop) força reler o localStorage depois de
 * uma mutação feita PELO PAI (addUnsavedSplitDraft/removeUnsavedSplitDraft em
 * handleParseLog/handleSaveSplit); `localVersion` (state interno) faz o mesmo pro "✕"
 * descartado aqui dentro — localStorage não é reativo sozinho, nenhum dos dois lados
 * sabe da mutação do outro sem esses contadores. */
export function UnsavedDraftsList({ version, onLoad }: { version: number; onLoad: (rawLog: string) => void }) {
  const [localVersion, setLocalVersion] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version/localVersion são só gatilhos de releitura, não entram no cálculo
  const drafts = useMemo(() => readUnsavedSplitDrafts(), [version, localVersion]);

  const handleDiscard = (rawLog: string) => {
    removeUnsavedSplitDraft(rawLog);
    setLocalVersion((v) => v + 1);
  };

  if (drafts.length === 0) return null;

  return (
    <div className="card-compacto" style={{ marginTop: '20px' }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 4px 0', color: 'var(--color-warning)' }}>📝 Rascunhos não salvos</h3>
      <p className="texto-fraco" style={{ fontSize: '11px', margin: '0 0 12px 0' }}>
        Processados aqui mas ainda não salvos no banco — guardados só neste navegador.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {drafts.map((draft) => (
          <div
            key={draft.rawLog}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
            }}
          >
            <div>
              <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{draft.sessionDate ?? 'Data não identificada'}</span>
              <strong className="texto-sucesso" style={{ fontSize: '13px', marginLeft: '10px' }}>{formatTibiaGold(draft.equalShare)}</strong>
              <span className="texto-fraco" style={{ fontSize: '11px', marginLeft: '6px' }}>/ membro</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => onLoad(draft.rawLog)} className="botao-secundario" style={{ fontSize: '11px', padding: '5px 10px' }}>
                Carregar
              </button>
              <button
                type="button"
                onClick={() => handleDiscard(draft.rawLog)}
                title="Descartar rascunho"
                className="botao-icone"
                style={{ fontSize: '12px' }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
