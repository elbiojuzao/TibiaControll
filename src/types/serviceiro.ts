import type { Vocation } from './account';

export interface Serviceiro {
  id: string;
  accountId: string;
  name: string;
  /** Nome do char (boneco) usado para receber o pagamento do serviço */
  characterName: string;
  /** Só dígitos, com DDI+DDD (ex: 5511999998888). Nunca é exibido diretamente na UI. */
  phoneNumber: string;
  /** Vocações em que esse serviceiro presta serviço */
  vocations: Vocation[];
}

export interface CreateServiceiroDto {
  name: string;
  characterName: string;
  phoneNumber: string;
  vocations: Vocation[];
}
