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
import { buildLast12Months, computeMonthlyTrends, type DashboardMetricKey } from '@/services/dashboard/monthly-trend';
import { UnsoldItemsShareModal } from './components/UnsoldItemsShareModal';
import { MonthlyTrendModal, type StackedSeries } from './components/MonthlyTrendModal';
import { PlayerDropsModal } from './components/PlayerDropsModal';
import { ItemSummaryModal } from './components/ItemSummaryModal';
import { MonthDropsCard } from './components/MonthDropsCard';
import { KpiGrid } from './components/KpiGrid';
import { MembersXpTable } from './components/MembersXpTable';
import { UnsoldItemsCard } from './components/UnsoldItemsCard';
import { TopDropCard } from './components/TopDropCard';
import type { LootDropFilters } from '@/types';

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
  const [activeItemName, setActiveItemName] = useState<string | null>(null);

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
    const byItem = new Map<string, { count: number; totalValue: number; bosses: Set<string> }>();
    for (const d of allUnsoldDrops) {
      const existing = byItem.get(d.itemName) ?? { count: 0, totalValue: 0, bosses: new Set<string>() };
      existing.count += 1;
      existing.totalValue += d.totalValue;
      existing.bosses.add(d.bossName);
      byItem.set(d.itemName, existing);
    }
    return Array.from(byItem.entries())
      .map(([itemName, { count, totalValue, bosses }]) => ({ itemName, count, totalValue, bosses: Array.from(bosses) }))
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

  // Drops do item aberto na modal de resumo (2026-08-26, pedido do usuário: clicar num
  // item na tabela "Drops no mês" abre um resumo dele) — reusa last365Drops (mesmo dataset
  // já buscado pro Top Drop, sem fetch novo). Diferente do ranking por jogador, aqui NÃO
  // exclui Plunder: a exclusão ali era regra de "dono do drop", não se aplica a uma visão
  // por item.
  const activeItemDropsList = useMemo(() => {
    if (!activeItemName) return [];
    return last365Drops.filter((d) => d.itemName === activeItemName);
  }, [last365Drops, activeItemName]);

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

  // "Total (ind)" = soma de 4 fontes (ver stats/bossHuntTotals/totalInd acima) — pedido do
  // usuário (2026-08-27): em vez de barra sólida no gráfico de tendência, empilhar essas 4
  // fontes com cor própria cada. Cores reaproveitadas das já usadas no Calendário pra
  // Hunt/Boss (.calendar-dot.hunt/.boss em global.css), pra manter a mesma associação de
  // cor em telas diferentes.
  const totalIndStackedSeries: StackedSeries[] = useMemo(() => [
    { key: 'hunt', label: 'Hunt', color: 'var(--color-warning)', values: monthlyTrends.kksHunt },
    { key: 'boss', label: 'Boss', color: 'var(--color-accent)', values: monthlyTrends.kksBoss },
    { key: 'bags', label: 'Itens (exceto Plunder)', color: 'var(--color-success)', values: monthlyTrends.kksBagsInd },
    { key: 'plunder', label: 'Itens (Plunder)', color: 'var(--color-danger)', values: monthlyTrends.kksPlunderInd },
  ], [monthlyTrends]);

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
          <MonthDropsCard
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            drops={sortedDrops}
            loading={loading}
            error={error}
            onItemClick={setActiveItemName}
          />
        </div>

        {/* COLUNA 2: BLOCOS DE INDICADORES (KPIs) + PLANILHA CENTRAL DE MEMBROS E METAS DE XP */}
        <div ref={col2Ref} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {/* GRADE DE 10 INDICADORES */}
          <KpiGrid stats={stats} bossHuntTotals={bossHuntTotals} totalInd={totalInd} onMetricClick={setActiveTrendMetric} />

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
          <MembersXpTable
            members={members}
            liveStats={liveStats}
            statsByName={statsByName}
            previsaoPorMembro={previsaoPorMembro}
            niveisMetas={niveisMetas}
            metaXpDiariaPorMembro={metaXpDiariaPorMembro}
          />

        </div>

        {/* COLUNA 3: ITENS NÃO VENDIDOS & TOP DROPS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', minHeight: 0, height: isDesktopLayout && col2Height ? `${col2Height}px` : undefined, overflow: isDesktopLayout ? 'hidden' : undefined }}>

          <UnsoldItemsCard
            items={unsoldGrouped}
            totalCount={allUnsoldDrops.length}
            loading={unsoldLoading}
            error={unsoldError}
            onShareClick={() => setShowUnsoldShareModal(true)}
          />

          <TopDropCard ranking={topDropRanking} loading={topDropLoading} onPlayerClick={setActivePlayerDrops} />

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
          stackedSeries={activeTrendMetric === 'totalInd' ? totalIndStackedSeries : undefined}
        />
      )}
      {activePlayerDrops && (
        <PlayerDropsModal
          looter={activePlayerDrops}
          drops={activePlayerDropsList}
          onClose={() => setActivePlayerDrops(null)}
        />
      )}
      {activeItemName && (
        <ItemSummaryModal
          itemName={activeItemName}
          drops={activeItemDropsList}
          onClose={() => setActiveItemName(null)}
        />
      )}
    </div>
  );
}
