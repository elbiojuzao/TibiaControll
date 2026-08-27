import { isoToBr, brToIso } from '@/services/common/br-date';
import { vocationOptions, fifthPlayerOptions } from '@/services/lootdrop/drop-form-calculations';
import type { Member, Serviceiro } from '@/types';

const VAZIO = '';

interface PartyCompositionFieldsProps {
  date: string;
  ek: string;
  ed: string;
  rp: string;
  ms: string;
  fifthPlayer: string;
  onDateChange: (value: string) => void;
  onEkChange: (value: string) => void;
  onEdChange: (value: string) => void;
  onRpChange: (value: string) => void;
  onMsChange: (value: string) => void;
  onFifthPlayerChange: (value: string) => void;
  members: Member[];
  serviceiros: Serviceiro[];
}

/** Campos "Data + EK/ED/RP/MS/5º Player" do DropFormModal — extraído em 2026-08-27 pra
 * reduzir o tamanho do componente (ver memória "componentes-grandes"). Só apresentação: as
 * opções de cada select vêm de vocationOptions/fifthPlayerOptions
 * (drop-form-calculations.ts), o estado continua todo no componente pai. */
export function PartyCompositionFields({
  date, ek, ed, rp, ms, fifthPlayer,
  onDateChange, onEkChange, onEdChange, onRpChange, onMsChange, onFifthPlayerChange,
  members, serviceiros,
}: PartyCompositionFieldsProps) {
  return (
    <div className="grid-3col">
      <label className="label-padrao">
        Data:
        <input type="date" value={brToIso(date)} onChange={(e) => onDateChange(isoToBr(e.target.value))} className="campo-input" />
      </label>
      <label className="label-padrao">
        EK:
        <select value={ek} onChange={(e) => onEkChange(e.target.value)} className="campo-input">
          <option value={VAZIO}>-- Vazio --</option>
          {vocationOptions(members, 'EK', ek).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="label-padrao">
        ED:
        <select value={ed} onChange={(e) => onEdChange(e.target.value)} className="campo-input">
          <option value={VAZIO}>-- Vazio --</option>
          {vocationOptions(members, 'ED', ed).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="label-padrao">
        RP:
        <select value={rp} onChange={(e) => onRpChange(e.target.value)} className="campo-input">
          <option value={VAZIO}>-- Vazio --</option>
          {vocationOptions(members, 'RP', rp).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="label-padrao">
        MS:
        <select value={ms} onChange={(e) => onMsChange(e.target.value)} className="campo-input">
          <option value={VAZIO}>-- Vazio --</option>
          {vocationOptions(members, 'MS', ms).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="label-padrao">
        5º Player:
        <select value={fifthPlayer} onChange={(e) => onFifthPlayerChange(e.target.value)} className="campo-input">
          <option value={VAZIO}>-- Vazio --</option>
          {fifthPlayerOptions(serviceiros, fifthPlayer).map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
