import type { Member, MemberXpStats } from '@/types';
import type { MemberLiveStats } from '@/hooks/useMemberLiveStats';
import { animDelay, animDelayMs } from '@/services/common/anim-delay';
import { CountUpText } from '@/components/common/CountUpText';

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

interface MembersXpTableProps {
  members: Member[];
  liveStats: Record<string, MemberLiveStats>;
  statsByName: Record<string, MemberXpStats>;
  previsaoPorMembro: Record<string, string>;
  niveisMetas: number[];
  metaXpDiariaPorMembro: Record<string, Record<number, string>>;
}

/** Planilha central de Membros/Skills/Meta XP do Dashboard — extraída em 2026-08-27 pra
 * reduzir o tamanho de DashboardPage.tsx (ver memória "componentes-grandes"). Só
 * apresentação: todo dado (live stats, previsão, metas) já vem calculado por props. */
export function MembersXpTable({ members, liveStats, statsByName, previsaoPorMembro, niveisMetas, metaXpDiariaPorMembro }: MembersXpTableProps) {
  return (
    <div className="card-compacto anim-entrada" style={{ overflowX: 'auto', padding: 0, ...animDelay(2, 60) }}>
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
          <tr className="linha-tabela-dado anim-entrada" style={animDelay(4, 50)}>
            <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Lvl Atual</td>
            {members.map((m) => {
              const live = liveStats[m.characterName];
              return (
                <td key={m.id} className="borda-padrao" style={{ padding: '8px', fontWeight: 'bold' }}>
                  {live?.loading ? <span className="skeleton skeleton-inline" /> : live?.level != null ? <CountUpText text={String(live.level)} delayMs={animDelayMs(4, 50)} /> : '—'}
                </td>
              );
            })}
          </tr>
          {/* Skill — ao vivo via TibiaData (highscores, top 500 do mundo) */}
          <tr className="linha-tabela-dado-alt anim-entrada" style={animDelay(5, 50)}>
            <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Skill</td>
            {members.map((m) => {
              const live = liveStats[m.characterName];
              return (
                <td key={m.id} className="borda-padrao" style={{ padding: '8px' }}>
                  {live?.loading ? <span className="skeleton skeleton-inline" /> : live?.skillLabel ? <CountUpText text={live.skillLabel} delayMs={animDelayMs(5, 50)} /> : '—'}
                </td>
              );
            })}
          </tr>
          {/* Xp Ontem */}
          <tr className="linha-tabela-dado anim-entrada" style={animDelay(6, 50)}>
            <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp Ontem</td>
            {members.map((m) => {
              const extra = statsByName[m.characterName] ?? EMPTY_XP_STATS;
              return (
                <td key={m.id} className={`borda-padrao ${extra.xpOntem.startsWith('-') ? 'texto-perigo' : 'texto-sucesso'}`} style={{ padding: '8px', fontWeight: 'bold' }}>
                  <CountUpText text={extra.xpOntem} delayMs={animDelayMs(6, 50)} />
                </td>
              );
            })}
          </tr>
          {/* Xp 30Dias */}
          <tr className="linha-tabela-dado-alt anim-entrada" style={animDelay(7, 50)}>
            <td className="borda-padrao texto-mudo" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold' }}>Xp 30Dias</td>
            {members.map((m) => (
              <td key={m.id} className="borda-padrao texto-sucesso" style={{ padding: '8px', fontWeight: 'bold' }}>
                <CountUpText text={(statsByName[m.characterName] ?? EMPTY_XP_STATS).xp30Dias} delayMs={animDelayMs(7, 50)} />
              </td>
            ))}
          </tr>
          {/* Previsão fim de ano */}
          <tr className="linha-tabela-aviso anim-entrada" style={{ fontWeight: 'bold', ...animDelay(8, 50) }}>
            <td className="borda-padrao" style={{ padding: '8px', textAlign: 'left', paddingLeft: '10px' }}>Previsão fim de ano</td>
            {members.map((m) => (
              <td key={m.id} className="borda-padrao" style={{ padding: '8px' }}>
                <CountUpText text={previsaoPorMembro[m.characterName] ?? '—'} delayMs={animDelayMs(8, 50)} />
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
          {niveisMetas.map((lvl, lvlIdx) => (
            <tr key={lvl} className="anim-entrada" style={{ background: 'var(--color-bg-elevated)', ...animDelay(9 + lvlIdx, 25, 450) }}>
              <td className="borda-padrao texto-mudo" style={{ padding: '5px', textAlign: 'left', paddingLeft: '10px', fontWeight: 'bold', fontSize: '11px' }}>
                Lvl {lvl}
              </td>
              {members.map((m) => {
                const val = metaXpDiariaPorMembro[m.characterName]?.[lvl] ?? '';
                const style = getMetaCellStyle(val);
                return (
                  <td key={m.id} className="borda-padrao" style={{ padding: '5px', backgroundColor: style.background, color: style.color, fontSize: '11px' }}>
                    <CountUpText text={val} delayMs={animDelayMs(9 + lvlIdx, 25, 450)} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
