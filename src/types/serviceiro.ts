import type { Vocation } from './account';

export interface Serviceiro {
  id: string;
  accountId: string;
  name: string;
  /** Só dígitos, com DDI+DDD (ex: 5511999998888). Nunca é exibido diretamente na UI. */
  phoneNumber: string;
  /** Vocações em que esse serviceiro presta serviço */
  vocations: Vocation[];
}

export interface CreateServiceiroDto {
  name: string;
  phoneNumber: string;
  vocations: Vocation[];
}
