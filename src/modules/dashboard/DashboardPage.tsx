import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useLootDrops } from '@/hooks/useLootDrops';
import { useMembers } from '@/hooks/useMembers';
import { useMemberLiveStats } from '@/hooks/useMemberLiveStats';
import { useMemberXpStats } from '@/hooks/useMemberXpStats';
import { useSplitLogsDaily } from '@/hooks/useSplitLogsDaily';
import { useXpSheet } from '@/hooks/useXpSheet';
import { useXpLevels } from '@/hooks/useXpLevels';
import { formatTibiaGold } from '@/services/split';
import { predictEndOfYearLevel } from '@/services/xp-sheet/level-prediction';
import { computeMetaLevelRange, computeDailyGoals } from '@/services/xp-sheet/meta-xp-diaria';
import { monthRangeAsBr } from '@/services/common/months';
import { dateAsBr, todayAsBr } from '@/services/common/br-date';
import { parseDateKey } from '@/services/calendar';
import { getItemIconUrl } from '@/services/lootdrop/item-icons';
import { buildLast12Months, computeMonthlyTrends, type DashboardMetricKey } from '@/services/dashboard/monthly-trend';
import { UnsoldItemsShareModal } from './components/UnsoldItemsShareModal';
import { MonthlyTrendModal } from './components/MonthlyTrendModal';
import { PlayerDropsModal } from './components/PlayerDropsModal';
import type { LootDropFilters, MemberXpStats } from '@/types';

/** Rótulo + tipo de valor (gold vs contagem) de cada KPI clicável do grid — usado pra
 * título/formatação da modal de tendência mensal (MonthlyTrendModal, 2026-08-21). */
const METRIC_META: Record<DashboardMetricKey, { label: string; isCurrency: boolean }> = {
  qtdDrops: { label: 'Qtd Drops', isCurrency: false },
  qtdNVendido: { label: 'Qtd N Vendido', isCurrency: false },
  qtdServiceiro: { label: 'Qtd Serviceiro', isCurrency: false },
  kksPlunderInd: { label: 'KKs Plunder(ind)', isCurrency: true },
  kksHunt: { label: 'KKs Hunt', isCurrency: true },
  qtdBags: { label: 'Qtd Bags', isCurrency: false },
  qtdPlunders: { label: 'Qtd Plunders', isCurrency: false },
  totalInd: { label: 'Total (ind)', isCurrency: true },
  kksBagsInd: { label: 'KKs Bags(ind)', isCurrency: true },
  kksBoss: { label: 'KKs Boss', isCurrency: true },
};

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
const EMPTY_XP_STATS: MemberXpStats = { xpOntem: '—', xp30Dias: '—' };

