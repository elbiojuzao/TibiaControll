import { useState } from 'react';
import { parsePartyHuntLog, type ParsePartyHuntLogResult } from '@/services/split/party-hunt-log-parser';
import { calculateSplit, formatTibiaGold } from '@/services/split';
import { useSplitLogs } from '@/hooks/useSplitLogs';
import type { SplitLogType, SplitPlayer } from '@/types';

/** Formulário compacto de "adicionar split rápido" (2026-09-04, pedido do usuário a
 * partir de um print de app concorrente: "+ Add" direto no modal do dia, sem precisar ir
 * pra página /split) — vive dentro de `CalendarDayDetailsModal.tsx`, atrás de um toggle.
 *
 * Reusa o parser puro extraído de `SplitCalculatorPage.tsx`
 * (`parsePartyHuntLog`) e a função pura `calculateSplit()` (já existia em
 * services/split/split-calculator.ts, mas sem NENHUM consumidor real até agora — a
 * página tem sua própria lógica local por causa dos Gastos Extras/TC, que esse form
 * simplificado não tem). Sem campo de Gastos Extras/Cotação TC de propósito — é um
 * atalho rápido, quem precisar desses ajustes usa a Calculadora completa.
 *
 * A data salva é sempre a do LOG (extraída via parsePartyHuntLog), nunca o `dateKey` do
 * dia aberto — se divergirem, mostra aviso mas não bloqueia nem sobrescreve (mesmo
 * princípio do resto do app: nunca inventar/forçar dado). */
export function QuickAddSplitForm({
  dateKey,
  accountId,
  onSaved,
  onCancel,
}: {
  dateKey: string;
  accountId: string;
  onSaved: (date: string, type: SplitLogType, equalShare: number) => void;
  onCancel: () => void;
}) {
  const { createSplitLog } = useSplitLogs(accountId);
  const [rawLog, setRawLog] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsePartyHuntLogResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<SplitLogType | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setRawLog(e.clipboardData.getData('text'));
  };

  const handleParse = () => {
    const result = parsePartyHuntLog(rawLog);
    if ('error' in result) {
      setParseError(result.error);
      setParsed(null);
      return;
    }
    setParseError(null);
    setSaveError(null);
    setParsed(result);
  };

  const calculation = parsed
    ? calculateSplit({ players: parsed.members.map((m): SplitPlayer => ({ name: m.name, balance: m.balance, waste: 0 })) })
    : null;

  const handleSave = async (type: SplitLogType) => {
    if (!parsed) return;
    if (!parsed.sessionDate) {
      setSaveError('Não consegui identificar a data da sessão no log colado — confira se tem a linha "Session data: From ... to ...".');
      return;
    }
    setSaveError(null);
    setSavingType(type);
    try {
      const equalShare = calculation ? Math.round(calculation.fairShare) : 0;
      await createSplitLog({
        date: parsed.sessionDate,
        type,
        rawLog,
        members: parsed.members.map((m) => ({
          name: m.name,
          loot: m.loot,
          supplies: m.supplies,
          balance: m.balance,
          extraTc: 0,
          extraGold: 0,
          adjustedBalance: m.balance,
          damage: m.damage,
          healing: m.healing,
        })),
        transfers: (calculation?.transfers ?? []).map((t) => ({ from: t.from, to: t.to, amount: t.amount, commandText: t.tibiaCommand })),
        totalBalance: Math.round(calculation?.globalBalance ?? 0),
        equalShare,
        tcRate: 0,
        durationMinutes: parsed.durationMinutes,
      });
      onSaved(parsed.sessionDate, type, equalShare);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar split.');
    } finally {
      setSavingType(null);
    }
  };

  return (
    <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        rows={4}
        value={rawLog}
        onChange={(e) => setRawLog(e.target.value)}
        onPaste={handlePaste}
        placeholder="Cole aqui o log do Party Hunt Analyzer..."
        className="campo-input texto-mono"
        style={{ marginTop: 0, fontSize: '11px', resize: 'vertical' }}
      />
      {parseError && <span className="texto-perigo" style={{ fontSize: '11px' }}>⚠ {parseError}</span>}

      {!parsed ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={handleParse} className="botao-primario" style={{ flex: 1, fontSize: '12px', padding: '7px' }}>
            Processar
          </button>
          <button type="button" onClick={onCancel} className="botao-secundario" style={{ fontSize: '12px', padding: '7px 12px' }}>
            Cancelar
          </button>
        </div>
      ) : (
        <>
          {parsed.sessionDate && parsed.sessionDate !== dateKey && (
            <span className="texto-fraco" style={{ fontSize: '11px' }}>
              ⚠ O log é da sessão de <strong>{parsed.sessionDate}</strong> — vai ser salvo nessa data, não em {dateKey}.
            </span>
          )}
          <div className="grid-2col" style={{ gap: '8px' }}>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-faint)', display: 'block' }}>Balance Total</span>
              <strong className="texto-sucesso" style={{ fontSize: '13px' }}>{formatTibiaGold(calculation?.globalBalance ?? 0)}</strong>
            </div>
            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-faint)', display: 'block' }}>Cota por Membro</span>
              <strong style={{ fontSize: '13px', color: 'var(--color-accent)' }}>{formatTibiaGold(Math.round(calculation?.fairShare ?? 0))}</strong>
            </div>
          </div>
          {saveError && <span className="texto-perigo" style={{ fontSize: '11px' }}>⚠ {saveError}</span>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" disabled={savingType !== null} onClick={() => handleSave('boss')} className="botao-secundario" style={{ flex: 1, fontSize: '12px', padding: '7px' }}>
              {savingType === 'boss' ? 'Salvando...' : '🐲 Salvar Boss'}
            </button>
            <button type="button" disabled={savingType !== null} onClick={() => handleSave('hunt')} className="botao-secundario" style={{ flex: 1, fontSize: '12px', padding: '7px' }}>
              {savingType === 'hunt' ? 'Salvando...' : '🗡️ Salvar Hunt'}
            </button>
            <button type="button" onClick={onCancel} className="botao-icone" title="Cancelar">
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
