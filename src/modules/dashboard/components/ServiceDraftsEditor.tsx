import { servedPlayerOptions, deriveVocation, type ServiceDraft } from '@/services/lootdrop/drop-form-calculations';
import type { Serviceiro } from '@/types';

const VAZIO = '';

interface ServiceDraftsEditorProps {
  serviceDrafts: ServiceDraft[];
  serviceiros: Serviceiro[];
  party: { ek: string; ed: string; ms: string; rp: string; fifthPlayer: string };
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onUpdateRow: (index: number, patch: Partial<ServiceDraft>) => void;
}

/** Seção "Serviceiros nesse item" do DropFormModal — extraída em 2026-08-27 pra reduzir o
 * tamanho do componente (ver memória "componentes-grandes"). Só apresentação: cada linha
 * edita um ServiceDraft por props, a lista em si (add/remove/update) continua no
 * componente pai. */
export function ServiceDraftsEditor({ serviceDrafts, serviceiros, party, onAddRow, onRemoveRow, onUpdateRow }: ServiceDraftsEditorProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="form-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>Serviceiros nesse item</span>
        <button type="button" onClick={onAddRow} className="botao-secundario" style={{ padding: '4px 10px', fontSize: '12px' }}>
          + Adicionar Serviceiro
        </button>
      </div>

      {serviceDrafts.length === 0 ? (
        <p className="estado-vazio" style={{ margin: '4px 0' }}>Nenhum serviceiro nesse item.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {serviceDrafts.map((row, index) => {
            const serviceiro = serviceiros.find((s) => s.id === row.serviceiroId);
            const playerOptions = servedPlayerOptions(party, row.servedCharacterName);
            return (
              <div key={index} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                <select
                  value={row.serviceiroId}
                  onChange={(e) => onUpdateRow(index, { serviceiroId: e.target.value, vocation: '' })}
                  className="campo-input"
                >
                  <option value={VAZIO}>-- Vazio --</option>
                  {serviceiros.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={row.servedCharacterName}
                  onChange={(e) => {
                    const servedCharacterName = e.target.value;
                    onUpdateRow(index, { servedCharacterName, vocation: deriveVocation(party, servedCharacterName) });
                  }}
                  disabled={!serviceiro}
                  className="campo-input"
                  title="Em quem esse serviceiro fez o service"
                >
                  <option value={VAZIO}>{serviceiro ? '-- Jogador servido --' : 'Escolha o serviceiro'}</option>
                  {playerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => onRemoveRow(index)} title="Remover serviceiro do item" className="botao-icone-perigo">
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
