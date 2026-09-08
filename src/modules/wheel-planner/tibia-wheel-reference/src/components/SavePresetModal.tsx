/**
 * Modal de "Salvar preset" da Roda de Destino (2026-09-08, pedido do usuário) — não é
 * código do gitlab.com/klhio/tibia-wheel original. Usa o `Modal` padrão do resto do
 * sistema (src/components/common/Modal.tsx), mesmo molde form-em-modal de
 * SaveWheelBuildModal.tsx (implementação antiga, ver histórico). Só pede o nome — o nível
 * necessário é calculado automaticamente a partir dos pontos investidos na roda no
 * momento do save (ver WheelPresets.tsx).
 */
import { useState } from 'react';
import { Modal } from '@/components/common/Modal';

interface SavePresetModalProps {
  level: number;
  onClose: () => void;
  onSubmit: (name: string) => Promise<unknown>;
}

export function SavePresetModal({ level, onClose, onSubmit }: SavePresetModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Dê um nome pro preset.');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar preset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Salvar preset da roda" onClose={onClose} isDirty={name.trim().length > 0}>
      <form onSubmit={handleSubmit} className="form-coluna">
        <label className="label-padrao">
          Nome do preset
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Knight Tank PvE"
            className="campo-input"
            autoFocus
          />
        </label>
        <p className="texto-fraco" style={{ fontSize: '12px' }}>Nível necessário: {level}</p>
        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}
        <button type="submit" disabled={saving} className="botao-primario" style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}>
          {saving ? 'Salvando...' : 'Salvar preset'}
        </button>
      </form>
    </Modal>
  );
}
