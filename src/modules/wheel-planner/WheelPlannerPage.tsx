import { useMemo, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { useWheelBuilds } from '@/hooks/useWheelBuilds';
import { WheelDiagram } from './components/WheelDiagram';
import { SliceDetailPanel } from './components/SliceDetailPanel';
import { GemAtelierPanel } from './components/GemAtelierPanel';
import { SaveWheelBuildModal } from './components/SaveWheelBuildModal';
import { VOCATION_ICON, VOCATION_LABEL } from '@/services/wheel/wheel-perks-data';
import { wheelTotalPoints, wheelMaxPoints, type AllocationMap } from '@/services/wheel/wheel-logic';
import type { WheelBuild, WheelGem, WheelGemVessel, WheelSliceAllocation, WheelVocation } from '@/types';

const VOCATIONS: WheelVocation[] = ['knight', 'paladin', 'druid', 'sorcerer'];

function emptyVessels(): WheelGemVessel[] {
  return [0, 1, 2, 3].map((domain) => ({ domain: domain as 0 | 1 | 2 | 3, enabledCount: 0 }));
}

/** Roda de Destino (Wheel of Destiny) — pedido do usuário em 2026-09-02: "eu queria fazer
 * um modulo de roda de habilidades... parecido com tibiapal.com/wheel-planner... precisamos
 * montar a roda igual idêntica pois é como é no jogo". Rota LIVRE (não exige login pra usar a
 * calculadora em si, mesmo padrão de Split Loot/Tier/Charm Planner) — só "Salvar Build" exige
 * sessão ativa, igual aos botões de salvar do Split Loot Calculator. Geometria + conteúdo de
 * cada fatia (por vocação) extraídos direto do tibiapal.com — ver services/wheel/*. */
export function WheelPlannerPage() {
  const { accountId } = useAccount();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { builds, loading: buildsLoading, error: buildsError, saveBuild, deleteBuild } = useWheelBuilds(accountId);

  const [vocation, setVocation] = useState<WheelVocation>('knight');
  const [tab, setTab] = useState<'wheel' | 'gems'>('wheel');
  const [allocations, setAllocations] = useState<AllocationMap>({});
  const [vessels, setVessels] = useState<WheelGemVessel[]>(emptyVessels());
  const [gems, setGems] = useState<WheelGem[]>([]);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalPoints = useMemo(() => wheelTotalPoints(allocations), [allocations]);
  const maxPoints = wheelMaxPoints();

  const handleChangeVocation = (v: WheelVocation) => {
    if (v === vocation) return;
    if (totalPoints > 0 && !window.confirm('Trocar de vocação limpa a roda atual (não salva automaticamente). Continuar?')) return;
    setVocation(v);
    setAllocations({});
    setVessels(emptyVessels());
    setGems([]);
    setSelectedSliceId(null);
  };

  const handleReset = () => {
    if (totalPoints === 0 && gems.length === 0) return;
    if (!window.confirm('Limpar toda a roda e o ateliê de gemas atuais? Essa ação não pode ser desfeita por aqui.')) return;
    setAllocations({});
    setVessels(emptyVessels());
    setGems([]);
    setSelectedSliceId(null);
  };

  const handleChangeAllocation = (sliceId: string, allocation: WheelSliceAllocation) => {
    setAllocations((prev) => ({ ...prev, [sliceId]: allocation }));
  };

  const handleSave = async (name: string, characterName: string) => {
    setSaveError(null);
    try {
      await saveBuild({
        vocation,
        name,
        characterName: characterName || undefined,
        totalPoints,
        allocations: Object.values(allocations).filter((a) => a.points > 0),
        vessels: vessels.filter((v) => v.enabledCount > 0),
        gems,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar build.');
      throw err;
    }
  };

  const handleLoadBuild = (build: WheelBuild) => {
    if (totalPoints > 0 && !window.confirm(`Carregar "${build.name}"? Isso substitui a roda atual (não salva automaticamente).`)) return;
    setVocation(build.vocation);
    const map: AllocationMap = {};
    for (const a of build.allocations) map[a.sliceId] = a;
    setAllocations(map);
    setVessels(build.vessels.length > 0 ? build.vessels : emptyVessels());
    setGems(build.gems);
    setSelectedSliceId(null);
  };

  const handleDeleteBuild = async (build: WheelBuild) => {
    if (!window.confirm(`Excluir o build "${build.name}"? Essa ação não pode ser desfeita.`)) return;
    setDeleteError(null);
    try {
      await deleteBuild(build.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir build.');
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text)' }}>
      <header className="page-header" style={{ marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--color-accent)' }}>🎡 Roda de Destino</h2>
        <p className="subtitulo-pagina">
          Planeje a Wheel of Destiny e o Ateliê de Gemas — roda e conteúdo de cada fatia idênticos ao jogo, por vocação.
        </p>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {VOCATIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleChangeVocation(v)}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
              border: vocation === v ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: vocation === v ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
              color: vocation === v ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {VOCATION_ICON[v]} {VOCATION_LABEL[v]}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['wheel', 'gems'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
              border: tab === t ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: tab === t ? 'var(--color-accent-soft)' : 'var(--color-bg-input)',
              color: tab === t ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {t === 'wheel' ? '🎡 Roda' : '💎 Ateliê de Gemas'}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="texto-mudo" style={{ fontSize: '12px' }}>{totalPoints}/{maxPoints} pontos</span>
          <button type="button" onClick={handleReset} className="botao-secundario" style={{ fontSize: '12px' }}>Limpar</button>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={!isAuthenticated || authLoading}
            title={isAuthenticated ? 'Salvar build' : 'Faça login pra salvar builds'}
            className="botao-primario"
            style={{ fontSize: '12px' }}
          >
            💾 Salvar Build
          </button>
        </div>
      </div>

      {!isAuthenticated && !authLoading && (
        <p className="texto-fraco" style={{ fontSize: '12px', marginBottom: '16px' }}>🔒 Faça login pra salvar e carregar builds.</p>
      )}

      {tab === 'wheel' ? (
        <div className="wheel-layout-grid" style={{ gap: '20px', alignItems: 'start' }}>
          <WheelDiagram vocation={vocation} allocations={allocations} selectedSliceId={selectedSliceId} onSelectSlice={setSelectedSliceId} />
          <div>
            {selectedSliceId ? (
              <SliceDetailPanel vocation={vocation} sliceId={selectedSliceId} allocations={allocations} onChange={handleChangeAllocation} />
            ) : (
              <p className="estado-vazio">Clique numa fatia da roda (ou num medalhão de Revelation, nos cantos) pra ver os detalhes e investir pontos.</p>
            )}
          </div>
        </div>
      ) : (
        <GemAtelierPanel vessels={vessels} gems={gems} onChangeVessels={setVessels} onChangeGems={setGems} />
      )}

      {showSaveModal && (
        <SaveWheelBuildModal onClose={() => setShowSaveModal(false)} onSubmit={handleSave} />
      )}

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--color-accent)', marginBottom: '10px' }}>Builds Salvos</h3>
        {saveError && <div className="banner-erro" style={{ marginBottom: '10px' }}>{saveError}</div>}
        {deleteError && <div className="banner-erro" style={{ marginBottom: '10px' }}>{deleteError}</div>}
        {!isAuthenticated ? (
          <p className="estado-vazio">Faça login pra ver seus builds salvos.</p>
        ) : buildsLoading ? (
          <div className="loading">Carregando...</div>
        ) : buildsError ? (
          <div className="texto-perigo" style={{ padding: '10px', fontSize: '13px' }}>{buildsError}</div>
        ) : builds.length === 0 ? (
          <p className="estado-vazio">Nenhum build salvo ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {builds.map((b) => (
              <div key={b.id} className="card-compacto" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>{VOCATION_ICON[b.vocation]} {b.name}</strong>
                  <div className="texto-fraco" style={{ fontSize: '11px' }}>
                    {VOCATION_LABEL[b.vocation]}{b.characterName ? ` · ${b.characterName}` : ''} · {b.totalPoints} pontos
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => handleLoadBuild(b)} className="botao-secundario" style={{ fontSize: '12px' }}>Carregar</button>
                  <button type="button" onClick={() => handleDeleteBuild(b)} title="Excluir build" className="botao-icone-perigo">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
