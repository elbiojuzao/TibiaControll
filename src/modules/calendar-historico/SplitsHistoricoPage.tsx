import { Fragment, useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useSplitLogsList } from '@/hooks/useSplitLogsList';
import { Modal } from '@/components/common/Modal';
import { brToIso } from '@/services/common/br-date';
import { parseDateKey } from '@/services/calendar';
import { formatTibiaGold } from '@/services/split';
import type { SplitLog, SplitLogPlayerSlot } from '@/types';

interface SplitRow {
  id: string;
  date: string;
  type: 'hunt' | 'boss';
  totalBalance: number;
  equalShare: number;
  players: SplitLogPlayerSlot[];
  totalDamage: number;
  totalHealing: number;
  /** Minutos da sessão (linha "Session: HH:MMh" do log) — null se o split não tiver esse
   * dado (log num formato diferente). Usado só pra normalizar as médias por hora do card
   * de resumo; splits sem duração ficam de fora desse cálculo específico, mas continuam
   * aparecendo normalmente na tabela. */
  durationMinutes: number | null;
}

type SortKey = 'date' | 'type' | 'equalShare' | 'totalDamage' | 'totalHealing';
type SortDirection = 'asc' | 'desc';

// Só as colunas essenciais pra um relance rápido (2026-08-23, pedido do usuário: "na tela
// de split aparecer apenas 'cota membro' 'jogador dano e cura'") — Balance Total/Dano
// Total/Cura Total saíram da tabela e foram pro modal de detalhes (clique na linha).
const BASE_COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Data' },
  { key: 'type', label: 'Tipo' },
  { key: 'equalShare', label: 'Cota por Membro' },
];

// Mesmas janelas de "Ver últimos" já usadas na aba XP (XpHistoricoPage) — pedido do
// usuário (2026-08-21): "que fosse igual o do calendario os ultimos 30 dias como e".
const WINDOW_OPTIONS = [30, 60, 90, 120, 365];
const TODOS_PLAYERS = '';

/** Splits salvos ANTES da migration 20260822000000 (colunas player1_*..player8_*) têm
 * `playerSlots` vazio mesmo já tendo damage/healing em `members[]` (capturados desde
 * 2026-08-21) — cai pra `members` nesse caso, pra não mostrar colunas de player em branco
 * à toa nesse intervalo de transição. */
function resolvePlayers(log: SplitLog): SplitLogPlayerSlot[] {
  if (log.playerSlots.length > 0) return log.playerSlots;
  return log.members.map((m) => ({ name: m.name, damage: m.damage, healing: m.healing }));
}

function sortValue(row: SplitRow, key: SortKey): string | number {
  switch (key) {
    case 'date': return brToIso(row.date);
    case 'type': return row.type;
    case 'equalShare': return row.equalShare;
    case 'totalDamage': return row.totalDamage;
    case 'totalHealing': return row.totalHealing;
  }
}

/** Modal de detalhes (2026-08-23, pedido do usuário: "ao clicar na linha seria interessante
 * abrir uma modal com as informações mais aprofundadas") — tudo que saiu da tabela
 * resumida (Balance Total/Dano Total/Cura Total) mais o detalhe por jogador (Loot/
 * Supplies/Balance/Dano/Cura), as transferências calculadas e o log bruto colado, pra quem
 * quiser conferir/reprocessar. Não busca nada novo — `SplitLog` já veio inteiro de
 * useSplitLogsList. **Coluna "Balance Ajustado" removida no mesmo dia** (pedido do
 * usuário: "não deveria existir... não vale muito a pena ter nessa tela") — `m.balance`
 * (bruto do log) já é o que importa aqui; o ajuste por Gastos Extras/Cotação TC só faz
 * sentido no contexto AO VIVO da Calculadora (onde o usuário está digitando os extras
 * daquele split específico), não numa tela de histórico read-only. */
