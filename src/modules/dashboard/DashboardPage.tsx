import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useLootDrops } from '@/hooks/useLootDrops';
import { useMembers } from '@/hooks/useMembers';
import { useMemberLiveStats } from '@/hooks/useMemberLiveStats';
import { useMemberXpStats } from '@/hooks/useMemberXpStats';
import { useBossHuntSheet } from '@/hooks/useBossHuntSheet';
import { useXpSheet } from '@/hooks/useXpSheet';
import { formatTibiaGold } from '@/services/split';
import { predictEndOfYearLevel } from '@/services/xp-sheet/level-prediction';
import { monthRangeAsBr } from '@/services/common/months';
import { dateAsBr, todayAsBr } from '@/services/common/br-date';
import { parseDateKey } from '@/services/calendar';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import type { LootDropFilters, MemberXpStats } from '@/types';

const MESES = [
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

/** Lvl Atual e Skill vêm ao vivo da API do TibiaData (ver useMemberLiveStats). Previsão fim
 * de ano também é real agora (2026-08-10, ver previsaoPorMembro/level-prediction.ts) — só
 * "metas" (tabela de 16 níveis) dentro de MemberXpStats continua mock por enquanto, ver
 * memória do projeto "checkpoint-banco-mock"/"integracao-planilha-xp". */
const EMPTY_XP_STATS: MemberXpStats = { xpOntem: '—', xp30Dias: '—', metas: {} };

const NIVEIS_METAS = [1650, 1700, 1750, 1800, 1850, 1900, 1950, 2000, 2050, 2100, 2150, 2200, 2250, 2300, 2350, 2400];

function getMetaCellStyle(val: string) {
  if (val === 'Lvl Atingido') {
    return { background: '#ef4444', color: '#fff' }; // Vermelho
  }
  if (val.startsWith('+')) {
    // Definindo cores conforme a imagem de referência (exemplos aproximados por faixa/coluna)
    return { background: '#3b82f6', color: '#fff' }; // Azul padrão ou verde/amarelo conforme status
  }
  return { background: '#1e293b', color: '#f8fafc' };
}

export function DashboardPage() {
  const { account, accountId, loading: accountLoading } = useAccount();
  const { members } = useMembers(accountId);
  const liveStats = useMemberLiveStats(members);
  const { statsByName } = useMemberXpStats(accountId);
  const { series: bossHuntSeries } = useBossHuntSheet();
  const { data: xpSheetData } = useXpSheet();

  // Previsão fim de ano — antes vinha de um script no Google Sheets do usuário, portado
  // pra cá em 2026-08-10 (ver services/xp-sheet/level-prediction.ts). XP atual vem ao vivo
  // dos Highscores (categoria "experience", via useMemberLiveStats); média diária vem de
  // xp90Dias da planilha (janela de 90 dias, mais estável que os 30 do card "Xp 30Dias").
  // '—' se faltar level/XP atual/histórico de 90 dias pra esse personagem.
  const previsaoPorMembro = useMemo(() => {
    const result: Record<string, string> = {};
    for (const m of members) {
      const live = liveStats[m.characterName];
      const xp90Dias = xpSheetData[m.characterName]?.xp90Dias;
      if (!live?.level || !live.experience || !xp90Dias) continue;
      result[m.characterName] = String(
        predictEndOfYearLevel({ currentLevel: live.level, currentXp: live.experience, avgDailyXp: xp90Dias / 90 }),
      );
    }
    return result;
  }, [members, liveStats, xpSheetData]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [bossFilter] = useState('');
  const [soldFilter] = useState<string>('all');

  const filters: LootDropFilters = useMemo(() => {
    const { from, to } = monthRangeAsBr(Number(selectedMonth), Number(selectedYear));
    const f: LootDropFilters = { dateFrom: from, dateTo: to };
    if (bossFilter) f.bossName = bossFilter;
    if (soldFilter === 'sold') f.sold = true;
    if (soldFilter === 'unsold') f.sold = false;
    return f;
  }, [selectedMonth, selectedYear, bossFilter, soldFilter]);

  const { drops, loading, error } = useLootDrops(accountId, filters);

  // KKs Hunt/KKs Boss = soma do profit individual (aba "Boss hunt" da planilha, já
  // dividido por 4/5) dos dias dentro do Mês/Ano selecionado ao lado — mesmo range
  // usado pra filtrar "Drops no mês".
  const bossHuntTotals = useMemo(() => {
    const fromTs = filters.dateFrom ? parseDateKey(filters.dateFrom) : -Infinity;
    const toTs = filters.dateTo ? parseDateKey(filters.dateTo) : Infinity;
    let hunt = 0;
    let boss = 0;
    for (const entry of bossHuntSeries) {
      const ts = parseDateKey(entry.date);
      if (ts >= fromTs && ts <= toTs) {
        hunt += entry.hunt;
        boss += entry.boss;
      }
    }
    return { hunt, boss };
  }, [bossHuntSeries, filters.dateFrom, filters.dateTo]);

  // Independente do mês selecionado — "todos os itens não vendidos" é de todos os meses,
  // não só do mês em exibição na tabela "Drops no mês".
  const { drops: allUnsoldDrops, loading: unsoldLoading, error: unsoldError } = useLootDrops(accountId, { sold: false });

  const unsoldGrouped = useMemo(() => {
    const byItem = new Map<string, number>();
    for (const d of allUnsoldDrops) {
      byItem.set(d.itemName, (byItem.get(d.itemName) ?? 0) + 1);
    }
    return Array.from(byItem.entries())
      .map(([itemName, count]) => ({ itemName, count }))
      .sort((a, b) => b.count - a.count || a.itemName.localeCompare(b.itemName));
  }, [allUnsoldDrops]);

  // KKs Plunder(ind) / Qtd Plunders = soma do Valor Total (e contagem) dos drops do
  // mês/ano selecionado cujo boss é "Plunder" (baú compartilhado, sem fragador único —
  // ver comentário no ranking Top Drop mais abaixo).
  // KKs Bags(ind) / Qtd Bags = mesma ideia, só que pros "outros" bosses — todo drop cujo
  // boss não seja "Plunder" nem "SoulCore" (esse último também é um baú compartilhado por
  // categoria, não um boss de verdade — os itens dentro dele são sempre "SoulCore ...").
  // Pedido do usuário: puxar os 2 direto dos drops reais em vez de número solto do mock.
  const stats = useMemo(() => {
    const totalValue = drops.reduce((s, d) => s + d.totalValue, 0);
    const soldCount = drops.filter((d) => d.sold).length;
    const pendingCount = drops.filter((d) => !d.sold).length;
    const serviceiroDropsCount = drops.filter((d) => d.party.service).length;
    const plunderDrops = drops.filter((d) => d.bossName === 'Plunder');
    const plunderTotal = plunderDrops.reduce((s, d) => s + d.totalValue, 0);
    const bagsDrops = drops.filter((d) => d.bossName !== 'Plunder' && d.bossName !== 'SoulCore');
    const bagsTotal = bagsDrops.reduce((s, d) => s + d.totalValue, 0);
    return {
      totalValue, soldCount, pendingCount, totalDrops: drops.length, serviceiroDropsCount,
      plunderTotal, plunderCount: plunderDrops.length,
      bagsTotal, bagsCount: bagsDrops.length,
    };
  }, [drops]);

  // Total (ind) = soma dos 4 KKs individuais do mês/ano selecionado (pedido do usuário) —
  // sempre recalculado a partir dos outros cards, nenhum deles vem mais de mock.
  const totalInd = useMemo(() => {
    return stats.plunderTotal + stats.bagsTotal + bossHuntTotals.hunt + bossHuntTotals.boss;
  }, [stats.plunderTotal, stats.bagsTotal, bossHuntTotals]);

  // Top Drop é dos últimos 365 dias — independente do seletor de Mês, então busca à parte.
  const last365Filters = useMemo(() => {
    const now = new Date();
    const yearAgo = new Date(now);
    yearAgo.setDate(yearAgo.getDate() - 365);
    return { dateFrom: dateAsBr(yearAgo), dateTo: todayAsBr() };
  }, []);
  const { drops: last365Drops, loading: topDropLoading } = useLootDrops(accountId, last365Filters);

  // Ranking de quem mais trouxe dinheiro pra PT (soma do Valor Total de cada drop pelo
  // Fragador). Drops sem fragador (baú compartilhado tipo Plunder/SoulCore) não têm dono
  // único, então ficam fora do ranking por jogador. Boss "Plunder" fica fora mesmo quando
  // tem fragador preenchido — a pedido do usuário, esse tipo de drop não conta pro Top Drop.
  const topDropRanking = useMemo(() => {
    const byLooter = new Map<string, { looter: string; totalValue: number; dropCount: number }>();
    for (const d of last365Drops) {
      if (!d.looter) continue;
      if (d.bossName === 'Plunder') continue;
      const existing = byLooter.get(d.looter);
      if (existing) {
        existing.totalValue += d.totalValue;
        existing.dropCount += 1;
      } else {
        byLooter.set(d.looter, { looter: d.looter, totalValue: d.totalValue, dropCount: 1 });
      }
    }
    return Array.from(byLooter.values())
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [drops]);

  if (accountLoading) return <div className="loading">Carregando...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1700px', margin: '0 auto', color: '#f8fafc' }}>
      
      {/* CABEÇALHO */}
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Dashboard — {account?.partyName}</h2>
          <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Painel geral de controle de indicadores, XP e histórico da party</p>
        </div>
      </header>

      {/* LAYOUT EM GRID: 3 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.1fr 1.1fr', gap: '20px' }}>

        {/* COLUNA 1: TABELA "DROPS NO MÊS" + SELETOR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={{ background: '#1e293b', padding: '10px 15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>Mês</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ flex: 1, background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <input 
                type="text" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ width: '75px', background: '#0f172a', color: '#fff', border: '1px solid #334155', padding: '6px 8px', borderRadius: '4px', textAlign: 'center', fontSize: '13px' }}
              />
            </div>
          </div>

          <div className="card" style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>Drops no mês</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Vendido / Valor</span>
            </div>

            <div style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Carregando...</div>}
              {error && <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>{error}</div>}
              {!loading && !error && drops.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Nenhum drop encontrado.</div>
              )}
              {!loading && !error && drops.length > 0 && (
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {drops.map((drop, idx) => {
                      const isSold = drop.sold;
                      const rowBg = isSold ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)';
                      return (
                        <tr key={drop.id || idx} style={{ borderBottom: '1px solid #334155', background: rowBg }}>
                          <td style={{ padding: '6px 4px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getItemIconUrl(drop.itemName) && (
                              <img src={getItemIconUrl(drop.itemName)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain', imageRendering: 'pixelated' }} />
                            )}
                            <span>{drop.itemName || 'Item Raro'}</span>
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center', color: isSold ? '#10b981' : '#ef4444', fontWeight: 'bold', width: '60px' }}>
                            {isSold ? 'Sim' : 'Não'}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', color: isSold ? '#10b981' : '#64748b', fontFamily: 'monospace', width: '110px' }}>
                            {isSold ? formatTibiaGold(drop.totalValue) : '---'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* COLUNA 2: BLOCOS DE INDICADORES (KPIs) + PLANILHA CENTRAL DE MEMBROS E METAS DE XP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* GRADE DE 10 INDICADORES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qtd Drops</span>
              <strong style={{ fontSize: '14px', color: '#fff' }}>{stats.totalDrops}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qtd N Vendido</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-warning, #f59e0b)' }}>{stats.pendingCount}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qtd Serviceiro</span>
              <strong style={{ fontSize: '14px', color: '#38bdf8' }}>{stats.serviceiroDropsCount}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>KKs Plunder(ind)</span>
              <strong style={{ fontSize: '11px', color: '#10b981' }}>{formatTibiaGold(stats.plunderTotal)}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>KKs Hunt</span>
              <strong style={{ fontSize: '11px', color: '#f8fafc' }}>{formatTibiaGold(bossHuntTotals.hunt)}</strong>
            </div>

            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qtd Bags</span>
              <strong style={{ fontSize: '14px', color: '#fff' }}>{stats.bagsCount}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Qtd Plunders</span>
              <strong style={{ fontSize: '14px', color: '#fff' }}>{stats.plunderCount}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Total (ind)</span>
              <strong style={{ fontSize: '11px', color: '#10b981' }}>{formatTibiaGold(totalInd)}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>KKs Bags(ind)</span>
              <strong style={{ fontSize: '11px', color: '#10b981' }}>{formatTibiaGold(stats.bagsTotal)}</strong>
            </div>
            <div style={{ background: '#1e293b', padding: '10px 8px', borderRadius: '6px', border: '1px solid #334155', textAlign: 'center' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>KKs Boss</span>
              <strong style={{ fontSize: '11px', color: '#38bdf8' }}>{formatTibiaGold(bossHuntTotals.boss)}</strong>
            </div>
          </div>

          {/* VALOR TOTAL CONSOLIDADO */}
          <div style={{ background: '#1e293b', padding: '12px 20px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Valor Total em Drops (Sistema)</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{formatTibiaGold(stats.totalValue)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Vendidos / Pendentes</span>
              <span style={{ fontSize: '14px', color: '#38bdf8' }}>{stats.soldCount} / {stats.pendingCount}</span>
            </div>
          </div>

          {/* PLANILHA CENTRAL DE MEMBROS, SKILLS E METAS DE XP */}
          <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center', fontFamily: 'monospace' }}>
              <thead>
                {/* Linha de Nomes dos Membros */}
                <tr style={{ background: '#334155', color: '#fff' }}>
                  <th style={{ padding: '8px', border: '1px solid #475569', width: '110px' }}></th>
                  {members.map((m) => (
                    <th key={m.id} style={{ padding: '8px', border: '1px solid #475569', fontWeight: 'bold', fontSize: '13px' }}>
                      {m.characterName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Lvl Atual — ao vivo via TibiaData (character) */}
                <tr style={{ background: '#cbd5e1', color: '#0f172a', fontWeight: 'bold' }}>
                  <td style={{ padding: '6px', border: '1px solid #94a3b8', textAlign: 'left', paddingLeft: '10px' }}>Lvl Atual</td>
                  {members.map((m) => {
                    const live = liveStats[m.characterName];
                    return (
                      <td key={m.id} style={{ padding: '6px', border: '1px solid #94a3b8' }}>
                        {live?.loading ? '…' : live?.level ?? '—'}
                      </td>
                    );
                  })}
                </tr>
                {/* Skill — ao vivo via TibiaData (highscores, top 500 do mundo) */}
                <tr style={{ background: '#cbd5e1', color: '#0f172a', fontWeight: 'bold' }}>
                  <td style={{ padding: '6px', border: '1px solid #94a3b8', textAlign: 'left', paddingLeft: '10px' }}>Skill</td>
                  {members.map((m) => {
                    const live = liveStats[m.characterName];
                    return (
                      <td key={m.id} style={{ padding: '6px', border: '1px solid #94a3b8' }}>
                        {live?.loading ? '…' : live?.skillLabel ?? '—'}
                      </td>
                    );
                  })}
                </tr>
                {/* Xp Ontem */}
                <tr style={{ background: '#e2e8f0', color: '#0f172a' }}>
                  <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp Ontem</td>
                  {members.map((m) => {
                    const extra = statsByName[m.characterName] ?? EMPTY_XP_STATS;
                    return (
                      <td key={m.id} style={{ padding: '6px', border: '1px solid #cbd5e1', color: extra.xpOntem.startsWith('-') ? '#ef4444' : '#10b981' }}>
                        {extra.xpOntem}
                      </td>
                    );
                  })}
                </tr>
                {/* Xp 30Dias */}
                <tr style={{ background: '#e2e8f0', color: '#0f172a' }}>
                  <td style={{ padding: '6px', border: '1px solid #cbd5e1', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp 30Dias</td>
                  {members.map((m) => (
                    <td key={m.id} style={{ padding: '6px', border: '1px solid #cbd5e1', color: '#10b981' }}>
                      {(statsByName[m.characterName] ?? EMPTY_XP_STATS).xp30Dias}
                    </td>
                  ))}
                </tr>
                {/* Previsão fim de ano */}
                <tr style={{ background: '#facc15', color: '#0f172a', fontWeight: 'bold' }}>
                  <td style={{ padding: '6px', border: '1px solid #eab308', textAlign: 'left', paddingLeft: '10px' }}>Previsão fim de ano</td>
                  {members.map((m) => (
                    <td key={m.id} style={{ padding: '6px', border: '1px solid #eab308' }}>
                      {previsaoPorMembro[m.characterName] ?? '—'}
                    </td>
                  ))}
                </tr>

                {/* Cabeçalho Seção Metas */}
                <tr>
                  <td colSpan={5} style={{ background: '#475569', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center', border: '1px solid #334155' }}>
                    Meta XP Diaria para atingir ao final do ano o Lvl Indicado
                  </td>
                </tr>

                {/* Linhas de Metas por Nível */}
                {NIVEIS_METAS.map((lvl) => (
                  <tr key={lvl} style={{ background: '#1e293b' }}>
                    <td style={{ padding: '5px', border: '1px solid #334155', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold', color: '#cbd5e1', fontSize: '11px' }}>
                      Lvl {lvl}
                    </td>
                    {members.map((m) => {
                      const extra = statsByName[m.characterName] ?? EMPTY_XP_STATS;
                      const val = extra.metas[lvl] ?? '';
                      const style = getMetaCellStyle(val);
                      return (
                        <td key={m.id} style={{ padding: '5px', border: '1px solid #334155', backgroundColor: style.background, color: style.color, fontSize: '11px' }}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* COLUNA 3: ITENS NÃO VENDIDOS & TOP DROPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#f59e0b' }}>TODOS os Itens não vendidos</h3>
              <span style={{ fontSize: '12px', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                Qtd: {allUnsoldDrops.length}
              </span>
            </div>

            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {unsoldLoading && <div style={{ padding: '15px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Carregando...</div>}
              {unsoldError && <div style={{ padding: '15px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>{unsoldError}</div>}
              {!unsoldLoading && !unsoldError && unsoldGrouped.length === 0 && (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>Nenhum item pendente no momento.</p>
              )}
              {!unsoldLoading && !unsoldError && unsoldGrouped.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {unsoldGrouped.map((item) => {
                    const iconUrl = getItemIconUrl(item.itemName);
                    return (
                      <div key={item.itemName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', borderBottom: '1px solid #1e293b' }}>
                        {iconUrl
                          ? <img src={iconUrl} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                          : <span style={{ width: '20px', flexShrink: 0 }} />}
                        <span style={{ color: '#e2e8f0', fontSize: '13px', flex: 1 }}>{item.itemName || 'Item Raro'}</span>
                        <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>x{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Top Drop</h3>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '8px', marginTop: '-6px' }}>Últimos 365 dias</span>
            {topDropLoading && <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Carregando...</div>}
            {!topDropLoading && topDropRanking.length === 0 && (
              <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>
                Nenhum drop com fragador nos últimos 365 dias.
              </div>
            )}
            {!topDropLoading && topDropRanking.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topDropRanking.map((entry, idx) => (
                  <div key={entry.looter} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid #1e293b' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 'bold',
                      background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#334155',
                      color: idx <= 2 ? '#0f172a' : '#cbd5e1',
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, color: '#e2e8f0', fontSize: '13px' }}>{entry.looter}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                        {formatTibiaGold(entry.totalValue)}
                      </span>
                      <span style={{ display: 'block', color: '#64748b', fontSize: '11px' }}>
                        {entry.dropCount} {entry.dropCount === 1 ? 'drop' : 'drops'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}