import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

type SignalMode = 'custom' | 'square' | 'sawtooth' | 'triangle';

interface CustomWave { freq: number; amp: number; active: boolean; }

const WAVE_COLORS = ['#f87171', '#34d399', '#fbbf24'];
const MAX_BIN = 24;
const N_SAMPLES = 512;

const modeInfo: Record<SignalMode, { name: string; formula: string; note: string }> = {
  custom: {
    name: 'Build Your Own',
    formula: 's(t) = Σ Aₖ sin(2π fₖ t)',
    note: 'Mix up to 3 sine waves. Each one appears as a single spike in the spectrum — the spectrum is the "recipe" of the signal.',
  },
  square: {
    name: 'Square Wave',
    formula: 's(t) = (4/π) Σ sin(2πkt)/k, odd k',
    note: 'Only odd harmonics (1, 3, 5, …) with amplitude falling as 1/k. The overshoot wiggles near each jump never disappear — that is the Gibbs phenomenon.',
  },
  sawtooth: {
    name: 'Sawtooth Wave',
    formula: 's(t) = (2/π) Σ (−1)ᵏ⁺¹ sin(2πkt)/k',
    note: 'Every harmonic (1, 2, 3, …) appears, falling as 1/k. Sharp edges need lots of high frequencies — smooth signals do not.',
  },
  triangle: {
    name: 'Triangle Wave',
    formula: 's(t) = (8/π²) Σ ± sin(2πkt)/k², odd k',
    note: 'Odd harmonics falling as 1/k² — much faster than the square wave. Smoother shape ⇒ high frequencies die off quicker.',
  },
};

