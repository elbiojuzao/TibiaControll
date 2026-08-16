import { useState, useMemo, useEffect } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { usePartySettings } from '@/hooks/usePartySettings';
import { formatTibiaGold } from '@/services/split';

interface PartyMember {
  name: string;
  loot: number;
  supplies: number;
  balance: number;
  extraTc: number | '';
  extraGold: number | '';
}

export function SplitCalculatorPage() {
  const { accountId } = useAccount();
  const { settings } = usePartySettings(accountId);

  const [rawLog, setRawLog] = useState<string>('');
  const [tcRate, setTcRate] = useState<number>(45000);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

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

  // Preenche a cotação de TC com o valor salvo da party assim que carregar (usuário pode editar livremente depois)
  useEffect(() => {
    if (settings) setTcRate(settings.tcGoldRate);
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
    if (members.length === 0) return { totalBalance: 0, equalShare: 0, transfers: [] };

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

    return { totalBalance, equalShare, transfers };
  }, [members, tcRate]);

  const handleCopyCommand = (commandText: string, index: number) => {
    navigator.clipboard.writeText(commandText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>

      {/* CABEÇALHO */}
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>Calculadora de Split Loot</h2>
        <p style={{ margin: '5px 0 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          Cole o log do Party Hunt Analyzer para calcular perfeitamente as transferências bancárias in-game.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>

        {/* COLUNA ESQUERDA: LOG E TABELA DE JOGADORES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          <div style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>1. Cole o Party Hunt Analyzer</h3>
            <textarea
              rows={8}
              value={rawLog}
              onChange={(e) => setRawLog(e.target.value)}
              onPaste={handlePasteLog}
              placeholder="Cole aqui o log completo do jogo..."
              style={{
                width: '100%',
                background: 'var(--color-bg-input)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            {parseError && (
              <p style={{ color: 'var(--color-warning)', fontSize: '12px', margin: '8px 0 0 0' }}>
                ⚠ {parseError}
              </p>
            )}
            <button
              onClick={handleParseLog}
              style={{
                marginTop: '10px',
                background: 'var(--color-accent)',
                color: 'var(--color-text)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                width: '100%'
              }}
            >
              Processar Log & Calcular Split
            </button>
          </div>

          {/* TABELA DE GASTOS EXTRAS OPCIONAIS */}
          <div style={{ background: 'var(--color-bg-elevated)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-warning)' }}>Gastos Extras (Opcional)</h3>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Cotação TC: <input type="number" value={tcRate} onChange={(e) => setTcRate(Number(e.target.value))} style={{ width: '65px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '2px 4px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }} />
              </div>
            </div>

            {members.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', margin: '20px 0' }}>
                Nenhum membro carregado. Cole o log acima e clique em processar.
              </p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Player</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '110px' }}>Extra TC expense</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '130px' }}>Extra gold (in k)</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '35px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--color-bg-elevated)' }}>
                        <td style={{ padding: '8px 6px', color: 'var(--color-text)', fontWeight: 'bold' }}>{m.name}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={m.extraTc}
                            onChange={(e) => handleExtraChange(idx, 'extraTc', e.target.value)}
                            placeholder="0"
                            style={{ width: '90px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={m.extraGold}
                            onChange={(e) => handleExtraChange(idx, 'extraGold', e.target.value)}
                            placeholder="0"
                            style={{ width: '90px', background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveMember(idx)}
                            title="Remover player"
                            style={{ background: 'transparent', color: 'var(--color-danger)', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: 0.8 }}
                          >
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

          <div style={{ background: 'var(--color-bg-elevated)', padding: '20px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 15px 0', color: 'var(--color-warning)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              Resumo do Split & Transferências
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--color-bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Lucro Total (Balance)</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-success)' }}>{formatTibiaGold(calculation.totalBalance)}</strong>
              </div>
              <div style={{ background: 'var(--color-bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block' }}>Cota por Membro (Equal Share)</span>
                <strong style={{ fontSize: '15px', color: 'var(--color-accent)' }}>{formatTibiaGold(Math.round(calculation.equalShare))}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Copiar Comandos de Transferência:</h4>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {calculation.transfers.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-faint)', textAlign: 'center', margin: '20px 0' }}>
                  Nenhuma transferência necessária no momento.
                </p>
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
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>{t.from}</span> paga para <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>{t.to}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--color-text)', marginTop: '2px' }}>
                          {t.commandText}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCommand(t.commandText, idx)}
                        style={{
                          background: copiedIndex === idx ? 'var(--color-success)' : 'var(--color-border)',
                          color: 'var(--color-text)',
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
                        {copiedIndex === idx ? 'Copiado!' : 'Copiar'}
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