/** Preset salvo da Roda de Destino (2026-09-08, pedido do usuário) — ver migration
 * 20260908010000_create_wheel_presets_table.sql pro porquê de `state` ser só o binário
 * compacto (mesmo formato do hash da URL) em vez de reimplementar a estrutura antiga de
 * allocations/vessels/gems. `vocation` fica como string livre (não importa o tipo `Vocation`
 * ambiente de tibia-wheel-reference/types.d.ts pra não acoplar esse módulo ao port). */
export interface WheelPreset {
  id: string;
  accountId: string;
  name: string;
  vocation: string;
  /** Nível necessário (pontos investidos no preset + 50). */
  level: number;
  /** Binário compacto (contextToBinary: level+vocation+perks) pra restaurar via hash da URL. */
  state: string;
  createdAt: string;
}

export interface CreateWheelPresetDto {
  name: string;
  vocation: string;
  level: number;
  state: string;
}
