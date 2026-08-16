import { useBoostedToday } from '@/hooks/useBoostedToday';

/** Widget da topbar (2026-08-16) — mostra criatura E boss bostados direto (ícones
 * lado a lado, sem hover/clique pra revelar QUE eles existem), mas o NOME de cada
 * um só aparece no tooltip ao passar o mouse. Voltou de empilhado pra lado a lado
 * pra caber um ícone maior (pedido do usuário: "ficar um ao lado do outro que ai
 * ele pode ficar maior"). */
export function BoostedToday() {
  const { creature, boss, loading, error } = useBoostedToday();

  if (loading) return <span className="boosted-today-status">Carregando bostados...</span>;
  if (error) return <span className="boosted-today-status">Bostados indisponíveis</span>;

  return (
    <div className="boosted-today-inline">
      <div className="boosted-today-chip" title={`Criatura bostada hoje: ${creature?.name ?? ''}`}>
        <img src={creature?.imageUrl} alt={creature?.name ?? 'Criatura bostada'} className="h40 w40" />
      </div>
      <div className="boosted-today-chip" title={`Boss bostado hoje: ${boss?.name ?? ''}`}>
        <img src={boss?.imageUrl} alt={boss?.name ?? 'Boss bostado'} className="h40 w40" />
      </div>
    </div>
  );
}
