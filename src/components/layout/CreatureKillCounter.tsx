import plunderPatriarchIcon from '@/assets/creature-icons/plunder-patriarch.webp';
import phosphorusIcon from '@/assets/creature-icons/phosphorus.gif';
import megalomaniaIcon from '@/assets/creature-icons/goshnars-megalomania.gif';
import bakragoreIcon from '@/assets/creature-icons/bakragore.gif';
import { useAccount } from '@/hooks/useAccount';
import { useCreatureKillStats } from '@/hooks/useCreatureKillStats';

interface MonitoredCreature {
  /** Nome EXATO usado na `race` do killstatistics do TibiaData (ver fetchCreatureKillStats) */
  name: string;
  icon: string;
}

/** Criaturas monitoradas na topbar (2026-09-16: só Plunder Patriarches; 2026-09-27, pedido
 * do usuário: + Phosphorus/Bakragore/Goshnar's Megalomania — os 3 bosses "raros" que faltavam
 * do mesmo grupo). Adicionar uma nova é só entrar aqui + baixar o ícone (ver memória
 * "integracao-tibiadata" pro passo a passo de download/gotchas de CDN). */
const MONITORED_CREATURES: MonitoredCreature[] = [
  { name: 'Plunder Patriarches', icon: plunderPatriarchIcon },
  { name: 'Phosphorus', icon: phosphorusIcon },
  { name: 'Bakragore', icon: bakragoreIcon },
  { name: "Goshnar's Megalomania", icon: megalomaniaIcon },
];

interface CreatureChipProps {
  creature: MonitoredCreature;
  world: string;
}

/** 1 criatura: ícone + contador com a quantidade morta NO DIA (ontem, conforme a API)
 * sobreposto no canto; passar o mouse mostra as duas informações (dia + semana) no tooltip
 * nativo, mesmo padrão de BoostedToday.tsx. Retorna null em loading/erro/sem dado — nunca
 * mostra número errado (extraído do antigo CreatureKillCounter em 2026-09-27 pra virar 1
 * chip de N, ver MONITORED_CREATURES). */
function CreatureChip({ creature, world }: CreatureChipProps) {
  const { stats, loading, error } = useCreatureKillStats(world, creature.name);

  if (loading || error || !stats) return null;

  return (
    <div
      className="creature-kill-chip"
      title={`${creature.name} — mortos ontem: ${stats.lastDayKilled} · mortos na semana: ${stats.lastWeekKilled}`}
    >
      <img src={creature.icon} alt={creature.name} className="h40 w40" />
      <span className="creature-kill-badge">{stats.lastDayKilled}</span>
    </div>
  );
}

/** Widget da topbar (2026-09-16, pedido do usuário) — um chip por criatura monitorada (ver
 * MONITORED_CREATURES). Widget inteiro some enquanto accounts.world não estiver configurado
 * em Configurações; cada chip individual some se a criatura não aparecer na lista desse
 * mundo (ex: mundo sem kills recentes dela). */
export function CreatureKillCounter() {
  const { account } = useAccount();
  if (!account?.world) return null;

  return (
    <div className="creature-kill-group">
      {MONITORED_CREATURES.map((creature) => (
        <CreatureChip key={creature.name} creature={creature} world={account.world!} />
      ))}
    </div>
  );
}
