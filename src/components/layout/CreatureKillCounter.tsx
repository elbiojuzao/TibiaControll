import plunderPatriarchIcon from '@/assets/creature-icons/plunder-patriarch.webp';
import { useAccount } from '@/hooks/useAccount';
import { useCreatureKillStats } from '@/hooks/useCreatureKillStats';

/** Nome real da criatura é "Plunder Patriarches" (plural — corrigido pelo usuário em
 * 2026-09-16; não é só o plural que a API de kill statistics usa, é o nome oficial). */
const CREATURE_NAME = 'Plunder Patriarches';

/** Widget da topbar (2026-09-16, pedido do usuário) — ícone da criatura + contador com a
 * quantidade morta NO DIA (ontem, conforme a API) sobreposto no canto; passar o mouse
 * mostra as duas informações (dia + semana) no tooltip nativo, mesmo padrão de
 * BoostedToday.tsx. Fica escondido (retorna null) enquanto accounts.world não estiver
 * configurado em Configurações, ou se a criatura não aparecer na lista desse mundo. */
export function CreatureKillCounter() {
  const { account } = useAccount();
  const { stats, loading, error } = useCreatureKillStats(account?.world, CREATURE_NAME);

  if (!account?.world || loading || error || !stats) return null;

  return (
    <div
      className="creature-kill-chip"
      title={`${CREATURE_NAME} — mortos ontem: ${stats.lastDayKilled} · mortos na semana: ${stats.lastWeekKilled}`}
    >
      <img src={plunderPatriarchIcon} alt={CREATURE_NAME} className="h40 w40" />
      <span className="creature-kill-badge">{stats.lastDayKilled}</span>
    </div>
  );
}
