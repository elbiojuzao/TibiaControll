import { useState } from 'react';
import { Modal } from '@/components/common/Modal';

interface SaveWheelBuildModalProps {
  onClose: () => void;
  onSubmit: (name: string, characterName: string) => Promise<unknown>;
}

/** Modal de "Salvar Build" da Roda de Destino (2026-09-02, pedido do usuário: "vamos montar
 * tambem uma maneira de salvar") — mesmo molde form-em-modal do resto do app. Nome é
 * obrigatório (rótulo do build salvo), personagem é opcional (pra amarrar visualmente a
 * qual char da party aquele build pertence, sem ser uma FK de verdade pro Member). */
export function SaveWheelBuildModal({ onClose, onSubmit }: SaveWheelBuildModalProps) {
  const [name, setName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Dê um nome pro build.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onSubmit(trimmed, characterName.trim());
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar build.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Salvar Build" onClose={onClose} isDirty={name.trim().length > 0 || characterName.trim().length > 0}>
      <form onSubmit={handleSubmit} className="form-coluna">
        <label className="label-padrao">
          Nome do build
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Knight Tank PvE"
            className="campo-input"
            autoFocus
          />
        </label>
        <label className="label-padrao">
          Personagem (opcional)
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Ex: Koe Psciko"
            className="campo-input"
          />
        </label>
        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}
        <button type="submit" disabled={saving} className="botao-primario" style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}>
          {saving ? 'Salvando...' : 'Salvar Build'}
        </button>
      </form>
    </Modal>
  );
}
