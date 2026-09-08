/**
 * Painel de importar/exportar o código REAL do jogo (2026-09-05, pedido do usuário — ver
 * `game-code.ts` pra detalhes do formato). Não é código do gitlab.com/klhio/tibia-wheel
 * original.
 *
 * A aplicação do import reaproveita o mecanismo de hash da própria roda já usada nesta
 * página (`RootContextProvider.onHashChange`, em context.tsx) — decodifica o código do
 * jogo pro nosso formato interno `{level, vocation, perks}` e escreve no hash via
 * `contextToBinary`, exatamente como um link de build compartilhado. Evita duplicar
 * lógica de aplicar level/vocation/perks que já existe (e testar) no `RootContextProvider`.
 */
import React, { useContext, useState } from 'react';
import { RootContext } from '../context';
import { contextToBinary } from '../utils';
import { decodeGameWheelCode, encodeGameWheelCode } from '../game-code';
import { Widget } from './Widget';

export const GameCodeImportExport: React.FC = () => {
  const { vocation, perks, pointsMax } = useContext(RootContext);
  const [ importText, setImportText ] = useState('');
  const [ exportedCode, setExportedCode ] = useState('');
  const [ error, setError ] = useState('');
  const [ copied, setCopied ] = useState(false);

  function onExport() {
    const code = encodeGameWheelCode(vocation, Math.max(0, pointsMax), perks);
    setExportedCode(code);
    setError('');
    setCopied(false);

    navigator.clipboard?.writeText(code)
      .then(() => setCopied(true))
      .catch(() => {});
  }

  function onImport() {
    const decoded = decodeGameWheelCode(importText);

    if (!decoded) {
      setError('Código inválido — confira se copiou certo do jogo.');
      return;
    }

    setError('');
    location.hash = contextToBinary({
      level: decoded.pointsMax + 50,
      vocation: decoded.vocation,
      perks: decoded.perks,
    });
  }

  return <Widget>
    <span>Importar/exportar código do jogo</span>
    <div className="form-coluna">
      <div>
        <label className="label-padrao">Colar código copiado do jogo (ou de outro planner)</label>
        <input
          className="campo-input"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Ex.: K0Y2AgDP4jAQA"
        />
      </div>
      { error && <span className="texto-perigo" style={{ fontSize: '0.75rem' }}>{error}</span> }
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className="botao-secundario" onClick={onImport}>Importar</button>
        <button className="botao-secundario" onClick={onExport}>Exportar</button>
      </div>
      { exportedCode && <div>
        <label className="label-padrao">{ copied ? 'Copiado! Cole no jogo:' : 'Código (copie manualmente):' }</label>
        <input
          className="campo-input"
          readOnly
          value={exportedCode}
          onFocus={(e) => e.target.select()}
        />
      </div> }
    </div>
  </Widget>;
};
