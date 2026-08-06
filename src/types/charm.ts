export type CharmCategory = 'major' | 'minor';

/** 0 = não desbloqueado, 1/2/3 = nível da runa (Bronze/Prata/Ouro) */
export type CharmLevel = 0 | 1 | 2 | 3;

export interface CharmDefinition {
  id: string;
  name: string;
  category: CharmCategory;
  /** Custo acumulado desde o zero: [nível1, nível2, nível3] */
  cumulativeCost: [number, number, number];
}

export interface CharmPlanInput {
  /** charmId -> nível alvo escolhido pelo usuário */
  selections: Record<string, CharmLevel>;
  availableMajorPoints: number;
  availableMinorEchoes: number;
}

export interface CharmCostRow {
  charmId: string;
  name: string;
  level: CharmLevel;
  cost: number;
}

export interface CharmPlanResult {
  major: {
    rows: CharmCostRow[];
    required: number;
    remaining: number;
  };
  minor: {
    rows: CharmCostRow[];
    required: number;
    remaining: number;
  };
}
