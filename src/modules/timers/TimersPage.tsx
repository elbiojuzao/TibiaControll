import { useState, useEffect, useRef } from 'react';
import { useBosses } from '@/hooks/useBosses';

const CUSTOM_OPTION = 'custom';
const DEFAULT_GLOBAL_SECONDS = 1500;
const DEFAULT_LOOP_SECONDS = 90;

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
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds25((prev25) => {
          if (prev25 > 0) return prev25 - 1;
          return 0;
        });

        setSeconds90((prev90) => {
          if (prev90 > 0) {
            return prev90 - 1;
          } else {
            playDoubleBeep();
            triggerBlink();
            return initialLoop;
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 100px)', padding: '20px', gap: '20px', flexWrap: 'wrap', color: '#f8fafc' }}>

      {/* SELETOR DE BOSS */}
      <div style={{
        backgroundColor: '#1e293b',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #334155',
        width: '100%',
        maxWidth: '280px',
      }}>
        <h3 style={{ fontSize: '13px', color: '#38bdf8', margin: '0 0 12px 0' }}>Boss</h3>
        <select
          value={selectedBossId}
          onChange={(e) => handleBossChange(e.target.value)}
          disabled={bossesLoading}
          style={{ width: '100%', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '8px', fontSize: '13px', boxSizing: 'border-box' }}
        >
          <option value={CUSTOM_OPTION}>Personalizado</option>
          {bosses.map((boss) => (
            <option key={boss.id} value={boss.id}>{boss.name}</option>
          ))}
        </select>

        {selectedBossId === CUSTOM_OPTION && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>
              Timer Global (minutos)
              <input
                type="number"
                min={1}
                value={customGlobalMinutes}
                onChange={(e) => setCustomGlobalMinutes(Number(e.target.value) || 1)}
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px', boxSizing: 'border-box' }}
              />
            </label>
            <label style={{ fontSize: '11px', color: '#94a3b8' }}>
              Timer de Loop (segundos)
              <input
                type="number"
                min={1}
                value={customLoopSeconds}
                onChange={(e) => setCustomLoopSeconds(Number(e.target.value) || 1)}
                style={{ width: '100%', marginTop: '4px', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', padding: '6px', boxSizing: 'border-box' }}
              />
            </label>
            <button
              onClick={handleApplyCustom}
              style={{ background: '#38bdf8', color: '#0f172a', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#1e293b',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '360px',
        border: '1px solid #334155'
      }}>

        {/* TIMERS CONTAINER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>

          {/* TIMER GLOBAL */}
          <div style={{
            backgroundColor: '#0f172a',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #334155',
            transition: 'background-color 0.2s ease'
          }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 'bold', letterSpacing: '1px', color: '#f8fafc' }}>
              {formatTime(seconds25)}
            </div>
          </div>

          {/* TIMER DE LOOP (COM PISCAR) */}
          <div style={{
            backgroundColor: isBlinking ? '#38bdf8' : '#0f172a',
            color: isBlinking ? '#0f172a' : '#f8fafc',
            padding: '18px',
            borderRadius: '12px',
            border: '1px solid #334155',
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
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#38bdf8',
              color: '#0f172a',
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
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#475569',
              color: '#f8fafc',
              transition: 'background 0.2s'
            }}
          >
            Zerar
          </button>
        </div>

        {/* CONTROLE DE VOLUME */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: '#94a3b8' }}>
          <label htmlFor="volume">Volume do Bipe</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
          />
        </div>

      </div>

    </div>
  );
}
