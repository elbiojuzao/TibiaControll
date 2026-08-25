import { getSupabaseClient } from '@/services/supabase/supabase-client';
import { brToIso, isoToBr } from '@/services/common/br-date';
import type { CreateLootDropDto, DropService, LootDrop, LootDropFilters, Vocation } from '@/types';
import type { ILootDropRepository } from '../interfaces';

/**
 * Linhas cruas das tabelas `drops`/`drop_services` (ver
 * supabase/migrations/20260806000000_initial_drops_schema.sql). Sem
 * `supabase gen types typescript` rodado ainda (precisa do CLI + projeto
 * linkado) — tipamos a mão por enquanto, trocar por tipos gerados depois.
 */
interface DropServiceRow {
  vocacao: string | null;
  served_character_name: string | null;
  serviceiro: { id: string; name: string } | null;
}

interface DropRow {
  id: string;
  account_id: string;
  data_drop: string; // YYYY-MM-DD
  ek: string | null;
  ed: string | null;
  ms: string | null;
  rp: string | null;
  quinto_player: string | null;
  fragador: string;
  item: string;
  boss: string;
  valor_cada: number;
  valor_total: number;
  vendido: boolean;
  data_venda: string | null;
  drop_services: DropServiceRow[];
}

/** drop_services vem com o serviceiro embutido via FK implícita (serviceiro_id -> serviceiros) */
const SELECT_WITH_SERVICES = '*, drop_services(vocacao, served_character_name, serviceiro:serviceiros(id, name))';

function toDomain(row: DropRow): LootDrop {
  const services: DropService[] = (row.drop_services ?? [])
    .filter((s): s is DropServiceRow & { serviceiro: { id: string; name: string } } => s.serviceiro !== null)
    .map((s) => ({
      serviceiroId: s.serviceiro.id,
      serviceiroName: s.serviceiro.name,
      vocation: s.vocacao ? (s.vocacao as Vocation) : undefined,
      servedCharacterName: s.served_character_name ?? undefined,
    }));

  return {
    id: row.id,
    accountId: row.account_id,
    date: isoToBr(row.data_drop),
    party: {
      ek: row.ek ?? undefined,
      ed: row.ed ?? undefined,
      ms: row.ms ?? undefined,
      rp: row.rp ?? undefined,
      fifthPlayer: row.quinto_player ?? undefined,
      services,
    },
    unitValue: row.valor_cada,
    totalValue: row.valor_total,
    looter: row.fragador,
    itemName: row.item,
    bossName: row.boss,
    sold: row.vendido,
    saleDate: row.data_venda ? isoToBr(row.data_venda) : undefined,
  };
}

async function replaceDropServices(dropId: string, services: DropService[]): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: deleteError } = await supabase.from('drop_services').delete().eq('drop_id', dropId);
  if (deleteError) throw new Error(deleteError.message);

  if (services.length === 0) return;

  const { error: insertError } = await supabase.from('drop_services').insert(
    services.map((s) => ({
      drop_id: dropId,
      serviceiro_id: s.serviceiroId,
      vocacao: s.vocation,
      served_character_name: s.servedCharacterName,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}

export class HttpLootDropRepository implements ILootDropRepository {
  async findByAccount(accountId: string, filters?: LootDropFilters): Promise<LootDrop[]> {
    let query = getSupabaseClient()
      .from('drops')
      .select(SELECT_WITH_SERVICES)
      .eq('account_id', accountId)
      .eq('hidden', false)
      .order('data_drop', { ascending: false });

    if (filters?.bossName) query = query.ilike('boss', `%${filters.bossName}%`);
    if (filters?.looter) query = query.ilike('fragador', `%${filters.looter}%`);
    if (filters?.sold !== undefined) query = query.eq('vendido', filters.sold);
    if (filters?.dateFrom) query = query.gte('data_drop', brToIso(filters.dateFrom));
    if (filters?.dateTo) query = query.lte('data_drop', brToIso(filters.dateTo));

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as unknown as DropRow[]).map(toDomain);
  }

  async findById(id: string): Promise<LootDrop | null> {
    const { data, error } = await getSupabaseClient()
      .from('drops')
      .select(SELECT_WITH_SERVICES)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDomain(data as unknown as DropRow) : null;
  }

  async create(accountId: string, dto: CreateLootDropDto): Promise<LootDrop> {
    const { data: dropRow, error } = await getSupabaseClient()
      .from('drops')
      .insert({
        account_id: accountId,
        data_drop: brToIso(dto.date),
        ek: dto.party.ek ?? null,
        ed: dto.party.ed ?? null,
        ms: dto.party.ms ?? null,
        rp: dto.party.rp ?? null,
        quinto_player: dto.party.fifthPlayer ?? null,
        fragador: dto.looter,
        item: dto.itemName,
        boss: dto.bossName,
        valor_cada: dto.unitValue,
        valor_total: dto.totalValue,
        vendido: dto.sold ?? false,
        data_venda: dto.saleDate ? brToIso(dto.saleDate) : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const dropId = (dropRow as { id: string }).id;
    await replaceDropServices(dropId, dto.party.services ?? []);

    const created = await this.findById(dropId);
    if (!created) throw new Error('Drop criado mas não encontrado ao reler.');
    return created;
  }

  async update(id: string, dto: Partial<CreateLootDropDto>): Promise<LootDrop> {
    const patch: Record<string, unknown> = {};
    if (dto.date !== undefined) patch.data_drop = brToIso(dto.date);
    if (dto.party?.ek !== undefined) patch.ek = dto.party.ek ?? null;
    if (dto.party?.ed !== undefined) patch.ed = dto.party.ed ?? null;
    if (dto.party?.ms !== undefined) patch.ms = dto.party.ms ?? null;
    if (dto.party?.rp !== undefined) patch.rp = dto.party.rp ?? null;
    if (dto.party?.fifthPlayer !== undefined) patch.quinto_player = dto.party.fifthPlayer ?? null;
    if (dto.looter !== undefined) patch.fragador = dto.looter;
    if (dto.itemName !== undefined) patch.item = dto.itemName;
    if (dto.bossName !== undefined) patch.boss = dto.bossName;
    if (dto.unitValue !== undefined) patch.valor_cada = dto.unitValue;
    if (dto.totalValue !== undefined) patch.valor_total = dto.totalValue;
    if (dto.sold !== undefined) patch.vendido = dto.sold;
    if (dto.saleDate !== undefined) patch.data_venda = dto.saleDate ? brToIso(dto.saleDate) : null;

    if (Object.keys(patch).length > 0) {
      const { error } = await getSupabaseClient().from('drops').update(patch).eq('id', id);
      if (error) throw new Error(error.message);
    }

    if (dto.party?.services !== undefined) {
      await replaceDropServices(id, dto.party.services);
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Drop não encontrado após atualizar.');
    return updated;
  }

  /** Soft delete (2026-08-26, pedido do usuário) — nunca apaga a linha de verdade, só marca
   * `hidden=true` (migration 20260826000000_soft_delete_drops.sql). `drop_services` fica
   * intacto (não faz sentido mais apagar em cascata, já que a linha em si não é apagada). */
  async delete(id: string): Promise<void> {
    const { error } = await getSupabaseClient().from('drops').update({ hidden: true }).eq('id', id);
    if (error) throw new Error(error.message);
  }
}
