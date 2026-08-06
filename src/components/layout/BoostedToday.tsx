import { useBoostedToday } from '@/hooks/useBoostedToday';

export function BoostedToday() {
  const { creature, boss, loading, error } = useBoostedToday();

  return (
    <div className="boosted-today">
      <span className="boosted-today-title">Bostados hoje</span>

      {loading && <span className="boosted-today-status">Carregando...</span>}
      {error && <span className="boosted-today-status">Indisponível</span>}

      {!loading && !error && (
        <>
          <div className="boosted-today-item">
            <img src={creature?.imageUrl} alt="" width={24} height={24} />
            <div>
              <span className="boosted-today-label">Criatura</span>
              <span className="boosted-today-name">{creature?.name}</span>
            </div>
          </div>
          <div className="boosted-today-item">
            <img src={boss?.imageUrl} alt="" width={24} height={24} />
            <div>
              <span className="boosted-today-label">Boss</span>
              <span className="boosted-today-name">{boss?.name}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