function getMetaCellStyle(val: string) {
  if (val === 'Lvl Atingido') {
    return { background: 'var(--color-danger-soft)', color: 'var(--color-danger)' };
  }
  if (val.startsWith('+')) {
    return { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' };
  }
  return { background: 'transparent', color: 'var(--color-text-muted)' };
}

export function DashboardPage() {
  const { accountId, loading: accountLoading } = useAccount();
  const { members } = useMembers(accountId);
  const liveStats = useMemberLiveStats(members);
  const { statsByName } = useMemberXpStats(accountId);
  const { series: splitDailySeries } = useSplitLogsDaily(accountId);
  const { data: xpSheetData } = useXpSheet();
  const { levels: xpLevelsTable } = useXpLevels();

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

  // Meta XP Diária — níveis exibidos são dinâmicos (pedido do usuário em 2026-08-14): do
  // menor nível atual da party − 2 estágios (100 níveis) até o maior nível + 4 estágios
  // (200 níveis), sempre múltiplos de 50. XP necessária por nível vem da tabela real
  // xp_levels (ver useXpLevels/services/xp-sheet/meta-xp-diaria.ts), não é mais mock.
  const niveisMetas = useMemo(() => {
    const currentLevels = members
      .map((m) => liveStats[m.characterName]?.level)
      .filter((lvl): lvl is number => typeof lvl === 'number' && lvl > 0);
    return computeMetaLevelRange(currentLevels);
  }, [members, liveStats]);

  const metaXpDiariaPorMembro = useMemo(() => {
    const result: Record<string, Record<number, string>> = {};
    for (const m of members) {
      const live = liveStats[m.characterName];
      if (!live?.experience) continue;
      result[m.characterName] = computeDailyGoals(live.experience, niveisMetas, xpLevelsTable);
    }
    return result;
  }, [members, liveStats, niveisMetas, xpLevelsTable]);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [bossFilter] = useState('');
  const [soldFilter] = useState<string>('all');
  const [showUnsoldShareModal, setShowUnsoldShareModal] = useState(false);
  const [activeTrendMetric, setActiveTrendMetric] = useState<DashboardMetricKey | null>(null);
  const [activePlayerDrops, setActivePlayerDrops] = useState<string | null>(null);

  // Alinhamento inferior das Colunas 1/3 com base na Coluna 2 (2026-08-25, pedido do
  // usuário: "vamos fazer um alinhamento inferior com base na tabela central"). CSS Grid
  // puro não resolve isso: mesmo com `flex:1`/`minHeight:0`/`overflow:auto` nas colunas
  // laterais, o algoritmo de auto-sizing de linha do Grid usa o tamanho de CONTEÚDO NATURAL
  // (max-content) de cada item — ignora que um filho aninhado tem scroll — então a linha
  // sempre ficava do tamanho da coluna lateral mais cheia (Drops/Itens não vendidos), não
  // da Coluna 2 (testado e confirmado via getBoundingClientRect antes desse fix: sobrava
  // ~317px de espaço vazio embaixo da Coluna 2). Solução: medir a altura RENDERIZADA da
  // Coluna 2 de verdade (ResizeObserver, reage a qualquer mudança de conteúdo — nº de
  // membros, linhas de Meta XP etc.) e aplicar como altura FIXA nas Colunas 1/3 — com uma
  // altura definida (não mais "auto"), o `flex:1` interno finalmente tem um limite real pra
  // distribuir, e o `overflow:auto` passa a cortar/rolar de verdade.
  const col2Ref = useRef<HTMLDivElement>(null);
  const [col2Height, setCol2Height] = useState<number | null>(null);

  useEffect(() => {
    const el = col2Ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setCol2Height(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Só faz sentido "esticar" as colunas laterais pra bater com a Coluna 2 quando elas estão
  // LADO A LADO (desktop) — no mobile o `.responsive-grid` empilha tudo em 1 coluna
  // (breakpoint 768px, ver global.css), e forçar a mesma altura ali só criava um vão vazio
  // enorme embaixo do conteúdo real de cada card (achado testando essa mudança no preset
  // mobile). `matchMedia` em vez de medir `window.innerWidth` no resize pra não rodar em
  // toda pixel de resize, só quando cruza o breakpoint de verdade.
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => window.matchMedia('(min-width: 769px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    const handler = () => setIsDesktopLayout(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const filters: LootDropFilters = useMemo(() => {
    const { from, to } = monthRangeAsBr(Number(selectedMonth), Number(selectedYear));
    const f: LootDropFilters = { dateFrom: from, dateTo: to };
    if (bossFilter) f.bossName = bossFilter;
    if (soldFilter === 'sold') f.sold = true;
    if (soldFilter === 'unsold') f.sold = false;
    return f;
  }, [selectedMonth, selectedYear, bossFilter, soldFilter]);

  const { drops, loading, error } = useLootDrops(accountId, filters);

  // Ordem de exibição da tabela "Drops no mês": vendidos primeiro (2026-08-17, pedido do
  // usuário), maior Valor Total primeiro dentro deles; depois os não vendidos, em ordem
  // alfabética por item (2026-08-26, pedido do usuário — preço não ajuda a achar um item
  // ainda não vendido, já que a maioria fica em 0 até a venda). Vem do banco só por data —
  // a ordenação é só de exibição, não muda `drops` em si (usado em stats/KPIs acima, que
  // não dependem de ordem).
  const sortedDrops = useMemo(
    () => [...drops].sort((a, b) => {
      if (a.sold !== b.sold) return Number(b.sold) - Number(a.sold);
      return a.sold
        ? b.totalValue - a.totalValue
        : a.itemName.localeCompare(b.itemName, 'pt-BR');
    }),
    [drops],
  );

  // KKs Hunt/KKs Boss = soma de cota_por_membro (equalShare) dos splits salvos em
  // split_logs dentro do Mês/Ano selecionado ao lado — mesmo range usado pra filtrar
  // "Drops no mês". Migrado da planilha Google Sheets (useBossHuntSheet) pro banco em
  // 2026-08-20, pedido do usuário ("os kks hunt e boss tambem vem pelo banco de dados
  // agora"), já que o Calendário fez essa mesma migração em 2026-08-19 (useSplitLogsDaily)
  // e a planilha deixou de ser a fonte de verdade. Dias sem split salvo daquele tipo
  // (hunt/boss null) não somam nada.
  const bossHuntTotals = useMemo(() => {
    const fromTs = filters.dateFrom ? parseDateKey(filters.dateFrom) : -Infinity;
    const toTs = filters.dateTo ? parseDateKey(filters.dateTo) : Infinity;
    let hunt = 0;
    let boss = 0;
    for (const entry of splitDailySeries) {
      const ts = parseDateKey(entry.date);
      if (ts >= fromTs && ts <= toTs) {
        hunt += entry.hunt ?? 0;
        boss += entry.boss ?? 0;
      }
    }
    return { hunt, boss };
  }, [splitDailySeries, filters.dateFrom, filters.dateTo]);

  // Independente do mês selecionado — "todos os itens não vendidos" é de todos os meses,
  // não só do mês em exibição na tabela "Drops no mês".
  const { drops: allUnsoldDrops, loading: unsoldLoading, error: unsoldError } = useLootDrops(accountId, { sold: false });

  const unsoldGrouped = useMemo(() => {
    const byItem = new Map<string, { count: number; totalValue: number }>();
    for (const d of allUnsoldDrops) {
      const existing = byItem.get(d.itemName) ?? { count: 0, totalValue: 0 };
      existing.count += 1;
      existing.totalValue += d.totalValue;
      byItem.set(d.itemName, existing);
    }
    return Array.from(byItem.entries())
      .map(([itemName, { count, totalValue }]) => ({ itemName, count, totalValue }))
      .sort((a, b) => b.count - a.count || a.itemName.localeCompare(b.itemName));
  }, [allUnsoldDrops]);

  // KKs Plunder(ind) / Qtd Plunders = soma do Valor CADA (unitValue — "(ind)" é individual,
  // não o valor total do drop inteiro, ver fix de 2026-08-20 abaixo) e contagem dos drops
  // do mês/ano selecionado cujo boss é "Plunder" (baú compartilhado, sem fragador único —
  // ver comentário no ranking Top Drop mais abaixo).
  // KKs Bags(ind) / Qtd Bags = mesma ideia, só que pros "outros" bosses — todo drop cujo
  // boss não seja "Plunder" nem "SoulCore" (esse último também é um baú compartilhado por
  // categoria, não um boss de verdade — os itens dentro dele são sempre "SoulCore ...").
  // Pedido do usuário: puxar os 2 direto dos drops reais em vez de número solto do mock.
  const stats = useMemo(() => {
    const totalValue = drops.reduce((s, d) => s + d.totalValue, 0);
    const soldCount = drops.filter((d) => d.sold).length;
    const pendingCount = drops.filter((d) => !d.sold).length;
    // "Qtd Serviceiro" = quantidade de VEZES que um serviceiro aparece nos drops do mês
    // (soma de party.services.length, não d.party.service — esse é o campo legado de
    // string única, sempre vazio nos drops criados pelo form atual, que usa o array
    // `services`; ver types/loot-drop.ts). Bug real reportado pelo usuário em 2026-08-21
    // ("o campo qtd serviceiro é a quantidade de vezes que aparece serviceiro em itens
    // dropados") — antes contava d.party.service (legado), sempre 0 pros dados reais.
    // Um drop com 2 serviceiros conta 2 (é "vezes que aparece", não "drops com serviceiro").
    const serviceiroDropsCount = drops.reduce((s, d) => s + d.party.services.length, 0);
    // "(ind)" = individual — soma o Valor CADA (unitValue, já dividido pelos jogadores da
    // vaga), não o Valor Total do drop inteiro. Bug real reportado pelo usuário em
    // 2026-08-20 ("kks plunder não é a soma total do valor é o valor cada") — o código
    // somava d.totalValue por engano, mesmo com o rótulo já dizendo "(ind)".
    const plunderDrops = drops.filter((d) => d.bossName === 'Plunder');
    const plunderTotal = plunderDrops.reduce((s, d) => s + d.unitValue, 0);
    const bagsDrops = drops.filter((d) => d.bossName !== 'Plunder' && d.bossName !== 'SoulCore');
    const bagsTotal = bagsDrops.reduce((s, d) => s + d.unitValue, 0);
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
  }, [last365Drops]);

  // Drops do jogador aberto na modal (2026-08-25, pedido do usuário: clicar no nome do Top
  // Drop abre um resumo) — MESMO filtro do ranking acima (sem Plunder), pra bater com o
  // total mostrado no card.
  const activePlayerDropsList = useMemo(() => {
    if (!activePlayerDrops) return [];
    return last365Drops.filter((d) => d.looter === activePlayerDrops && d.bossName !== 'Plunder');
  }, [last365Drops, activePlayerDrops]);

  // Gráfico de tendência mensal (2026-08-21, pedido do usuário: "ao clicar nos campos
  // centrais da dashboard, abrir uma modal com gráfico dos últimos 12 meses") — reusa
  // last365Drops (já buscado pro Top Drop) e splitDailySeries (já buscado pro KKs
  // Hunt/Boss), sem fetch novo. Só os KPIs financeiros/contagem entram nesse escopo —
  // confirmado com o usuário: a tabela de membros (Lvl/Skill/XP) não tem snapshot diário
  // guardado, ficaria de fora até existir uma tabela própria pra isso.
  const trendMonths = useMemo(() => buildLast12Months(), []);
  const monthlyTrends = useMemo(
    () => computeMonthlyTrends(trendMonths, last365Drops, splitDailySeries),
    [trendMonths, last365Drops, splitDailySeries],
  );

  if (accountLoading) return <div className="loading">Carregando...</div>;

  // padding-top reduzido de 20px pra 4px (2026-08-25, pedido do usuário: "vamos tirar um
  // pouco desse pading que tem em cima... se nao couber na tela pode seguir") — objetivo é
  // caber o menu + conteúdo inteiro sem scroll quando possível; se não couber (ex: tela
  // menor, party com mais membros), a página simplesmente rola normal, sem problema. Só o
  // topo mudou — laterais/embaixo continuam 20px, sem impacto visual no resto da página.
  return (
    <div className="dashboard-container" style={{ padding: '4px 20px 20px', maxWidth: '1700px', margin: '0 auto', color: 'var(--color-text)' }}>

      {/* LAYOUT EM GRID: 3 COLUNAS — alinhamento inferior com base na COLUNA 2 (2026-08-25,
          pedido do usuário: "vamos fazer um alinhamento inferior com base na tabela
          central"). Ver o `useEffect`/ResizeObserver de `col2Height` acima pro porquê de
          medir via JS em vez de CSS puro (Grid ignora o scroll interno das colunas laterais
          pro cálculo de altura da linha). Colunas 1/3 recebem `height: col2Height` (px,
          medido de verdade) quando disponível — antes do 1º measure, ficam em `auto`
          (só um flash inicial até o ResizeObserver disparar). */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.1fr 1.1fr', gap: '20px' }}>

        {/* COLUNA 1: TABELA "DROPS NO MÊS" + SELETOR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0, height: isDesktopLayout && col2Height ? `${col2Height}px` : undefined, overflow: isDesktopLayout ? 'hidden' : undefined }}>

          {/* "Mês/Ano" juntado dentro do card "Drops no mês" (2026-08-25, pedido do
              usuário: "vamos juntar a tabela mes/ano junto do drop no mes para ficar uma
              coluna mais compactada") — antes eram 2 caixas separadas (com padding/borda
              própria cada uma) empilhadas com gap entre elas; agora é 1 card só, com o
              seletor de Mês/Ano na mesma linha do título. */}
          <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-accent)' }}>Drops no mês</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}
                >
                  {MESES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w60"
                  style={{ background: 'var(--color-bg-input)', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '12px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px', marginBottom: '6px' }}>
              <span className="texto-mudo" style={{ fontSize: '12px' }}>Vendido / Valor</span>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {loading && <div className="texto-mudo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>Carregando...</div>}
              {error && <div className="texto-perigo" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>{error}</div>}
              {!loading && !error && drops.length === 0 && (
                <div className="texto-fraco" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>Nenhum drop encontrado.</div>
              )}
              {!loading && !error && drops.length > 0 && (
                <table className="tabela-simples">
                  <tbody>
                    {sortedDrops.map((drop, idx) => {
                      const isSold = drop.sold;
                      const rowBg = isSold ? 'var(--color-success-soft)' : 'var(--color-danger-soft)';
                      return (
                        <tr key={drop.id || idx} style={{ borderBottom: '1px solid var(--color-border)', background: rowBg }}>
                          <td className="texto-mudo" style={{ padding: '6px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getItemIconUrl(drop.itemName) && (
                              <img src={getItemIconUrl(drop.itemName)} alt="" className="h18 w18" style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                            )}
                            <span>{drop.itemName || 'Item Raro'}</span>
                          </td>
                          <td className={`w60 ${isSold ? 'texto-sucesso' : 'texto-perigo'}`} style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                            {isSold ? 'Sim' : 'Não'}
                          </td>
                          <td className={`texto-mono w110 ${isSold ? 'texto-sucesso' : 'texto-fraco'}`} style={{ padding: '6px 4px', textAlign: 'right' }}>
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
        <div ref={col2Ref} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* GRADE DE 10 INDICADORES */}
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('qtdDrops')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Qtd Drops</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.totalDrops}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('qtdNVendido')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Qtd N Vendido</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-warning)' }}>{stats.pendingCount}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('qtdServiceiro')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Qtd Serviceiro</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-accent)' }}>{stats.serviceiroDropsCount}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('kksPlunderInd')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">KKs Plunder(ind)</span>
              <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(stats.plunderTotal)}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('kksHunt')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">KKs Hunt</span>
              <strong style={{ fontSize: '11px', color: 'var(--color-text)' }}>{formatTibiaGold(bossHuntTotals.hunt)}</strong>
            </div>

            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('qtdBags')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Qtd Bags</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.bagsCount}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('qtdPlunders')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Qtd Plunders</span>
              <strong style={{ fontSize: '14px', color: 'var(--color-text)' }}>{stats.plunderCount}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('totalInd')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">Total (ind)</span>
              <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(totalInd)}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('kksBagsInd')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">KKs Bags(ind)</span>
              <strong className="texto-sucesso" style={{ fontSize: '11px' }}>{formatTibiaGold(stats.bagsTotal)}</strong>
            </div>
            <div className="stat-box stat-box-clicavel" onClick={() => setActiveTrendMetric('kksBoss')} title="Ver últimos 12 meses">
              <span className="stat-box-rotulo">KKs Boss</span>
              <strong style={{ fontSize: '11px', color: 'var(--color-accent)' }}>{formatTibiaGold(bossHuntTotals.boss)}</strong>
            </div>
          </div>

          {/* VALOR TOTAL CONSOLIDADO */}
          <div style={{ background: 'var(--color-bg-elevated)', padding: '12px 20px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className="label-padrao">Valor Total em Drops (Sistema)</span>
              <span className="texto-sucesso" style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatTibiaGold(stats.totalValue)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="label-padrao">Vendidos / Pendentes</span>
              <span style={{ fontSize: '14px', color: 'var(--color-accent)' }}>{stats.soldCount} / {stats.pendingCount}</span>
            </div>
          </div>

          {/* PLANILHA CENTRAL DE MEMBROS, SKILLS E METAS DE XP */}
          <div className="card-compacto" style={{ overflowX: 'auto', padding: 0 }}>
            <table className="tabela-simples texto-mono" style={{ textAlign: 'center' }}>
              <thead>
                {/* Linha de Nomes dos Membros */}
                <tr className="linha-cabecalho-tabela">
                  <th className="borda-padrao w110" style={{ padding: '10px' }}></th>
                  {members.map((m) => (
                    <th key={m.id} className="borda-padrao" style={{ padding: '10px', fontWeight: 'bold', fontSize: '13px' }}>
                      {m.characterName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Lvl Atual — ao vivo via TibiaData (character) */}
                <tr className="linha-tabela-dado">
                  <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Lvl Atual</td>
                  {members.map((m) => {
                    const live = liveStats[m.characterName];
                    return (
                      <td key={m.id} className="borda-padrao" style={{ padding: '8px', fontWeight: 'bold' }}>
                        {live?.loading ? '…' : live?.level ?? '—'}
                      </td>
                    );
                  })}
                </tr>
                {/* Skill — ao vivo via TibiaData (highscores, top 500 do mundo) */}
                <tr className="linha-tabela-dado-alt">
                  <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Skill</td>
                  {members.map((m) => {
                    const live = liveStats[m.characterName];
                    return (
                      <td key={m.id} className="borda-padrao" style={{ padding: '8px' }}>
                        {live?.loading ? '…' : live?.skillLabel ?? '—'}
                      </td>
                    );
                  })}
                </tr>
                {/* Xp Ontem */}
                <tr className="linha-tabela-dado">
                  <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp Ontem</td>
                  {members.map((m) => {
                    const extra = statsByName[m.characterName] ?? EMPTY_XP_STATS;
                    return (
                      <td key={m.id} className={`borda-padrao ${extra.xpOntem.startsWith('-') ? 'texto-perigo' : 'texto-sucesso'}`} style={{ padding: '8px', fontWeight: 'bold' }}>
                        {extra.xpOntem}
                      </td>
                    );
                  })}
                </tr>
                {/* Xp 30Dias */}
                <tr className="linha-tabela-dado-alt">
                  <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp 30Dias</td>
                  {members.map((m) => (
                    <td key={m.id} className="borda-padrao texto-sucesso" style={{ padding: '8px', fontWeight: 'bold' }}>
                      {(statsByName[m.characterName] ?? EMPTY_XP_STATS).xp30Dias}
                    </td>
                  ))}
                </tr>
                {/* Previsão fim de ano */}
                <tr className="linha-tabela-aviso" style={{ fontWeight: 'bold' }}>
                  <td className="borda-padrao" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px' }}>Previsão fim de ano</td>
                  {members.map((m) => (
                    <td key={m.id} className="borda-padrao" style={{ padding: '8px' }}>
                      {previsaoPorMembro[m.characterName] ?? '—'}
                    </td>
                  ))}
                </tr>

                {/* Cabeçalho Seção Metas */}
                <tr>
                  <td colSpan={members.length + 1} className="borda-padrao" style={{ background: 'var(--color-border-strong)', color: 'var(--color-text)', padding: '6px', fontWeight: 'bold', fontSize: '11px', textAlign: 'center' }}>
                    Meta XP Diaria para atingir ao final do ano o Lvl Indicado
                  </td>
                </tr>

                {/* Linhas de Metas por Nível */}
                {niveisMetas.map((lvl) => (
                  <tr key={lvl} style={{ background: 'var(--color-bg-elevated)' }}>
                    <td className="borda-padrao texto-mudo" style={{ padding: '5px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold', fontSize: '11px' }}>
                      Lvl {lvl}
                    </td>
                    {members.map((m) => {
                      const val = metaXpDiariaPorMembro[m.characterName]?.[lvl] ?? '';
                      const style = getMetaCellStyle(val);
                      return (
                        <td key={m.id} className="borda-padrao" style={{ padding: '5px', backgroundColor: style.background, color: style.color, fontSize: '11px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0, height: isDesktopLayout && col2Height ? `${col2Height}px` : undefined, overflow: isDesktopLayout ? 'hidden' : undefined }}>

          <div className="card-compacto" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: 'var(--color-warning)' }}>TODOS os Itens não vendidos</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {unsoldGrouped.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUnsoldShareModal(true)}
                    title="Compartilhar itens à venda"
                    className="botao-icone"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" fill="currentColor" stroke="none" />
                      <circle cx="6" cy="12" r="3" fill="currentColor" stroke="none" />
                      <circle cx="18" cy="19" r="3" fill="currentColor" stroke="none" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                )}
                <span style={{ fontSize: '12px', background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                  Qtd: {allUnsoldDrops.length}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {unsoldLoading && <div className="texto-mudo" style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>Carregando...</div>}
              {unsoldError && <div className="texto-perigo" style={{ padding: '15px', textAlign: 'center', fontSize: '13px' }}>{unsoldError}</div>}
              {!unsoldLoading && !unsoldError && unsoldGrouped.length === 0 && (
                <p className="estado-vazio">Nenhum item pendente no momento.</p>
              )}
              {!unsoldLoading && !unsoldError && unsoldGrouped.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {unsoldGrouped.map((item) => {
                    const iconUrl = getItemIconUrl(item.itemName);
                    return (
                      <div key={item.itemName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                        {iconUrl
                          ? <img src={iconUrl} alt="" className="h20 w20" style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                          : <span className="w20" style={{ flexShrink: 0 }} />}
                        <span className="texto-mudo" style={{ fontSize: '13px', flex: 1 }}>{item.itemName || 'Item Raro'}</span>
                        <span style={{ color: 'var(--color-warning)', fontSize: '13px', fontWeight: 'bold' }}>x{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card-compacto">
            <h3 style={{ fontSize: '14px', margin: '0 0 10px 0', color: 'var(--color-accent)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Top Drop</h3>
            <span className="texto-fraco" style={{ fontSize: '11px', display: 'block', marginBottom: '8px', marginTop: '-6px' }}>Últimos 365 dias</span>
            {topDropLoading && <div className="texto-mudo" style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Carregando...</div>}
            {!topDropLoading && topDropRanking.length === 0 && (
              <div className="texto-fraco" style={{ fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Nenhum drop com fragador nos últimos 365 dias.
              </div>
            )}
            {!topDropLoading && topDropRanking.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topDropRanking.map((entry, idx) => (
                  <div key={entry.looter} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px', borderBottom: '1px solid var(--color-bg-elevated)' }}>
                    <span className="h22 w22" style={{
                      borderRadius: 'var(--radius-pill)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 'bold',
                      background: idx === 0 ? 'var(--color-warning)' : idx === 1 ? 'var(--color-text-muted)' : idx === 2 ? '#b45309' : 'var(--color-border)',
                      color: idx <= 2 ? 'var(--color-bg)' : 'var(--color-text-muted)',
                    }}>
                      {idx + 1}
                    </span>
                    <span
                      className="texto-mudo"
                      onClick={() => setActivePlayerDrops(entry.looter)}
                      title="Ver todos os drops deste jogador"
                      style={{ flex: 1, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline dotted' }}
                    >
                      {entry.looter}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <span className="texto-sucesso" style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>
                        {formatTibiaGold(entry.totalValue)}
                      </span>
                      <span className="texto-fraco" style={{ display: 'block', fontSize: '11px' }}>
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

      {showUnsoldShareModal && (
        <UnsoldItemsShareModal items={unsoldGrouped} onClose={() => setShowUnsoldShareModal(false)} />
      )}
      {activeTrendMetric && (
        <MonthlyTrendModal
          title={METRIC_META[activeTrendMetric].label}
          isCurrency={METRIC_META[activeTrendMetric].isCurrency}
          months={trendMonths}
          values={monthlyTrends[activeTrendMetric]}
          onClose={() => setActiveTrendMetric(null)}
        />
      )}
      {activePlayerDrops && (
        <PlayerDropsModal
          looter={activePlayerDrops}
          drops={activePlayerDropsList}
          onClose={() => setActivePlayerDrops(null)}
        />
      )}
    </div>
  );
}
