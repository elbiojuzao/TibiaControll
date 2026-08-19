import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useLootDrops } from '@/hooks/useLootDrops';
import { useMembers } from '@/hooks/useMembers';
import { useServiceiros } from '@/hooks/useServiceiros';
import { formatTibiaGold } from '@/services/split';
import { MESES, monthRangeAsBr } from '@/services/common/months';
import type { LootDrop, LootDropFilters } from '@/types';
import { LootTable } from './components/LootTable';
import { DropFormModal } from './components/DropFormModal';

type SoldFilter = 'all' | 'sold' | 'unsold';

const now = new Date();

/** Junta todo texto pesquisável de um drop numa string só, pra busca livre por
 * "qualquer campo" (2026-08-19, pedido do usuário). */
function buildSearchableText(drop: LootDrop): string {
  const parts = [
    drop.itemName,
    drop.bossName,
    drop.looter,
    drop.party.ek,
    drop.party.ed,
    drop.party.ms,
    drop.party.rp,
    drop.party.fifthPlayer,
    drop.party.service,
    ...drop.party.services.map((s) => s.serviceiroName),
    ...drop.party.services.map((s) => s.servedCharacterName),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function matchesServiceiroFilter(drop: LootDrop, query: string): boolean {
  const q = query.toLowerCase();
  if (drop.party.services.some((s) => s.serviceiroName.toLowerCase().includes(q))) return true;
  return (drop.party.service ?? '').toLowerCase().includes(q);
}

export function LootLogPage() {
  const { accountId, loading: accountLoading } = useAccount();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  // Busca rápida (2026-08-19, pedido do usuário) — fora do "Filtro avançado", busca em
  // QUALQUER campo (item, boss, fragador, EK/ED/MS/RP/5º, serviceiro) já ao digitar, sem
  // precisar clicar em nada. Roda no client (drops do mês já vieram do banco/mock), então
  // não tem round-trip de rede a cada tecla.
  const [quickSearch, setQuickSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bossFilter, setBossFilter] = useState('');
  const [looterFilter, setLooterFilter] = useState('');
  const [serviceiroFilter, setServiceiroFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const [soldFilter, setSoldFilter] = useState<SoldFilter>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState<LootDrop | null>(null);

  const hasAdvancedFilters = !!bossFilter || !!looterFilter || !!serviceiroFilter || !!itemFilter || soldFilter !== 'all';

  // Só o mês/ano vai pro banco — boss/fragador/serviceiro/item/vendido e a busca rápida
  // filtram no client sobre o lote do mês já carregado (mesmo motivo: precisa poder casar
  // com QUALQUER campo, e um filtro assim não dá pra expressar como poucos parâmetros de
  // query fixos sem reescrever o repository/Supabase pra isso).
  const monthFilters: LootDropFilters = useMemo(() => {
    const { from, to } = monthRangeAsBr(Number(selectedMonth), Number(selectedYear));
    return { dateFrom: from, dateTo: to };
  }, [selectedMonth, selectedYear]);

  const { drops: monthDrops, loading, error, createDrop, updateDrop } = useLootDrops(accountId, monthFilters);
  const { members } = useMembers(accountId);
  const { serviceiros } = useServiceiros(accountId);

  const drops = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    return monthDrops.filter((d) => {
      if (bossFilter && !d.bossName.toLowerCase().includes(bossFilter.toLowerCase())) return false;
      if (looterFilter && !d.looter.toLowerCase().includes(looterFilter.toLowerCase())) return false;
      if (itemFilter && !d.itemName.toLowerCase().includes(itemFilter.toLowerCase())) return false;
      if (serviceiroFilter && !matchesServiceiroFilter(d, serviceiroFilter)) return false;
      if (soldFilter === 'sold' && !d.sold) return false;
      if (soldFilter === 'unsold' && d.sold) return false;
      if (q && !buildSearchableText(d).includes(q)) return false;
      return true;
    });
  }, [monthDrops, quickSearch, bossFilter, looterFilter, itemFilter, serviceiroFilter, soldFilter]);

  const stats = useMemo(() => {
    const totalValue = drops.reduce((sum, d) => sum + d.totalValue, 0);
    const soldCount = drops.filter((d) => d.sold).length;
    const pendingCount = drops.filter((d) => !d.sold).length;
    return { totalValue, soldCount, pendingCount, totalDrops: drops.length };
  }, [drops]);

  if (accountLoading) return <div className="loading">Carregando...</div>;

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1700px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-success)' }}>Log de Drops</h2>
          <p className="subtitulo-pagina">
            Registro de itens raros dropados pela party — espelha a planilha original (data, composição da party,
            valores, fragador, item, boss e status de venda).
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="botao-primario"
          style={{ color: 'var(--color-text)', fontSize: '13px' }}
        >
          + Registrar Drop
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <label>Qtd. Drops</label>
          <div className="value">{stats.totalDrops}</div>
        </div>
        <div className="stat-card">
          <label>Vendidos</label>
          <div className="value texto-sucesso">{stats.soldCount}</div>
        </div>
        <div className="stat-card">
          <label>Pendentes</label>
          <div className="value" style={{ color: 'var(--color-warning)' }}>{stats.pendingCount}</div>
        </div>
        <div className="stat-card">
          <label>Valor Total</label>
          <div className="value texto-sucesso">{formatTibiaGold(stats.totalValue)}</div>
        </div>
      </div>

      <div className="filters-bar" style={{ alignItems: 'center' }}>
        <select
          className="filter-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <input
          className="filter-input w90"
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        />

        <input
          className="filter-input"
          type="text"
          placeholder="🔍 Buscar em qualquer campo (item, boss, fragador, jogador...)"
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px' }}
        />

        <button
          className="calendar-nav-btn"
          onClick={() => setShowAdvancedFilters((v) => !v)}
          style={hasAdvancedFilters ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : undefined}
        >
          ⚙️ Filtro avançado{hasAdvancedFilters ? ' •' : ''}
        </button>

        {showAdvancedFilters && (
          <>
            <input
              className="filter-input"
              type="text"
              placeholder="Fragador..."
              value={looterFilter}
              onChange={(e) => setLooterFilter(e.target.value)}
            />
            <input
              className="filter-input"
              type="text"
              placeholder="Serviceiro..."
              value={serviceiroFilter}
              onChange={(e) => setServiceiroFilter(e.target.value)}
            />
            <input
              className="filter-input"
              type="text"
              placeholder="Item..."
              value={itemFilter}
              onChange={(e) => setItemFilter(e.target.value)}
            />
            <input
              className="filter-input"
              type="text"
              placeholder="Boss..."
              value={bossFilter}
              onChange={(e) => setBossFilter(e.target.value)}
            />
            <select
              className="filter-select"
              value={soldFilter}
              onChange={(e) => setSoldFilter(e.target.value as SoldFilter)}
            >
              <option value="all">Todos</option>
              <option value="sold">Vendidos</option>
              <option value="unsold">Pendentes</option>
            </select>
            {hasAdvancedFilters && (
              <button
                className="calendar-nav-btn"
                onClick={() => { setBossFilter(''); setLooterFilter(''); setServiceiroFilter(''); setItemFilter(''); setSoldFilter('all'); }}
              >
                Limpar
              </button>
            )}
          </>
        )}
      </div>

      {loading && <div className="loading">Carregando drops...</div>}
      {error && <div className="empty-state">{error}</div>}
      {!loading && !error && <LootTable drops={drops} onRowClick={setEditingDrop} />}

      {showRegisterModal && (
        <DropFormModal
          mode="create"
          members={members}
          serviceiros={serviceiros}
          onClose={() => setShowRegisterModal(false)}
          onSubmit={createDrop}
        />
      )}

      {editingDrop && (
        <DropFormModal
          key={editingDrop.id}
          mode="edit"
          drop={editingDrop}
          members={members}
          serviceiros={serviceiros}
          onClose={() => setEditingDrop(null)}
          onSubmit={(dto) => updateDrop(editingDrop.id, dto)}
        />
      )}
    </div>
  );
}
