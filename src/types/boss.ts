export interface BossMechanic {
  id: string;
  name: string;
  /** Tempo total da sala em segundos (Timer Global) */
  roomDurationSeconds: number;
  /** Tempo do loop de mecanica em segundos (Timer de Loop) */
  loopDurationSeconds: number;
  iconUrl?: string;
}

export interface TimerPreset {
  boss: BossMechanic;
  /** Permite tempos customizados pelo usuario */
  isCustom?: boolean;
}
