import { useState, useEffect, useRef } from 'react';
import { useBosses } from '@/hooks/useBosses';
import { useLoopTimer } from '@/hooks/useLoopTimer';
import { getPotionIconUrl } from '@/services/timers/potion-icons';

const CUSTOM_OPTION = 'custom';
const DEFAULT_GLOBAL_SECONDS = 1500;
const DEFAULT_LOOP_SECONDS = 90;

/** Mastermind/Berserk/Bullseye Potion — as 3 têm efeito de 10 minutos, mesmo timer serve
 * pra lembrar de rebeber qualquer uma delas (pedido do usuário em 2026-08-14). */
const SKILL_POTION_SECONDS = 10 * 60;
const SKILL_POTIONS = ['Mastermind Potion', 'Berserk Potion', 'Bullseye Potion'];

export function TimersPage() {
  const { bosses, loading: bossesLoading } = useBosses();

  const [selectedBossId, setSelectedBossId] = useState<string>(CUSTOM_OPTION);
  const [customGlobalMinutes, setCustomGlobalMinutes] = useState(25);
  const [customLoopSeconds, setCustomLoopSeconds] = useState(90);

  const [initialGlobal, setInitialGlobal] = useState(DEFAULT_GLOBAL_SECONDS);
  const [initialLoop, setInitialLoop] = useState(DEFAULT_LOOP_SECONDS);

  const [seconds25, setSeconds25] = useState<number>(DEFAULT_GLOBAL_SECONDS);
  const [seconds90, setSeconds90] = useState<number>(DEFAULT_LOOP_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  // Timestamps (epoch ms) de quando cada timer termina — âncora no relógio real do
  // usuário em vez de contar ticks de setInterval, que o navegador atrasa (throttle) em
  // abas em segundo plano/inativas, fazendo o timer parecer "parado" (reportado pelo
  // usuário em 2026-08-15). Mesma técnica do useLoopTimer.ts.
  const globalEndAtRef = useRef<number>(0);
  const loopEndAtRef = useRef<number>(0);

  const potionTimer = useLoopTimer(SKILL_POTION_SECONDS, volume);

  const applyDurations = (globalSeconds: number, loopSeconds: number) => {
    setIsRunning(false);
    setInitialGlobal(globalSeconds);
    setInitialLoop(loopSeconds);
    setSeconds25(globalSeconds);
    setSeconds90(loopSeconds);
    setIsBlinking(false);
  };

  const handleBossChange = (bossId: string) => {
    setSelectedBossId(bossId);
    if (bossId === CUSTOM_OPTION) {
      applyDurations(customGlobalMinutes * 60, customLoopSeconds);
      return;
    }
    const boss = bosses.find((b) => b.id === bossId);
    if (boss) applyDurations(boss.roomDurationSeconds, boss.loopDurationSeconds);
  };

  const handleApplyCustom = () => {
    applyDurations(customGlobalMinutes * 60, customLoopSeconds);
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const beep = (freq: number, duration: number, startTime: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, startTime);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.setValueAtTime(volume, startTime + duration - 0.01);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  const playDoubleBeep = () => {
    if (volume === 0 || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const now = audioCtxRef.current.currentTime;
    beep(1200, 0.1, now);
    beep(1200, 0.1, now + 0.15);
  };

  const triggerBlink = () => {
    setIsBlinking(true);
    setTimeout(() => {
      setIsBlinking(false);
    }, 200);
  };

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Ancora os dois timers no relógio real a partir do valor atual (não do inicial —
    // pausar e retomar preserva o tempo restante).
    globalEndAtRef.current = Date.now() + seconds25 * 1000;
    loopEndAtRef.current = Date.now() + seconds90 * 1000;

    const tick = () => {
      const now = Date.now();

      const globalRemainingMs = globalEndAtRef.current - now;
      setSeconds25(Math.max(0, Math.ceil(globalRemainingMs / 1000)));

      const loopRemainingMs = loopEndAtRef.current - now;
      if (loopRemainingMs <= 0) {
        const loopMs = initialLoop * 1000;
        const cyclesPassed = Math.floor(-loopRemainingMs / loopMs) + 1;
        loopEndAtRef.current += cyclesPassed * loopMs;
        setSeconds90(Math.ceil((loopEndAtRef.current - now) / 1000));
        playDoubleBeep();
        triggerBlink();
      } else {
        setSeconds90(Math.ceil(loopRemainingMs / 1000));
      }
    };

    timerRef.current = setInterval(tick, 1000);
    // Recalcula na hora quando a aba volta a ficar visível, em vez de esperar o
    // próximo tick (que pode estar atrasado por causa do throttle).
    document.addEventListener('visibilitychange', tick);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, volume, initialLoop]);

  useEffect(() => {
    if (seconds25 === 0 && isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
      playDoubleBeep();
    }
  }, [seconds25, isRunning]);

  const toggleTimers = () => {
    initAudio();
    setIsRunning(!isRunning);
  };

  const resetTimers = () => {
    setIsRunning(false);
    setSeconds25(initialGlobal);
    setSeconds90(initialLoop);
    setIsBlinking(false);
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 100px)', padding: '20px', gap: '20px', flexWrap: 'wrap', color: 'var(--color-text)' }}>

      {/* SELETOR DE BOSS */}
      <div style={{
        backgroundColor: 'var(--color-bg-elevated)',
        padding: '20px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        width: '100%',
        maxWidth: '280px',
      }}>
        <h3 style={{ fontSize: '13px', color: 'var(--color-accent)', margin: '0 0 12px 0' }}>Boss</h3>
        <select
          value={selectedBossId}
          onChange={(e) => handleBossChange(e.target.value)}
          disabled={bossesLoading}
          className="campo-input"
          style={{ marginTop: 0, fontSize: '13px' }}
        >
          <option value={CUSTOM_OPTION}>Personalizado</option>
          {bosses.map((boss) => (
            <option key={boss.id} value={boss.id}>{boss.name}</option>
          ))}
        </select>

        {selectedBossId === CUSTOM_OPTION && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label className="texto-mudo" style={{ fontSize: '11px' }}>
              Timer Global (minutos)
              <input
                type="number"
                min={1}
                value={customGlobalMinutes}
                onChange={(e) => setCustomGlobalMinutes(Number(e.target.value) || 1)}
                className="campo-input"
                style={{ padding: '6px' }}
              />
            </label>
            <label className="texto-mudo" style={{ fontSize: '11px' }}>
              Timer de Loop (segundos)
              <input
                type="number"
                min={1}
                value={customLoopSeconds}
                onChange={(e) => setCustomLoopSeconds(Number(e.target.value) || 1)}
                className="campo-input"
                style={{ padding: '6px' }}
              />
            </label>
            <button onClick={handleApplyCustom} className="botao-primario" style={{ padding: '8px', fontSize: '12px' }}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: 'var(--color-bg-elevated)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '360px',
        border: '1px solid var(--color-border)'
      }}>

        {/* TIMERS CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>

          {/* TIMER GLOBAL */}
          <div style={{
            backgroundColor: 'var(--color-bg-input)',
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            transition: 'background-color 0.2s ease'
          }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 'bold', letterSpacing: '1px', color: 'var(--color-text)' }}>
              {formatTime(seconds25)}
            </div>
          </div>

          {/* TIMER DE LOOP (COM PISCAR) */}
          <div style={{
            backgroundColor: isBlinking ? 'var(--color-accent)' : 'var(--color-bg-input)',
            color: isBlinking ? 'var(--color-bg)' : 'var(--color-text)',
            padding: '18px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--color-border)',
            transition: 'background-color 0.2s ease, color 0.2s ease'
          }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 'bold', letterSpacing: '1px' }}>
              {formatTime(seconds90)}
            </div>
          </div>

        </div>

        {/* CONTROLES */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }}>
          <button
            onClick={toggleTimers}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-bg)',
              transition: 'background 0.2s'
            }}
          >
            {isRunning ? 'Pausar' : 'Iniciar'}
          </button>

          <button
            onClick={resetTimers}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              backgroundColor: 'var(--color-bg-hover)',
              color: 'var(--color-text)',
              transition: 'background 0.2s'
            }}
          >
            Zerar
          </button>
        </div>

        {/* CONTROLE DE VOLUME */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <label htmlFor="volume">Volume do Bipe</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
        </div>

      </div>

      {/* TIMER DE POÇÕES DE SKILL — independente do timer de boss acima, loop fixo de 10min
          (Mastermind/Berserk/Bullseye Potion têm o mesmo tempo de efeito) */}
      <div style={{
        backgroundColor: 'var(--color-bg-elevated)',
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '280px',
        border: '1px solid var(--color-border)',
      }}>
        <h3 style={{ fontSize: '13px', color: 'var(--color-accent)', margin: '0 0 12px 0' }}>Poções de Skill</h3>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
          {SKILL_POTIONS.map((name) => {
            const iconUrl = getPotionIconUrl(name);
            return (
              <img
                key={name}
                src={iconUrl}
                alt={name}
                title={name}
                className="h32 w32"
                style={{ objectFit: 'contain', imageRendering: 'pixelated', opacity: iconUrl ? 1 : 0 }}
              />
            );
          })}
        </div>

        <div style={{
          backgroundColor: potionTimer.isBlinking ? 'var(--color-accent)' : 'var(--color-bg-input)',
          color: potionTimer.isBlinking ? 'var(--color-bg)' : 'var(--color-text)',
          padding: '18px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          marginBottom: '18px',
          transition: 'background-color 0.2s ease, color 0.2s ease',
        }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', letterSpacing: '1px' }}>
            {formatTime(potionTimer.secondsLeft)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={potionTimer.toggle}
            style={{
              padding: '10px 20px', fontSize: '1rem', fontWeight: 600, border: 'none',
              borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: 'var(--color-accent)', color: 'var(--color-bg)',
            }}
          >
            {potionTimer.isRunning ? 'Pausar' : 'Iniciar'}
          </button>
          <button
            onClick={potionTimer.reset}
            style={{
              padding: '10px 20px', fontSize: '1rem', fontWeight: 600, border: 'none',
              borderRadius: 'var(--radius)', cursor: 'pointer', backgroundColor: 'var(--color-bg-hover)', color: 'var(--color-text)',
            }}
          >
            Zerar
          </button>
        </div>
      </div>

    </div>
  );
}