function SplitDetailModal({ log, onClose, onDelete, deleteError }: { log: SplitLog; onClose: () => void; onDelete: () => void; deleteError: string | null }) {
  const [copiedIndices, setCopiedIndices] = useState<Set<number>>(new Set());
  const [showRawLog, setShowRawLog] = useState(false);

  const handleCopy = (commandText: string, idx: number) => {
    navigator.clipboard.writeText(commandText);
    setCopiedIndices((prev) => new Set(prev).add(idx));
  };

  return (
    <Modal title={`${log.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'} — ${log.date}`} onClose={onClose} maxWidth={680}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
        {deleteError && <span className="texto-perigo" style={{ fontSize: '12px' }}>⚠ {deleteError}</span>}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
          <div className="grid-2col" style={{ gap: '10px', flex: 1 }}>
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Balance Total</span>
              <strong className="texto-sucesso">{formatTibiaGold(log.totalBalance)}</strong>
            </div>
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', display: 'block' }}>Cota por Membro</span>
              <strong style={{ color: 'var(--color-accent)' }}>{formatTibiaGold(log.equalShare)}</strong>
            </div>
          </div>
          <button type="button" onClick={onDelete} title="Excluir este split (soft delete)" className="botao-icone">
            🗑️
          </button>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text)' }}>Detalhe por jogador</h4>
          <div className="loot-table-wrapper">
            <table className="loot-table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Loot</th>
                  <th>Supplies</th>
                  <th>Balance</th>
                  <th>Dano</th>
                  <th>Cura</th>
                </tr>
              </thead>
              <tbody>
                {log.members.map((m) => (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td className="col-gold positive">{formatTibiaGold(m.loot)}</td>
                    <td>{formatTibiaGold(m.supplies)}</td>
                    <td className="col-gold positive">{formatTibiaGold(m.balance)}</td>
                    <td>{m.damage.toLocaleString('pt-BR')}</td>
                    <td>{m.healing.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--color-text)' }}>Transferências</h4>
          {log.transfers.length === 0 ? (
            <p className="texto-fraco" style={{ fontSize: '12px', margin: 0 }}>Nenhuma transferência necessária.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {log.transfers.map((t, idx) => (
                <div key={idx} style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="texto-mudo" style={{ fontSize: '11px' }}>
                      <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{t.from}</span> paga para <span className="texto-sucesso" style={{ fontWeight: 'bold' }}>{t.to}</span>
                    </div>
                    <div className="texto-mono" style={{ fontSize: '12px', marginTop: '2px' }}>{t.commandText}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(t.commandText, idx)}
                    style={{
                      background: copiedIndices.has(idx) ? 'var(--color-success)' : 'var(--color-border)',
                      color: copiedIndices.has(idx) ? 'var(--color-bg)' : 'var(--color-text)',
                      border: 'none', padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', minWidth: '60px',
                    }}
                  >
                    {copiedIndices.has(idx) ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowRawLog((v) => !v)}
            className="botao-secundario"
            style={{ fontSize: '12px', padding: '5px 12px' }}
          >
            {showRawLog ? '▲ Esconder log bruto' : '▼ Ver log bruto colado'}
          </button>
          {showRawLog && (
            <pre className="texto-mono" style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px', fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {log.rawLog}
            </pre>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** Histórico de Splits (2026-08-21/22/23, pedido do usuário: "uma maneira de filtrar os
 * splits por maior dano maior cura separado por player"). 1 linha por SPLIT (dia com
 * Boss+Hunt mostra 2 linhas, não 1 por jogador), com dano/cura de cada jogador em colunas
 * dedicadas — dado vem das colunas rígidas player1_*..player8_* (migration 20260822000000,
 * até 8 slots) via `SplitLog.playerSlots`, com fallback pra `members[].damage/.healing`
 * nos splits salvos entre 2026-08-21 e a migration.
 *
 * Tabela enxuta (2026-08-23, pedido do usuário: "aparecer apenas 'cota membro' 'jogador
 * dano e cura'") — Balance Total/Dano Total/Cura Total saíram da tabela, foram pro modal de
 * detalhes (clique na linha, ver SplitDetailModal). `maxPlayerSlots` agora é computado
 * sobre `filteredRows` (não mais `rows` inteiro) — "não mostrar colunas se elas não houver
 * player naquele mes" — se o período/filtro atual só tem splits de até 5 jogadores, a
 * tabela não desperdiça espaço com colunas 6-8 vazias, mesmo que ALGUM outro split fora do
 * filtro atual tenha mais.
 *
 * Filtros: janela "Ver últimos" (30/60/90/120/365d, default 30, mesmo componente da aba
 * XP); dropdown de Player filtra SPLITS em que aquele jogador participou (mantém a linha
 * inteira); botões "🎯 Maior Dano"/"💚 Maior Cura" ordenam pela SOMA de dano/cura de todos
 * os jogadores daquele split. Resumo por player (2 cards, "🗡️ Hunt"/"🐲 Boss" — pedido do
 * usuário em 2026-08-23: "era ele ser a media de dano/cura isso pra hunt e boss") mostra a
 * MÉDIA de dano/cura por split de cada jogador, calculada separadamente por tipo (hunt e
 * boss têm perfis de dano bem diferentes, misturar não fazia sentido). */
export function SplitsHistoricoPage() {
  const { accountId } = useAccount();
  const { splitLogs, loading, error, hideSplit } = useSplitLogsList(accountId);
  const [windowDays, setWindowDays] = useState(30);
  const [selectedPlayer, setSelectedPlayer] = useState(TODOS_PLAYERS);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Excluir 1 split (soft delete, 2026-08-23, pedido do usuário: "uma maneira para excluir
  // um split caso o usuario tenha feito errado") — mesmo padrão de confirmação + 🗑️ já
  // usado no resto do app (ver ServiceirosPage/CalendarioPage).
  const handleDeleteSplit = async (log: SplitLog) => {
    const label = `${log.type === 'boss' ? 'Boss' : 'Hunt'} de ${log.date}`;
    if (!window.confirm(`Excluir o split ${label}? Essa ação não pode ser desfeita por aqui.`)) return;
    setDeleteError(null);
    try {
      await hideSplit(log.id);
      setSelectedSplitId(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir split.');
    }
  };

  const rows = useMemo<SplitRow[]>(() => {
    return splitLogs.map((log) => {
      const players = resolvePlayers(log);
      return {
        id: log.id,
        date: log.date,
        type: log.type,
        totalBalance: log.totalBalance,
        equalShare: log.equalShare,
        players,
        totalDamage: players.reduce((s, p) => s + p.damage, 0),
        totalHealing: players.reduce((s, p) => s + p.healing, 0),
        durationMinutes: log.durationMinutes,
      };
    });
  }, [splitLogs]);

  const playerOptions = useMemo(
    () => Array.from(new Set(rows.flatMap((r) => r.players.map((p) => p.name)))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const windowStartTs = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    return rows.filter((r) => {
      if (selectedPlayer && !r.players.some((p) => p.name === selectedPlayer)) return false;
      if (parseDateKey(r.date) < windowStartTs) return false;
      return true;
    });
  }, [rows, selectedPlayer, windowDays]);

  // Só o nº de colunas de jogador que o período FILTRADO realmente precisa — não o máximo
  // histórico de todos os splits já salvos (ver doc do módulo acima).
  const maxPlayerSlots = useMemo(() => Math.max(1, ...filteredRows.map((r) => r.players.length)), [filteredRows]);

  // Resumo por player (2026-08-23, refinamento — pedido do usuário: "aquele resumo dano
  // cura... era ele ser a media de dano/cura isso pra hunt e boss"). Primeira versão
  // (soma÷nº de splits) foi corrigida no mesmo dia — usuário reparou que uma hunt de 3h
  // teria dano bruto maior que uma de 1h só pela duração, então "média por split" não
  // comparava like-for-like: "o dano medio eu acho que esta errado pois a hunt ela pode
  // durar 2 ou 3 horas tem que analisar isso antes talvez mais uma coluna no banco".
  // Agora é dano/cura POR HORA: soma do dano/cura do jogador NAQUELE TIPO ÷ soma das
  // DURAÇÕES (em horas) dos splits daquele tipo em que ele apareceu — uma média ponderada
  // pela duração de cada sessão, não uma média simples por split. Splits sem
  // `durationMinutes` (log sem a linha "Session: HH:MMh") ficam de fora desse cálculo
  // específico — nunca inventa uma duração — mas continuam na tabela normalmente.
  const playerAveragesByType = useMemo(() => {
    function summarize(type: 'hunt' | 'boss') {
      const totals = new Map<string, { damage: number; healing: number; hours: number; splitCount: number }>();
      for (const row of filteredRows) {
        if (row.type !== type) continue;
        if (!row.durationMinutes) continue;
        const hours = row.durationMinutes / 60;
        for (const p of row.players) {
          const cur = totals.get(p.name) ?? { damage: 0, healing: 0, hours: 0, splitCount: 0 };
          cur.damage += p.damage;
          cur.healing += p.healing;
          cur.hours += hours;
          cur.splitCount += 1;
          totals.set(p.name, cur);
        }
      }
      return Array.from(totals.entries())
        .map(([name, t]) => ({ name, damagePerHour: t.damage / t.hours, healingPerHour: t.healing / t.hours, splitCount: t.splitCount }))
        .sort((a, b) => b.damagePerHour - a.damagePerHour);
    }
    return { hunt: summarize('hunt'), boss: summarize('boss') };
  }, [filteredRows]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleDamageSort = () => {
    if (sortKey === 'totalDamage' && sortDir === 'desc') {
      setSortKey('date');
      setSortDir('desc');
    } else {
      setSortKey('totalDamage');
      setSortDir('desc');
    }
  };

  const toggleHealingSort = () => {
    if (sortKey === 'totalHealing' && sortDir === 'desc') {
      setSortKey('date');
      setSortDir('desc');
    } else {
      setSortKey('totalHealing');
      setSortDir('desc');
    }
  };

  const isDamageActive = sortKey === 'totalDamage' && sortDir === 'desc';
  const isHealingActive = sortKey === 'totalHealing' && sortDir === 'desc';

  const sortedRows = useMemo(() => {
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb), 'pt-BR') * factor;
    });
  }, [filteredRows, sortKey, sortDir]);

  const selectedSplit = selectedSplitId ? splitLogs.find((l) => l.id === selectedSplitId) ?? null : null;

  if (loading) return <div className="loading">Carregando...</div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (rows.length === 0) {
    return <p className="estado-vazio">Nenhum split salvo ainda — use "💾 Salvar Split Boss/Hunt" na Calculadora de Split Loot.</p>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <span className="texto-mudo" style={{ fontSize: '12px' }}>Ver últimos:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWindowDays(opt)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                border: windowDays === opt ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: windowDays === opt ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
                color: windowDays === opt ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          style={{ background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
        >
          <option value={TODOS_PLAYERS}>Todos os players</option>
          {playerOptions.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={toggleDamageSort}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            border: isDamageActive ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            background: isDamageActive ? 'var(--color-danger-soft)' : 'var(--color-bg-input)',
            color: isDamageActive ? 'var(--color-danger)' : 'var(--color-text-muted)',
          }}
        >
          🎯 Maior Dano
        </button>

        <button
          type="button"
          onClick={toggleHealingSort}
          style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            border: isHealingActive ? '1px solid var(--color-success)' : '1px solid var(--color-border)',
            background: isHealingActive ? 'var(--color-success-soft)' : 'var(--color-bg-input)',
            color: isHealingActive ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}
        >
          💚 Maior Cura
        </button>
      </div>

      {(playerAveragesByType.hunt.length > 0 || playerAveragesByType.boss.length > 0) && (
        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '16px' }}>
          {playerAveragesByType.hunt.length > 0 && (
            <div className="card-compacto">
              <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-warning)' }}>🗡️ Hunt — Média por hora</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {playerAveragesByType.hunt.map((p) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>{p.name} <span className="texto-fraco" style={{ fontWeight: 'normal' }}>({p.splitCount})</span></span>
                    <span>
                      <span className="texto-perigo">Dano/h: {Math.round(p.damagePerHour).toLocaleString('pt-BR')}</span>
                      {' · '}
                      <span className="texto-sucesso">Cura/h: {Math.round(p.healingPerHour).toLocaleString('pt-BR')}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {playerAveragesByType.boss.length > 0 && (
            <div className="card-compacto">
              <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>🐲 Boss — Média por hora</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {playerAveragesByType.boss.map((p) => (
                  <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <span style={{ color: 'var(--color-text)', fontWeight: 'bold' }}>{p.name} <span className="texto-fraco" style={{ fontWeight: 'normal' }}>({p.splitCount})</span></span>
                    <span>
                      <span className="texto-perigo">Dano/h: {Math.round(p.damagePerHour).toLocaleString('pt-BR')}</span>
                      {' · '}
                      <span className="texto-sucesso">Cura/h: {Math.round(p.healingPerHour).toLocaleString('pt-BR')}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {filteredRows.length === 0 ? (
        <p className="estado-vazio">Nenhum split encontrado com esses filtros.</p>
      ) : (
        <div className="loot-table-wrapper">
          <table className="loot-table">
            <thead>
              <tr>
                {BASE_COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    title="Clique para ordenar"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                ))}
                {Array.from({ length: maxPlayerSlots }, (_, i) => (
                  <th key={`p${i}`} colSpan={3}>Jogador {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} onClick={() => setSelectedSplitId(row.id)} title="Clique para ver detalhes" style={{ cursor: 'pointer' }}>
                  <td>{row.date}</td>
                  <td>{row.type === 'boss' ? '🐲 Boss' : '🗡️ Hunt'}</td>
                  <td className="col-gold positive">{formatTibiaGold(row.equalShare)}</td>
                  {Array.from({ length: maxPlayerSlots }, (_, i) => {
                    const p = row.players[i];
                    return (
                      <Fragment key={`p${i}`}>
                        <td>{p?.name ?? '—'}</td>
                        <td>{p ? p.damage.toLocaleString('pt-BR') : '—'}</td>
                        <td>{p ? p.healing.toLocaleString('pt-BR') : '—'}</td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSplit && (
        <SplitDetailModal
          log={selectedSplit}
          onClose={() => { setSelectedSplitId(null); setDeleteError(null); }}
          onDelete={() => handleDeleteSplit(selectedSplit)}
          deleteError={deleteError}
        />
      )}
    </div>
  );
}
