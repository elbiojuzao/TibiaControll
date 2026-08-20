import { useState, useMemo, useEffect } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { usePartySettings } from '@/hooks/usePartySettings';
import { useSplitLogs } from '@/hooks/useSplitLogs';
import { formatTibiaGold } from '@/services/split';
import { extractSplitSessionDate } from '@/services/split/session-date';
import type { SplitLogType } from '@/types';

interface PartyMember {
  name: string;
  loot: number;
  supplies: number;
  balance: number;
  extraTc: number | '';
  extraGold: number | '';
}

// Pedido do usuário (2026-08-19): a Cotação TC digitada aqui não pode se perder ao
// recarregar a página — persiste no localStorage do navegador (não é dado de conta,
// puramente local, igual ao padrão já usado em account-cache.ts).
const TC_RATE_STORAGE_KEY = 'tibia-pts:tc-rate';

function readCachedTcRate(): number | null {
  try {
    const raw = localStorage.getItem(TC_RATE_STORAGE_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

function writeCachedTcRate(value: number): void {
  try {
    localStorage.setItem(TC_RATE_STORAGE_KEY, String(value));
  } catch {
    // localStorage indisponível (aba anônima, quota cheia etc.) — segue sem persistir
  }
}

export function SplitCalculatorPage() {
  const { accountId } = useAccount();
  const { settings } = usePartySettings(accountId);
  const { createSplitLog } = useSplitLogs(accountId);

  const [rawLog, setRawLog] = useState<string>('');
  const [tcRate, setTcRateState] = useState<number>(() => readCachedTcRate() ?? 45000);
  const setTcRate = (value: number) => {
    setTcRateState(value);
    writeCachedTcRate(value);
  };
  const [members, setMembers] = useState<PartyMember[]>([]);
  // Igual ao DropFormModal (2026-08-16) — uma vez copiado, o botão fica marcado
  // permanentemente em vez de reverter sozinho em 2s, pra saber visualmente quais
  // transferências já foram feitas no jogo. Reseta ao reprocessar um log novo.
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const [parseError, setParseError] = useState<string | null>(null);
  // Data da sessão (extraída do log, já com a regra de corte de 1h aplicada — ver
  // session-date.ts) e estado de "Salvar Split Boss/Hunt" (2026-08-19, pedido do
  // usuário: salvar o split calculado no banco em vez de só na planilha externa).
  const [sessionDate, setSessionDate] = useState<string | null>(null);
  // Texto de fato usado no último processamento — pode ser diferente de `rawLog` quando o
  // campo está vazio e o log de exemplo é usado (ver handleParseLog). É esse texto que
  // precisa ser salvo junto do split, pra bater com a data/membros calculados.
  const [parsedRawLog, setParsedRawLog] = useState<string>('');
  const [savedTypes, setSavedTypes] = useState<Set<SplitLogType>>(new Set());
  const [savingType, setSavingType] = useState<SplitLogType | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Cola sempre SUBSTITUI o conteúdo inteiro do campo, nunca insere no meio/fim do que
  // já estava digitado — evita o caso real reportado pelo usuário: um caractere solto
  // ficou no campo (digitado sem querer) antes de colar o log, e o parser leu a
  // primeira linha ("aSession data: ...") como se fosse um jogador em vez do cabeçalho,
  // inflando o Balance total em dobro e corrompendo todas as transferências calculadas.
  const handlePasteLog = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setRawLog(e.clipboardData.getData('text'));
    setParseError(null);
  };

  // Preenche a cotação de TC com o valor salvo da party assim que carregar — só quando
  // ainda não há nada salvo no localStorage (senão isso sobrescreveria o valor que o
  // próprio usuário já tinha digitado numa visita anterior).
  useEffect(() => {
    if (settings && readCachedTcRate() === null) setTcRateState(settings.tcGoldRate);
  }, [settings]);

  // Parser robusto para o formato real do Party Hunt Analyzer do Tibia
  const handleParseLog = () => {
    const text = rawLog.trim() ? rawLog : `Session data: From 2026-08-04, 18:59:52 to 2026-08-04, 20:11:17
Session: 01:11h
Loot Type: Leader
Loot: 20,006,452
Supplies: 2,429,123
Balance: 17,577,329
Koe Psciko
	Loot: 1,366,708
	Supplies: 910,607
	Balance: 456,101
Marugo
	Loot: 4,583,210
	Supplies: 263,714
	Balance: 4,319,496
Thanatos Celestial (Leader)
	Loot: 4,596,896
	Supplies: 624,768
	Balance: 3,972,128
Thor Zynz
	Loot: 3,736,090
	Supplies: 630,034
	Balance: 3,106,056
Zo Tis
	Loot: 5,723,548
	Supplies: 0
	Balance: 5,723,548`;

    // Segunda camada de proteção (além do onPaste que substitui o campo inteiro): se a
    // primeira linha não-vazia não for o cabeçalho esperado, o parser trataria ela como
    // nome de jogador e inflaria o Balance total silenciosamente — melhor avisar e não
    // calcular nada do que devolver um split errado sem o usuário perceber.
    const firstLine = text.split('\n').find((l) => l.trim())?.trim() ?? '';
    if (!/^Session data:/i.test(firstLine)) {
      setParseError(`Log não reconhecido — a primeira linha deveria começar com "Session data:", mas veio "${firstLine.slice(0, 40)}${firstLine.length > 40 ? '...' : ''}". Confira se colou o texto completo do Party Hunt Analyzer, sem caracteres extras no início.`);
      setMembers([]);
      return;
    }
    setParseError(null);

    const lines = text.split('\n');
    const parsedMembers: PartyMember[] = [];
    
    let currentName = '';
    let currentLoot = 0;
    let currentSupplies = 0;
    let currentBalance = 0;

    const cleanNumber = (str: string) => parseInt(str.replace(/[,.]/g, ''), 10) || 0;

    // Cabeçalho global (nunca é player, nem campo de player) e campos conhecidos de
    // cada player (Damage/Healing existem no log real mas não entram no cálculo, só
    // precisam ser reconhecidos pra não virarem "jogador fantasma" — ver abaixo).
    const HEADER_PREFIXES = ['Session', 'Loot Type'];
    const FIELD_PREFIXES = ['Loot:', 'Supplies:', 'Balance:', 'Damage:', 'Healing:'];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (HEADER_PREFIXES.some((p) => trimmed.startsWith(p))) return;

      const isFieldLine = FIELD_PREFIXES.some((p) => trimmed.startsWith(p));

      // Detecta se a linha é o início de um bloco de player: qualquer linha que não seja
      // cabeçalho nem um campo conhecido (Loot/Supplies/Balance/Damage/Healing). Antes
      // essa decisão também exigia "não começar com tab" — mas o log real às vezes chega
      // com a indentação virando espaços em vez de tab (dependendo de onde foi copiado),
      // e "Damage:"/"Healing:" nem estavam na lista de campos reconhecidos. Nesse caso a
      // linha "Damage: ..." não batia com tab nem com nenhum prefixo excluído e virava um
      // jogador fantasma com Balance 0 — inflava o número de membros na divisão (Cota
      // Justa = Balance total ÷ nº de membros) sem inflar o Balance, gerando transferências
      // erradas mesmo sem nenhum caractere sobrando no início do log (bug reportado pelo
      // usuário em 2026-08-15, além do caso do caractere solto). Detectar só pelo prefixo
      // do campo (sem depender de tab) resolve os dois casos.
      if (!isFieldLine) {
        // Se já tínhamos um player em andamento, salva antes
        if (currentName) {
          parsedMembers.push({
            name: currentName,
            loot: currentLoot,
            supplies: currentSupplies,
            balance: currentBalance,
            extraTc: '',
            extraGold: '',
          });
        }
        // Limpa o nome removendo sufixos como (Leader) ou similar se houver
        currentName = trimmed.replace(/\s*\(Leader\).*$/i, '').trim();
        currentLoot = 0;
        currentSupplies = 0;
        currentBalance = 0;
      } else if (currentName) {
        if (trimmed.startsWith('Loot:')) {
          const match = trimmed.match(/[\d,.]+/);
          if (match) currentLoot = cleanNumber(match[0]);
        } else if (trimmed.startsWith('Supplies:')) {
          const match = trimmed.match(/[\d,.]+/);
          if (match) currentSupplies = cleanNumber(match[0]);
        } else if (trimmed.startsWith('Balance:')) {
          const match = trimmed.match(/[\d,.]+/);
          if (match) currentBalance = cleanNumber(match[0]);
        }
        // Damage:/Healing: são reconhecidos só pra não virarem jogador fantasma —
        // não entram no cálculo de split, então não precisam de captura própria.
      }
    });

    // Insere o último player processado
    if (currentName) {
      parsedMembers.push({
        name: currentName,
        loot: currentLoot,
        supplies: currentSupplies,
        balance: currentBalance,
        extraTc: '',
        extraGold: '',
      });
    }

    setMembers(parsedMembers);
    setDoneIndices(new Set());
    setSessionDate(extractSplitSessionDate(text));
    setParsedRawLog(text);
    setSavedTypes(new Set());
    setSaveError(null);
  };

  const handleExtraChange = (index: number, field: 'extraTc' | 'extraGold', valueStr: string) => {
    const updated = [...members];
    if (valueStr === '') {
      updated[index][field] = '';
    } else {
      const num = Number(valueStr);
      updated[index][field] = isNaN(num) ? '' : num;
    }
    setMembers(updated);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, idx) => idx !== index));
  };

  // Cálculo correto baseado em somar o Balance total e dividir igualmente pelo número de membros
  const calculation = useMemo(() => {
    if (members.length === 0) return { totalBalance: 0, equalShare: 0, transfers: [], adjustedMembers: [] };

    const adjustedMembers = members.map((m) => {
      const tcVal = typeof m.extraTc === 'number' ? m.extraTc : 0;
      const goldVal = typeof m.extraGold === 'number' ? m.extraGold : 0;
      const totalExtraGold = goldVal * 1000 + tcVal * tcRate;

      return {
        ...m,
        adjustedBalance: m.balance - totalExtraGold,
      };
    });

    const totalBalance = adjustedMembers.reduce((acc, m) => acc + m.adjustedBalance, 0);
    const equalShare = totalBalance / members.length; // Mantém precisão em ponto flutuante para o cálculo de diferenças exatas

    // Diferença exata de cada membro em relação à cota igualitária
    const diffs = adjustedMembers.map((m) => ({
      name: m.name,
      diff: m.adjustedBalance - equalShare,
    }));

    // diff > 0: ficou com mais gold do que a cota justa -> deve PAGAR o excedente (devedor)
    // diff < 0: ficou com menos gold do que a cota justa -> deve RECEBER a diferença (credor)
    const devedores = diffs.filter((d) => d.diff > 0).sort((a, b) => b.diff - a.diff);
    const credores = diffs.filter((d) => d.diff < 0).sort((a, b) => a.diff - b.diff);

    const transfers: { from: string; to: string; amount: number; commandText: string }[] = [];
    let devCopy = devedores.map((d) => ({ ...d }));
    let credCopy = credores.map((c) => ({ ...c, diff: Math.abs(c.diff) }));

    let i = 0;
    let j = 0;

    while (i < devCopy.length && j < credCopy.length) {
      const devedor = devCopy[i];
      const credor = credCopy[j];
      const amount = Math.min(devedor.diff, credor.diff);

      if (amount > 0) {
        const roundedAmount = Math.round(amount);
        const commandText = `transfer ${roundedAmount} to ${credor.name}`;
        transfers.push({ from: devedor.name, to: credor.name, amount: roundedAmount, commandText });
      }

      devedor.diff -= amount;
      credor.diff -= amount;

      if (devedor.diff < 0.01) i++;
      if (credor.diff < 0.01) j++;
    }

    return { totalBalance, equalShare, transfers, adjustedMembers };
  }, [members, tcRate]);

  const handleCopyCommand = (commandText: string, index: number) => {
    navigator.clipboard.writeText(commandText);
    setDoneIndices((prev) => new Set(prev).add(index));
  };

  // "Salvar Split Boss"/"Salvar Split Hunt" (2026-08-19, pedido do usuário) — grava o
  // split calculado no banco (log bruto + membros + transferências), consolidando o que
  // hoje fica numa planilha à parte. `type` só marca se foi split de Boss ou de Hunt — a
  // própria calculadora não tem como saber isso sozinha, é o usuário quem indica clicando
  // no botão certo.
  const handleSaveSplit = async (type: SplitLogType) => {
    if (!sessionDate) {
      setSaveError('Não consegui identificar a data da sessão no log colado — confira se o log tem a linha "Session data: From ... to ...".');
      return;
    }
    setSaveError(null);
    setSavingType(type);
    try {
      await createSplitLog({
        date: sessionDate,
        type,
        rawLog: parsedRawLog,
        members: calculation.adjustedMembers.map((m) => ({
          name: m.name,
          loot: m.loot,
          supplies: m.supplies,
          balance: m.balance,
          extraTc: typeof m.extraTc === 'number' ? m.extraTc : 0,
          extraGold: typeof m.extraGold === 'number' ? m.extraGold : 0,
          // Gold do Tibia é sempre inteiro — adjustedBalance normalmente já é (balance e
          // tcRate/extraTc/extraGold são inteiros), mas arredonda por segurança.
          adjustedBalance: Math.round(m.adjustedBalance),
        })),
        transfers: calculation.transfers,
        // totalBalance/tcRate já são inteiros na prática, mas equalShare é totalBalance ÷
        // nº de membros de propósito SEM arredondar (mantém precisão pro cálculo de
        // diferenças exatas nas transferências, ver `calculation` acima) — as 3 colunas do
        // banco são bigint, arredonda só aqui na hora de salvar, sem afetar o cálculo em si.
        totalBalance: Math.round(calculation.totalBalance),
        equalShare: Math.round(calculation.equalShare),
        tcRate: Math.round(tcRate),
      });
      setSavedTypes((prev) => new Set(prev).add(type));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar split.');
    } finally {
      setSavingType(null);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>

      {/* CABEÇALHO */}
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Calculadora de Split Loot</h2>
        <p className="subtitulo-pagina">
          Cole o log do Party Hunt Analyzer para calcular perfeitamente as transferências bancárias in-game.
        </p>
      </header>

      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

        {/* COLUNA ESQUERDA: LOG E TABELA DE JOGADORES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div className="card-compacto">
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>1. Cole o Party Hunt Analyzer</h3>
            <textarea
              rows={8}
              value={rawLog}
              onChange={(e) => setRawLog(e.target.value)}
              onPaste={handlePasteLog}
              placeholder="Cole aqui o log completo do jogo..."
              className="campo-input texto-mono"
              style={{ marginTop: 0, fontSize: '12px', resize: 'vertical' }}
            />
            {parseError && (
              <p style={{ color: 'var(--color-warning)', fontSize: '12px', margin: '8px 0 0 0' }}>
                ⚠ {parseError}
              </p>
            )}
            <button onClick={handleParseLog} className="botao-primario" style={{ marginTop: '10px', width: '100%' }}>
              Processar Log & Calcular Split
            </button>
          </div>

          {/* TABELA DE GASTOS EXTRAS OPCIONAIS */}
          <div className="card-compacto">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-warning)' }}>Gastos Extras (Opcional)</h3>
              <div className="texto-mudo" style={{ fontSize: '12px' }}>
                Cotação TC: <input type="number" value={tcRate} onChange={(e) => setTcRate(Number(e.target.value))} className="campo-input w65" style={{ marginTop: 0, display: 'inline-block', padding: '2px 4px', textAlign: 'center' }} />
              </div>
            </div>

            {members.length === 0 ? (
              <p className="estado-vazio">Nenhum membro carregado. Cole o log acima e clique em processar.</p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="tabela-simples">
                  <thead>
                    <tr className="texto-mudo" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th className="celula-esq">Player</th>
                      <th className="celula-centro w110">Extra TC expense</th>
                      <th className="celula-centro w130">Extra gold (in k)</th>
                      <th className="celula-centro w35"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                        <td style={{ padding: '8px 6px', color: 'var(--color-text)', fontWeight: 'bold' }}>{m.name}</td>
                        <td className="celula-centro">
                          <input
                            type="number"
                            value={m.extraTc}
                            onChange={(e) => handleExtraChange(idx, 'extraTc', e.target.value)}
                            placeholder="0"
                            className="campo-input w90"
                            style={{ marginTop: 0, display: 'inline-block', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td className="celula-centro">
                          <input
                            type="number"
                            value={m.extraGold}
                            onChange={(e) => handleExtraChange(idx, 'extraGold', e.target.value)}
                            placeholder="0"
                            className="campo-input w90"
                            style={{ marginTop: 0, display: 'inline-block', padding: '4px 6px', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td className="celula-centro">
                          <button onClick={() => handleRemoveMember(idx)} title="Remover player" className="botao-icone-perigo" style={{ fontSize: '14px' }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* COLUNA DIREITA: RESULTADOS E COMANDOS DE CÓPIA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div className="card-compacto" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 15px 0', color: 'var(--color-warning)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Resumo do Split & Transferências
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--color-bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span className="label-padrao">Lucro Total (Balance)</span>
                <strong className="texto-sucesso" style={{ fontSize: '15px' }}>{formatTibiaGold(calculation.totalBalance)}</strong>
              </div>
              <div style={{ background: 'var(--color-bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span className="label-padrao">Cota por Membro (Equal Share)</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-accent)' }}>{formatTibiaGold(Math.round(calculation.equalShare))}</strong>
              </div>
            </div>

            {members.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['boss', 'hunt'] as const).map((type) => {
                    const saved = savedTypes.has(type);
                    const saving = savingType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleSaveSplit(type)}
                        disabled={saving}
                        className="botao-secundario"
                        style={{
                          flex: 1, padding: '10px', fontWeight: 'bold',
                          borderColor: saved ? 'var(--color-success)' : undefined,
                          color: saved ? 'var(--color-success)' : undefined,
                          background: saved ? 'var(--color-success-soft)' : undefined,
                        }}
                      >
                        {saving ? 'Salvando...' : saved ? `✓ Split ${type === 'boss' ? 'Boss' : 'Hunt'} salvo` : `💾 Salvar Split ${type === 'boss' ? 'Boss' : 'Hunt'}`}
                      </button>
                    );
                  })}
                </div>
                {sessionDate && (
                  <p className="texto-fraco" style={{ fontSize: '11px', margin: '6px 0 0 0' }}>
                    Data da sessão: {sessionDate}
                  </p>
                )}
                {saveError && (
                  <p className="texto-perigo" style={{ fontSize: '12px', margin: '6px 0 0 0' }}>⚠ {saveError}</p>
                )}
              </div>
            )}

            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Copiar Comandos de Transferência:</h4>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {calculation.transfers.length === 0 ? (
                <p className="estado-vazio">Nenhuma transferência necessária no momento.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calculation.transfers.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-bg-input)',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div className="texto-mudo" style={{ fontSize: '11px' }}>
                          <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{t.from}</span> paga para <span className="texto-sucesso" style={{ fontWeight: 'bold' }}>{t.to}</span>
                        </div>
                        <div className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>
                          {t.commandText}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCommand(t.commandText, idx)}
                        title={doneIndices.has(idx) ? 'Já copiado — clique pra copiar de novo' : 'Copiar comando'}
                        style={{
                          background: doneIndices.has(idx) ? 'var(--color-success)' : 'var(--color-border)',
                          color: doneIndices.has(idx) ? 'var(--color-bg)' : 'var(--color-text)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          minWidth: '65px'
                        }}
                      >
                        {doneIndices.has(idx) ? '✓ Pago' : 'Copiar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}