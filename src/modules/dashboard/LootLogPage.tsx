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

export function LootLogPage() {
  const { accountId, loading: accountLoading } = useAccount();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [bossFilter, setBossFilter] = useState('');
  const [looterFilter, setLooterFilter] = useState('');
  const [soldFilter, setSoldFilter] = useState<SoldFilter>('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingDrop, setEditingDrop] = useState<LootDrop | null>(null);

  const hasAdvancedFilters = !!bossFilter || !!looterFilter || soldFilter !== 'all';

  const filters: LootDropFilters = useMemo(() => {
    const { from, to } = monthRangeAsBr(Number(selectedMonth), Number(selectedYear));
    const f: LootDropFilters = { dateFrom: from, dateTo: to };
    if (bossFilter) f.bossName = bossFilter;
    if (looterFilter) f.looter = looterFilter;
    if (soldFilter === 'sold') f.sold = true;
    if (soldFilter === 'unsold') f.sold = false;
    return f;
  }, [selectedMonth, selectedYear, bossFilter, looterFilter, soldFilter]);

  const { drops, loading, error, createDrop, updateDrop } = useLootDrops(accountId, filters);
  const { members } = useMembers(accountId);
  const { serviceiros } = useServiceiros(accountId);

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

        <button
          className="calendar-nav-btn"
          onClick={() => setShowAdvancedFilters((v) => !v)}
          style={hasAdvancedFilters ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : undefined}
        >
          🔍 Filtrar{hasAdvancedFilters ? ' •' : ''}
        </button>

        {showAdvancedFilters && (
          <>
            <input
              className="filter-input"
              type="text"
              placeholder="Filtrar por boss..."
              value={bossFilter}
              onChange={(e) => setBossFilter(e.target.value)}
            />
            <input
              className="filter-input"
              type="text"
              placeholder="Filtrar por fragador..."
              value={looterFilter}
              onChange={(e) => setLooterFilter(e.target.value)}
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
                onClick={() => { setBossFilter(''); setLooterFilter(''); setSoldFilter('all'); }}
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
