import plunderPatriarchIcon from '@/assets/creature-icons/plunder-patriarch.webp';
import phosphorusIcon from '@/assets/creature-icons/phosphorus.gif';
import megalomaniaIcon from '@/assets/creature-icons/goshnars-megalomania.gif';
import bakragoreIcon from '@/assets/creature-icons/bakragore.gif';
import { useAccount } from '@/hooks/useAccount';
import { useCreatureKillStats } from '@/hooks/useCreatureKillStats';
import { useKillStatsPreference } from '@/hooks/useKillStatsPreference';
import { effectiveCreatureNames } from '@/services/display/kill-stats-preference';
import { useCreatureCatalog } from '@/hooks/useCreatureCatalog';
import { getBossBadgeStyle } from '@/modules/dashboard/utils/loot-visuals';
import type { CreatureCatalogEntry } from '@/services/tibiadata/tibiadata-client';

/** Ícones baixados/embutidos localmente pras 4 criaturas que já eram monitoradas antes da
 * personalização existir (2026-09-16/27) — não estão (ou não estavam) no catálogo oficial
 * do TibiaData com um `image_url` utilizável (ver businessLogic.creatureKillStats). Chave
 * em minúsculo pra casar com o nome digitado pelo usuário sem depender de acento/caixa. */
const LOCAL_ICONS: Record<string, string> = {
  'plunder patriarches': plunderPatriarchIcon,
  'phosphorus': phosphorusIcon,
  'bakragore': bakragoreIcon,
  "goshnar's megalomania": megalomaniaIcon,
};

/** Ícone oficial (CDN static.tibia.com, via GET /creatures) pra qualquer criatura escolhida
 * pelo usuário em Configurações — null se não tiver local nem estiver no catálogo (criatura
 * "boss" fora da lista padrão do TibiaData, ex: Plunder Patriarches antes de ganhar ícone
 * local). */
/** ["nome", "nomes", "nomees"] — as poucas formas de plural em inglês que o catálogo do
 * TibiaData realmente usa (a maioria +s, algumas +es tipo "Bakragores" seria hipotético). */
function pluralVariants(singular: string): string[] {
  return [singular, `${singular}s`, `${singular}es`];
}

function resolveIcon(name: string, catalog: CreatureCatalogEntry[]): string | null {
  const key = name.trim().toLowerCase();
  if (LOCAL_ICONS[key]) return LOCAL_ICONS[key];
  // Comparação exata primeiro; senão só aceita uma relação de plural EXATA (+s/+es) nos dois
  // sentidos — ex: usuário digita "Dragon Lord", catálogo só tem "Dragon Lords". Uma
  // comparação por prefixo solta (startsWith) pegaria "Dragon Lord Hatchlings" por engano
  // (também começa com "Dragon Lord") — por isso a checagem é por SUFIXO de pluralização,
  // não por prefixo qualquer.
  const found = catalog.find((c) => {
    const catalogName = c.name.toLowerCase();
    return pluralVariants(key).includes(catalogName) || pluralVariants(catalogName).includes(key);
  });
  return found?.imageUrl ?? null;
}

interface CreatureChipProps {
  name: string;
  icon: string | null;
}

/** 1 criatura: ícone (ou iniciais coloridas, se não tiver ícone resolvido) + contador com a
 * quantidade morta NO DIA (ontem, conforme a API) sobreposto no canto; passar o mouse
 * mostra as duas informações (dia + semana) no tooltip nativo, mesmo padrão de
 * BoostedToday.tsx. Retorna null em loading/erro/sem dado — nunca mostra número errado. */
function CreatureChip({ name, icon }: CreatureChipProps) {
  const { account } = useAccount();
  const { stats, loading, error } = useCreatureKillStats(account?.world, name);

  if (loading || error || !stats) return null;

  const title = `${name} — mortos ontem: ${stats.lastDayKilled} · mortos na semana: ${stats.lastWeekKilled}`;

  return (
    <div className="creature-kill-chip" title={title}>
      {icon ? (
        <img src={icon} alt={name} className="h40 w40" />
      ) : (
        <span className="creature-kill-fallback h40 w40" style={getBossBadgeStyle(name)}>
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="creature-kill-badge">{stats.lastDayKilled}</span>
    </div>
  );
}

/** Widget da topbar (2026-09-16, pedido do usuário) — 1 chip por criatura EFETIVAMENTE
 * ligada em Configurações → "Configurações de Exibição" (ver kill-stats-preference.ts):
 * as 4 criaturas originais (checkbox por criatura, todas ligadas por padrão) + até 2
 * personalizadas de texto livre (2026-09-27, pedido do usuário: "os 4 boss... eles sempre
 * podem aparecer para todos e mais 2 criaturas a escolha do usuário"). Widget inteiro some
 * sem `accounts.world` configurado, com o toggle geral desligado, ou se nada estiver
 * marcado/preenchido; cada chip individual some se a criatura não aparecer na lista de kill
 * statistics desse mundo. */
export function CreatureKillCounter() {
  const { account } = useAccount();
  const preference = useKillStatsPreference();
  const catalog = useCreatureCatalog();
  const names = effectiveCreatureNames(preference);

  if (!account?.world || !preference.enabled || names.length === 0) return null;

  return (
    <div className="creature-kill-group">
      {names.map((name) => (
        <CreatureChip key={name} name={name} icon={resolveIcon(name, catalog)} />
      ))}
    </div>
  );
}
