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

    const lines = text.split('\n');
    const parsedMembers: PartyMember[] = [];
    
    let currentName = '';
    let currentLoot = 0;
    let currentSupplies = 0;
    let currentBalance = 0;

    const cleanNumber = (str: string) => parseInt(str.replace(/[,.]/g, ''), 10) || 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detecta se a linha é um bloco de player (não começa com tab/espaços e não é cabeçalho global)
      if (!line.startsWith('\t') && !trimmed.startsWith('Session') && !trimmed.startsWith('Loot Type') && !trimmed.startsWith('Loot:') && !trimmed.startsWith('Supplies:') && !trimmed.startsWith('Balance:')) {
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
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      
      {/* CABEÇALHO */}
      <header className="page-header" style={{ marginBottom: '25px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#10b981' }}>Calculadora de Split Loot</h2>
        <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
          Cole o log do Party Hunt Analyzer para calcular perfeitamente as transferências bancárias in-game.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        
        {/* COLUNA ESQUERDA: LOG E TABELA DE JOGADORES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#38bdf8' }}>1. Cole o Party Hunt Analyzer</h3>
            <textarea
              rows={8}
              value={rawLog}
              onChange={(e) => setRawLog(e.target.value)}
              placeholder="Cole aqui o log completo do jogo..."
              style={{
                width: '100%',
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleParseLog}
              style={{
                marginTop: '10px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
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
          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#f59e0b' }}>Gastos Extras (Opcional)</h3>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Cotação TC: <input type="number" value={tcRate} onChange={(e) => setTcRate(Number(e.target.value))} style={{ width: '65px', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '2px 4px', borderRadius: '4px', textAlign: 'center' }} />
              </div>
            </div>

            {members.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
                Nenhum membro carregado. Cole o log acima e clique em processar.
              </p>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                      <th style={{ textAlign: 'left', padding: '6px' }}>Player</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '110px' }}>Extra TC expense</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '130px' }}>Extra gold (in k)</th>
                      <th style={{ textAlign: 'center', padding: '6px', width: '35px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px 6px', color: '#f8fafc', fontWeight: 'bold' }}>{m.name}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={m.extraTc}
                            onChange={(e) => handleExtraChange(idx, 'extraTc', e.target.value)}
                            placeholder="0"
                            style={{ width: '90px', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px 6px', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <input
                            type="number"
                            value={m.extraGold}
                            onChange={(e) => handleExtraChange(idx, 'extraGold', e.target.value)}
                            placeholder="0"
                            style={{ width: '90px', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '4px 6px', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}
                          />
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleRemoveMember(idx)}
                            title="Remover player"
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: 0.8 }}
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
          
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 15px 0', color: '#f59e0b', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              Resumo do Split & Transferências
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Lucro Total (Balance)</span>
                <strong style={{ fontSize: '15px', color: '#10b981' }}>{formatTibiaGold(calculation.totalBalance)}</strong>
              </div>
              <div style={{ background: '#0f172a', padding: '12px', borderRadius: '6px', border: '1px solid #334155' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Cota por Membro (Equal Share)</span>
                <strong style={{ fontSize: '15px', color: '#38bdf8' }}>{formatTibiaGold(Math.round(calculation.equalShare))}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#f8fafc' }}>Copiar Comandos de Transferência:</h4>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {calculation.transfers.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
                  Nenhuma transferência necessária no momento.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {calculation.transfers.map((t, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#0f172a', 
                        padding: '10px 12px', 
                        borderRadius: '6px', 
                        border: '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{t.from}</span> paga para <span style={{ color: '#10b981', fontWeight: 'bold' }}>{t.to}</span>
                        </div>
                        <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#f8fafc', marginTop: '2px' }}>
                          {t.commandText}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyCommand(t.commandText, idx)}
                        style={{
                          background: copiedIndex === idx ? '#10b981' : '#334155',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
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