export const FourierTransform: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mode, setMode] = useState<SignalMode>('square');
  const [harmonics, setHarmonics] = useState(5);
  const [waves, setWaves] = useState<CustomWave[]>([
    { freq: 2, amp: 1, active: true },
    { freq: 5, amp: 0.5, active: true },
    { freq: 9, amp: 0.3, active: false },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d; canvas.height = r.height * d; ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { hoverRef.current = null; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    // θ is the phase 2π·t with t in periods of the 1 Hz fundamental
    const partialSum = (theta: number): number => {
      if (mode === 'custom') {
        return waves.reduce((s, wv) => wv.active ? s + wv.amp * Math.sin(wv.freq * theta) : s, 0);
      }
      let s = 0;
      for (let k = 1; k <= harmonics; k++) {
        if (mode === 'square' && k % 2 === 1) s += (4 / Math.PI) * Math.sin(k * theta) / k;
        if (mode === 'sawtooth') s += (2 / Math.PI) * ((k % 2 === 1 ? 1 : -1) * Math.sin(k * theta)) / k;
        if (mode === 'triangle' && k % 2 === 1) s += (8 / (Math.PI * Math.PI)) * ((k % 4 === 1 ? 1 : -1) * Math.sin(k * theta)) / (k * k);
      }
      return s;
    };

    const idealWave = (theta: number): number => {
      const th = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (mode === 'square') return Math.sin(th) >= 0 ? 1 : -1;
      if (mode === 'sawtooth') return (th < Math.PI ? th : th - 2 * Math.PI) / Math.PI;
      if (mode === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(th));
      return 0;
    };

    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (isPlaying) timeRef.current += dt * 2.5;
      const phase = timeRef.current;

      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);
      const gridCol = isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.10)';
      const textCol = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)';
      const faintText = isDark ? 'rgba(200,200,255,0.35)' : 'rgba(30,40,80,0.4)';

      // ---- Layout: time domain on top, spectrum below ----
      const padX = 16;
      const timeTop = 24, timeH = h * 0.46;
      const timeMid = timeTop + timeH / 2;
      const specTop = timeTop + timeH + 40;
      const specH = h - specTop - 34;
      const plotW = w - padX * 2;
      const periodsShown = 2; // x axis covers 2 periods of the fundamental
      const yScale = timeH / 3.6; // signal range ~±1.8 fits

      // Time-domain grid + axis
      ctx.strokeStyle = gridCol; ctx.lineWidth = 1;
      for (let i = 0; i <= periodsShown * 4; i++) {
        const x = padX + (i / (periodsShown * 4)) * plotW;
        ctx.beginPath(); ctx.moveTo(x, timeTop); ctx.lineTo(x, timeTop + timeH); ctx.stroke();
      }
      ctx.strokeStyle = isDark ? 'rgba(150,150,200,0.35)' : 'rgba(80,90,130,0.35)';
      ctx.beginPath(); ctx.moveTo(padX, timeMid); ctx.lineTo(padX + plotW, timeMid); ctx.stroke();

      ctx.fillStyle = textCol; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('TIME DOMAIN — the signal you would see on an oscilloscope', padX, 14);

      const thetaAt = (px: number) => ((px - padX) / plotW) * periodsShown * 2 * Math.PI - phase;

      // Individual components (custom mode) drawn faintly
      if (mode === 'custom') {
        waves.forEach((wv, i) => {
          if (!wv.active) return;
          ctx.strokeStyle = WAVE_COLORS[i] + '55'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (let px = 0; px <= plotW; px += 2) {
            const y = timeMid - wv.amp * Math.sin(wv.freq * thetaAt(padX + px)) * yScale;
            px === 0 ? ctx.moveTo(padX + px, y) : ctx.lineTo(padX + px, y);
          }
          ctx.stroke();
        });
      } else {
        // Ideal target wave, dashed — the shape the harmonics are trying to build
        ctx.strokeStyle = isDark ? 'rgba(200,200,255,0.3)' : 'rgba(30,40,80,0.25)';
        ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let px = 0; px <= plotW; px += 2) {
          const y = timeMid - idealWave(thetaAt(padX + px)) * yScale;
          px === 0 ? ctx.moveTo(padX + px, y) : ctx.lineTo(padX + px, y);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // Composite / partial sum (bold)
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= plotW; px += 1) {
        const y = timeMid - partialSum(thetaAt(padX + px)) * yScale;
        px === 0 ? ctx.moveTo(padX + px, y) : ctx.lineTo(padX + px, y);
      }
      ctx.stroke();

      if (mode !== 'custom') {
        ctx.fillStyle = faintText; ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`solid: sum of ${mode === 'sawtooth' ? harmonics : Math.ceil(harmonics / 2)} harmonic(s) · dashed: ideal ${mode}`, padX + plotW, timeTop + timeH + 12);
      }

      // ---- Spectrum via actual DFT of the sampled signal ----
      const samples = new Array(N_SAMPLES);
      for (let n = 0; n < N_SAMPLES; n++) samples[n] = partialSum((n / N_SAMPLES) * 2 * Math.PI);
      const mags: number[] = [0];
      for (let k = 1; k <= MAX_BIN; k++) {
        let re = 0, im = 0;
        for (let n = 0; n < N_SAMPLES; n++) {
          const ang = (2 * Math.PI * k * n) / N_SAMPLES;
          re += samples[n] * Math.cos(ang);
          im -= samples[n] * Math.sin(ang);
        }
        mags.push((2 / N_SAMPLES) * Math.hypot(re, im));
      }
      const maxMag = Math.max(...mags, 0.5);

      ctx.fillStyle = textCol; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('FREQUENCY DOMAIN — the recipe (computed with a real DFT)', padX, specTop - 10);

      // Spectrum axis
      ctx.strokeStyle = isDark ? 'rgba(150,150,200,0.35)' : 'rgba(80,90,130,0.35)';
      ctx.beginPath(); ctx.moveTo(padX, specTop + specH); ctx.lineTo(padX + plotW, specTop + specH); ctx.stroke();

      const binW = plotW / MAX_BIN;
      let hoverBin = -1;
      const hv = hoverRef.current;
      if (hv && hv.y > specTop - 10 && hv.y < specTop + specH + 20) {
        hoverBin = Math.round((hv.x - padX) / binW);
        if (hoverBin < 1 || hoverBin > MAX_BIN) hoverBin = -1;
      }

      for (let k = 1; k <= MAX_BIN; k++) {
        const bx = padX + (k - 0.5) * binW;
        const bh = (mags[k] / maxMag) * (specH - 8);
        const isHover = k === hoverBin;
        let col = '#a78bfa';
        if (mode === 'custom') {
          const wi = waves.findIndex((wv, i) => wv.active && wv.freq === k);
          if (wi >= 0) col = WAVE_COLORS[wi];
        }
        ctx.fillStyle = isHover ? '#f472b6' : (mags[k] > 0.005 ? col : (isDark ? 'rgba(120,120,160,0.25)' : 'rgba(120,120,160,0.3)'));
        const barW = Math.min(binW * 0.55, 18);
        ctx.fillRect(bx - barW / 2, specTop + specH - Math.max(bh, 2), barW, Math.max(bh, 2));

        ctx.fillStyle = k === hoverBin ? '#f472b6' : faintText;
        ctx.font = '8px monospace'; ctx.textAlign = 'center';
        if (k % 2 === 1 || MAX_BIN <= 12) ctx.fillText(`${k}`, bx, specTop + specH + 12);
      }
      ctx.fillStyle = faintText; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('frequency (multiples of the fundamental, Hz)', padX + plotW / 2, specTop + specH + 24);

      // Hover tooltip
      if (hoverBin > 0) {
        const bx = padX + (hoverBin - 0.5) * binW;
        const label = `${hoverBin} Hz · amplitude ${mags[hoverBin].toFixed(3)}`;
        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(label).width + 12;
        const tx = Math.min(Math.max(bx - tw / 2, padX), padX + plotW - tw);
        ctx.fillStyle = isDark ? 'rgba(30,30,55,0.95)' : 'rgba(255,255,255,0.95)';
        ctx.strokeStyle = '#f472b6';
        ctx.beginPath(); ctx.roundRect(tx, specTop - 4, tw, 18, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isDark ? '#f9a8d4' : '#be185d'; ctx.textAlign = 'left';
        ctx.fillText(label, tx + 6, specTop + 9);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [isPlaying, mode, harmonics, waves]);

  const info = modeInfo[mode];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-violet-100 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">〰️ Fourier Transform Lab</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Every repeating signal is a sum of sine waves — hover the spectrum to inspect it</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white ${isPlaying ? 'bg-amber-600' : 'bg-green-600'}`}>
            {isPlaying ? <><Pause className="h-3.5 w-3.5" />Pause</> : <><Play className="h-3.5 w-3.5" />Play</>}
          </button>
          <button onClick={() => { timeRef.current = 0; }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Signal</h4>
            {(Object.keys(modeInfo) as SignalMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${mode === m ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {modeInfo[m].name}
              </button>
            ))}
          </div>

          {mode === 'custom' ? (
            <div className="space-y-2">
              {waves.map((wv, i) => (
                <div key={i} className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[10px] font-semibold" style={{ color: WAVE_COLORS[i] }}>Wave {i + 1}</span>
                    <input type="checkbox" checked={wv.active} onChange={e => setWaves(ws => ws.map((x, j) => j === i ? { ...x, active: e.target.checked } : x))} className="accent-violet-500 w-3 h-3" />
                  </label>
                  <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Frequency</span><span>{wv.freq} Hz</span></label>
                  <input type="range" min={1} max={MAX_BIN} step={1} value={wv.freq} disabled={!wv.active} onChange={e => setWaves(ws => ws.map((x, j) => j === i ? { ...x, freq: +e.target.value } : x))} className="w-full h-1 accent-violet-500" />
                  <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Amplitude</span><span>{wv.amp.toFixed(2)}</span></label>
                  <input type="range" min={0} max={1} step={0.05} value={wv.amp} disabled={!wv.active} onChange={e => setWaves(ws => ws.map((x, j) => j === i ? { ...x, amp: +e.target.value } : x))} className="w-full h-1 accent-violet-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Harmonics in the sum</span><span>{harmonics}</span></label>
              <input type="range" min={1} max={MAX_BIN} step={1} value={harmonics} onChange={e => setHarmonics(+e.target.value)} className="w-full h-1 accent-violet-500" />
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Drag right and watch the sum of smooth sines snap toward the sharp-edged wave.</p>
            </div>
          )}

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Series Formula</h4>
            <p className="text-[9px] font-mono bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-1 text-gray-700 dark:text-gray-300">{info.formula}</p>
          </div>

          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />{info.name}</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">{info.note}</p>
            <p className="text-[9px] text-gray-600 dark:text-gray-400 mt-1.5">This is how MP3, JPEG, and noise-cancelling headphones work: convert to the frequency domain, keep the important spikes, throw the rest away.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
