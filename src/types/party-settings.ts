/** Configurações da party que variam no tempo (ex: cotação de mercado) — editáveis pelo usuário na UI */
export interface PartySettings {
  /** Gold por Tibia Coin, usado na calculadora de split pra converter "Extra TC expense" em gold */
  tcGoldRate: number;
}
