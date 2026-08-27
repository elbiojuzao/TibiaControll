import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { useBossQuests } from '@/hooks/useBossQuests';
import { useQuestFilter } from '@/hooks/useQuestFilter';
import { useBossItems } from '@/hooks/useBossItems';
import { isoToBr, brToIso, todayAsBr } from '@/services/common/br-date';
import { formatTibiaGold } from '@/services/split';
import {
  vocationOptions, fifthPlayerOptions, servedPlayerOptions, deriveVocation,
  computeTransferInstructions, computeShareBreakdown, buildSaleMessage,
  type ServiceDraft,
} from '@/services/lootdrop/drop-form-calculations';
import type { CreateLootDropDto, LootDrop, Member, Serviceiro, Vocation } from '@/types';

const VAZIO = '';

interface DropFormModalProps {
  mode: 'create' | 'edit';
  /** Obrigatório quando mode === 'edit' */
  drop?: LootDrop;
  members: Member[];
  serviceiros: Serviceiro[];
  onClose: () => void;
  onSubmit: (dto: CreateLootDropDto) => Promise<unknown>;
}

export function DropFormModal({ mode, drop, members, serviceiros, onClose, onSubmit }: DropFormModalProps) {
  const byVocation = (v: Vocation) => members.find((m) => m.vocation === v)?.characterName ?? '';
  const wasSold = mode === 'edit' ? drop!.sold : false;

  const [date, setDate] = useState(mode === 'edit' ? drop!.date : todayAsBr());
  const [ek, setEk] = useState(mode === 'edit' ? drop!.party.ek ?? '' : byVocation('EK'));
  const [ed, setEd] = useState(mode === 'edit' ? drop!.party.ed ?? '' : byVocation('ED'));
  const [rp, setRp] = useState(mode === 'edit' ? drop!.party.rp ?? '' : byVocation('RP'));
  const [ms, setMs] = useState(mode === 'edit' ? drop!.party.ms ?? '' : byVocation('MS'));
  const [fifthPlayer, setFifthPlayer] = useState(mode === 'edit' ? drop!.party.fifthPlayer ?? '' : '');
  const [serviceDrafts, setServiceDrafts] = useState<ServiceDraft[]>(
    mode === 'edit'
      ? drop!.party.services.map((s) => ({
          serviceiroId: s.serviceiroId,
          vocation: s.vocation ?? '',
          servedCharacterName: s.servedCharacterName ?? '',
        }))
      : [],
  );
  const [totalValue, setTotalValue] = useState(mode === 'edit' ? String(drop!.totalValue) : '');
  const [bossName, setBossName] = useState(mode === 'edit' ? drop!.bossName : VAZIO);
  const [itemName, setItemName] = useState(mode === 'edit' ? drop!.itemName : VAZIO);
  const [looter, setLooter] = useState(mode === 'edit' ? drop!.looter : VAZIO);
  const [sold, setSold] = useState(wasSold);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Uma vez copiado, o botão fica marcado como pago permanentemente (não reverte
  // sozinho) — pedido do usuário em 2026-08-16, pra saber visualmente quais
  // transferências já foram feitas no jogo. Clicar de novo no botão marcado copia de
  // novo (útil se precisar colar outra vez), só não desmarca.
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set());
  const [waMessage, setWaMessage] = useState('');
  const [waCopied, setWaCopied] = useState(false);
  // Filtro de quest fica escondido por padrão (2026-08-18, pedido do usuário: layout
  // "esquisito" — a parede de 10 checkboxes sempre visível quebrava o fluxo do form).
  const [showQuestFilter, setShowQuestFilter] = useState(false);

  // Confirmação ao sair sem salvar (2026-08-26, pedido do usuário) — compara os campos do
  // form contra o snapshot capturado na 1ª renderização (que é justamente o valor inicial,
  // já que o effect roda uma única vez). Campos só de UI (saving/formError/waMessage/
  // doneIndices/etc.) ficam de fora de propósito — não é dado que se perde de verdade.
  const [initialSnapshot] = useState(() => JSON.stringify({ date, ek, ed, rp, ms, fifthPlayer, serviceDrafts, totalValue, bossName, itemName, looter, sold }));
  const isDirty = JSON.stringify({ date, ek, ed, rp, ms, fifthPlayer, serviceDrafts, totalValue, bossName, itemName, looter, sold }) !== initialSnapshot;

  const { bosses: allBosses, bossToQuest, quests, error: bossQuestsError } = useBossQuests();
  const { isQuestChecked, toggleQuest } = useQuestFilter();
  const { itemsByBoss, error: bossItemsError } = useBossItems();

  // Só mostra bosses cuja quest está marcada no filtro (checkboxes, persistido em
  // localStorage — pedido do usuário em 2026-08-14). Sempre inclui o boss atualmente
  // salvo como opção, mesmo que a quest dele esteja desmarcada ou ele não esteja na
  // tabela (drops históricos podem citar boss fora da lista conhecida) — sem isso o
  // select fica em branco e o valor original é perdido ao salvar.
  const bossOptions = useMemo(() => {
    const filtered = allBosses.filter((b) => isQuestChecked(bossToQuest[b] ?? b));
    return bossName && !filtered.includes(bossName) ? [bossName, ...filtered] : filtered;
  }, [allBosses, bossToQuest, isQuestChecked, bossName]);

  const itemOptions = useMemo(() => {
    const base = bossName ? itemsByBoss[bossName] ?? [] : [];
    return itemName && !base.includes(itemName) ? [itemName, ...base] : base;
  }, [bossName, itemName, itemsByBoss]);

  const addServiceRow = () => setServiceDrafts((prev) => [...prev, { serviceiroId: '', vocation: '', servedCharacterName: '' }]);
  const removeServiceRow = (index: number) => setServiceDrafts((prev) => prev.filter((_, i) => i !== index));
  const updateServiceRow = (index: number, patch: Partial<ServiceDraft>) => {
    setServiceDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  // Vocação é opcional aqui: drops históricos importados têm serviceiro sem vocação
  // registrada (a planilha antiga não guardava essa info) — manter o vínculo mesmo
  // assim em vez de descartá-lo silenciosamente ao salvar.
  const resolvedServices = useMemo(
    () => serviceDrafts
      .filter((row) => !!row.serviceiroId)
      .map((row) => ({
        serviceiroId: row.serviceiroId,
        serviceiroName: serviceiros.find((s) => s.id === row.serviceiroId)?.name ?? '',
        vocation: row.vocation || undefined,
        servedCharacterName: row.servedCharacterName || undefined,
      })),
    [serviceDrafts, serviceiros],
  );

  const looterOptions = useMemo(() => {
    const options = [ek, ed, rp, ms, fifthPlayer, ...resolvedServices.map((s) => s.serviceiroName)]
      .filter((n): n is string => !!n);
    return Array.from(new Set(options));
  }, [ek, ed, rp, ms, fifthPlayer, resolvedServices]);

  // Valor Cada não é digitado — é a cota base (Valor Total / nº de jogadores da party
  // nesse drop). Serviceiros não aumentam esse divisor: eles recebem 50% da cota de
  // quem estavam servindo, em vez de uma cota própria (regra de negócio do usuário).
  const playerCount = [ek, ed, rp, ms, fifthPlayer].filter(Boolean).length;
  const totalNumber = Number(totalValue) || 0;
  // Gold do Tibia é sempre inteiro (ver schema em supabase/migrations) — arredonda a cota.
  const unitValue = playerCount > 0 ? Math.round(totalNumber / playerCount) : 0;

  // Quem efetivamente vende o item (visita NPC/Market) — configurado em Configurações
  // (Member.isDefaultSeller), NÃO o Fragador. Bug real reportado pelo usuário em
  // 2026-08-16: o card de transferência usava o Fragador como "quem paga", mas quem
  // vende é sempre o mesmo membro fixo da party, independente de quem looted.
  const defaultSeller = members.find((m) => m.isDefaultSeller)?.characterName ?? '';

  // Comandos de transferência só fazem sentido quando o item já foi vendido e tem
  // Valor Cada pra distribuir — recalcula ao vivo conforme o form muda, mesmo antes
  // de salvar.
  const { instructions: transferInstructions, missingCharacterShares } = useMemo(
    () => (sold
      ? computeTransferInstructions({ ek, ed, ms, rp, fifthPlayer }, serviceDrafts, serviceiros, unitValue, defaultSeller)
      : { instructions: [], missingCharacterShares: [] }),
    [sold, ek, ed, ms, rp, fifthPlayer, serviceDrafts, serviceiros, unitValue, defaultSeller],
  );

  // Quebra de cota por pessoa (inclui quem paga, diferente de transferInstructions) só
  // pra montar a mensagem de aviso de venda — ver buildSaleMessage.
  const { playerShares, serviceiroShares } = useMemo(
    () => (sold
      ? computeShareBreakdown({ ek, ed, ms, rp, fifthPlayer }, serviceDrafts, serviceiros, unitValue)
      : { playerShares: [], serviceiroShares: [] }),
    [sold, ek, ed, ms, rp, fifthPlayer, serviceDrafts, serviceiros, unitValue],
  );

  const defaultSaleMessage = useMemo(
    () => buildSaleMessage(itemName, bossName, totalNumber, playerShares, serviceiroShares),
    [itemName, bossName, totalNumber, playerShares, serviceiroShares],
  );

  // Mensagem editável — sincroniza com o texto gerado automaticamente sempre que os
  // dados do drop mudam; depois disso o usuário pode ajustar livremente antes de copiar.
  // Reseta o "copiado" junto, já que uma mensagem nova precisa ser copiada de novo.
  useEffect(() => {
    setWaMessage(defaultSaleMessage);
    setWaCopied(false);
  }, [defaultSaleMessage]);

  const handleCopyCommand = (commandText: string, index: number) => {
    navigator.clipboard.writeText(commandText);
    setDoneIndices((prev) => new Set(prev).add(index));
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waMessage);
    setWaCopied(true);
  };

  const handleBossChange = (value: string) => {
    setBossName(value);
    setItemName(VAZIO);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const total = Number(totalValue);

    if (!bossName) return setFormError('Selecione o boss.');
    if (!itemName) return setFormError('Selecione o item.');
    if (!looter) return setFormError('Selecione o fragador.');
    // Valor só é obrigatório quando o item está marcado como vendido — no create ou no
    // edit, tanto faz. Um drop recém-registrado normalmente ainda não foi vendido (não
    // tem "Vendido" nem pra marcar no modo create), então fica com Valor Total 0/em
    // branco até vender de verdade — reportado pelo usuário em 2026-08-15: exigir valor
    // ao registrar um item ainda não vendido não faz sentido, ele não tem esse dado
    // ainda. Mesma regra que já valia pra editar um drop existente não-vendido.
    const requireValue = sold;
    if (requireValue) {
      if (!totalValue || Number.isNaN(total) || total <= 0) return setFormError('Informe o Valor Total.');
      if (playerCount === 0) return setFormError('Preencha ao menos um jogador (EK/ED/MS/RP/5º) pra calcular o Valor Cada.');
    } else if (Number.isNaN(total) || total < 0) {
      return setFormError('Valor Total inválido.');
    }

    const payload: CreateLootDropDto = {
      date,
      party: {
        ek: ek || undefined,
        ed: ed || undefined,
        rp: rp || undefined,
        ms: ms || undefined,
        fifthPlayer: fifthPlayer || undefined,
        services: resolvedServices,
      },
      unitValue,
      totalValue: total,
      looter,
      itemName,
      bossName,
      sold: mode === 'edit' ? sold : false,
    };

    if (mode === 'edit') {
      // Data da venda só muda quando o item passa a "vendido" agora; editar
      // outros campos (ou continuar vendido) nunca reescreve a data original.
      if (sold && !wasSold) payload.saleDate = todayAsBr();
      else if (sold && wasSold) payload.saleDate = drop!.saleDate ?? todayAsBr();
      else payload.saleDate = '';
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar drop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Registro de Drop' : 'Editar Drop'} onClose={onClose} maxWidth={720} isDirty={isDirty}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="form-section-title">Composição da party</div>

        <div className="grid-3col">
          <label className="label-padrao">
            Data:
            <input type="date" value={brToIso(date)} onChange={(e) => setDate(isoToBr(e.target.value))} className="campo-input" />
          </label>
          <label className="label-padrao">
            EK:
            <select value={ek} onChange={(e) => setEk(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {vocationOptions(members, 'EK', ek).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="label-padrao">
            ED:
            <select value={ed} onChange={(e) => setEd(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {vocationOptions(members, 'ED', ed).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="label-padrao">
            RP:
            <select value={rp} onChange={(e) => setRp(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {vocationOptions(members, 'RP', rp).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="label-padrao">
            MS:
            <select value={ms} onChange={(e) => setMs(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {vocationOptions(members, 'MS', ms).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="label-padrao">
            5º Player:
            <select value={fifthPlayer} onChange={(e) => setFifthPlayer(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {fifthPlayerOptions(serviceiros, fifthPlayer).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="form-section-title" style={{ margin: 0, padding: 0, border: 'none' }}>Serviceiros nesse item</span>
            <button type="button" onClick={addServiceRow} className="botao-secundario" style={{ padding: '4px 10px', fontSize: '12px' }}>
              + Adicionar Serviceiro
            </button>
          </div>

          {serviceDrafts.length === 0 ? (
            <p className="estado-vazio" style={{ margin: '4px 0' }}>Nenhum serviceiro nesse item.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {serviceDrafts.map((row, index) => {
                const serviceiro = serviceiros.find((s) => s.id === row.serviceiroId);
                const playerOptions = servedPlayerOptions({ ek, ed, ms, rp, fifthPlayer }, row.servedCharacterName);
                return (
                  <div key={index} className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={row.serviceiroId}
                      onChange={(e) => updateServiceRow(index, { serviceiroId: e.target.value, vocation: '' })}
                      className="campo-input"
                    >
                      <option value={VAZIO}>-- Vazio --</option>
                      {serviceiros.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select
                      value={row.servedCharacterName}
                      onChange={(e) => {
                        const servedCharacterName = e.target.value;
                        updateServiceRow(index, { servedCharacterName, vocation: deriveVocation({ ek, ed, ms, rp }, servedCharacterName) });
                      }}
                      disabled={!serviceiro}
                      className="campo-input"
                      title="Em quem esse serviceiro fez o service"
                    >
                      <option value={VAZIO}>{serviceiro ? '-- Jogador servido --' : 'Escolha o serviceiro'}</option>
                      {playerOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => removeServiceRow(index)} title="Remover serviceiro do item" className="botao-icone-perigo">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="form-section-title">Boss & item</div>

        {bossQuestsError && (
          <span className="texto-perigo" style={{ fontSize: '12px' }}>
            Não foi possível carregar a lista de bosses ({bossQuestsError}).
          </span>
        )}
        {bossItemsError && (
          <span className="texto-perigo" style={{ fontSize: '12px' }}>
            Não foi possível carregar a lista de itens ({bossItemsError}).
          </span>
        )}

        <div className="grid-2col">
          <label className="label-padrao">
            Boss:
            <select value={bossName} onChange={(e) => handleBossChange(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {bossOptions.map((boss) => (
                <option key={boss} value={boss}>{boss}</option>
              ))}
            </select>
          </label>
          <label className="label-padrao">
            Item:
            <select value={itemName} onChange={(e) => setItemName(e.target.value)} disabled={!bossName} className="campo-input">
              <option value={VAZIO}>{bossName ? '-- Vazio --' : 'Escolha o boss primeiro'}</option>
              {itemOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        {quests.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowQuestFilter((v) => !v)}
              className="botao-secundario"
              style={{ padding: '5px 10px', fontSize: '11px' }}
            >
              🔍 Filtrar bosses por quest {showQuestFilter ? '▲' : '▼'}
            </button>
            {showQuestFilter && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                {quests.map((quest) => (
                  <label key={quest} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={isQuestChecked(quest)} onChange={() => toggleQuest(quest)} />
                    {quest}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-section-title">Venda</div>

        <div className="grid-3col">
          <label className="label-padrao">
            Valor Total:
            <input type="number" min={0} value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0" className="campo-input" />
          </label>
          <label className="label-padrao">
            Valor Cada (calculado):
            <div className="campo-input" style={{ color: 'var(--color-text-muted)', cursor: 'default' }} title="Valor Total dividido pelo número de jogadores (EK/ED/MS/RP/5º) preenchidos">
              {formatTibiaGold(unitValue)} {playerCount > 0 ? `(÷ ${playerCount})` : ''}
            </div>
          </label>
          <label className="label-padrao">
            Fragador:
            <select value={looter} onChange={(e) => setLooter(e.target.value)} className="campo-input">
              <option value={VAZIO}>-- Vazio --</option>
              {looterOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>

        {mode === 'edit' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={sold} onChange={(e) => setSold(e.target.checked)} />
              Vendido
            </label>
            <span className="texto-fraco" style={{ fontSize: '12px' }}>
              {sold
                ? wasSold && drop!.saleDate
                  ? `Vendido em ${drop!.saleDate}`
                  : 'A data de hoje será registrada ao salvar'
                : 'Marque quando o item for vendido'}
            </span>
          </div>
        )}

        {mode === 'edit' && sold && !defaultSeller && unitValue > 0 && (
          <span style={{ color: 'var(--color-warning)', fontSize: '12px' }}>
            Nenhum "Vendedor Padrão" configurado em Configurações — não dá pra gerar os comandos de transferência sem saber quem paga.
          </span>
        )}

        {mode === 'edit' && sold && (transferInstructions.length > 0 || missingCharacterShares.length > 0) && (
          <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '14px' }}>
            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Copiar Comandos de Transferência:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transferInstructions.map((t, idx) => (
                <div
                  key={`cmd-${idx}`}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div className="texto-mudo" style={{ fontSize: '11px' }}>
                      <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{t.from}</span> paga para{' '}
                      <span className="texto-sucesso" style={{ fontWeight: 'bold' }}>{t.to}</span>
                    </div>
                    <div className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>
                      {t.tibiaCommand}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCommand(t.tibiaCommand, idx)}
                    title={doneIndices.has(idx) ? 'Já copiado — clique pra copiar de novo' : 'Copiar comando'}
                    style={{
                      background: doneIndices.has(idx) ? 'var(--color-success)' : 'var(--color-border)',
                      color: doneIndices.has(idx) ? 'var(--color-bg)' : 'var(--color-text)',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      minWidth: '65px',
                    }}
                  >
                    {doneIndices.has(idx) ? '✓ Pago' : 'Copiar'}
                  </button>
                </div>
              ))}
              {missingCharacterShares.map((m, idx) => (
                <div
                  key={`missing-${idx}`}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-warning)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div>
                    <div className="texto-mudo" style={{ fontSize: '11px' }}>
                      <span className="texto-perigo" style={{ fontWeight: 'bold' }}>{defaultSeller}</span> deve pagar{' '}
                      <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>{m.serviceiroName}</span>
                    </div>
                    <div className="texto-mono" style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>
                      {formatTibiaGold(m.amount)}
                    </div>
                  </div>
                  <span
                    title="Sem 'Boneco' cadastrado em Serviceiros — não dá pra gerar o comando transfer. Combine o pagamento por fora."
                    style={{
                      color: 'var(--color-warning)',
                      border: '1px solid var(--color-warning)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚠ Sem Boneco
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'edit' && sold && (playerShares.length > 0 || serviceiroShares.length > 0) && (
          <div className="card-compacto">
            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0', color: 'var(--color-text)' }}>Avisar a venda no WhatsApp:</h4>
            <textarea
              rows={8}
              value={waMessage}
              onChange={(e) => {
                setWaMessage(e.target.value);
                setWaCopied(false);
              }}
              className="campo-input texto-mono"
              style={{ marginTop: 0, fontSize: '12px', resize: 'vertical' }}
            />
            <button
              type="button"
              onClick={handleCopyMessage}
              className="botao-primario"
              style={{ marginTop: '8px', background: waCopied ? 'var(--color-success)' : undefined }}
            >
              {waCopied ? '✓ Copiado' : '📋 Copiar Mensagem'}
            </button>
          </div>
        )}

        {formError && <span className="texto-perigo" style={{ fontSize: '12px' }}>{formError}</span>}

        <button
          type="submit"
          disabled={saving}
          className="botao-primario"
          style={{ padding: '12px', borderRadius: 'var(--radius)', fontSize: '14px' }}
        >
          {saving
            ? (mode === 'create' ? 'Registrando...' : 'Salvando...')
            : (mode === 'create' ? 'Registrar Drop' : 'Salvar Alterações')}
        </button>
      </form>
    </Modal>
  );
}
