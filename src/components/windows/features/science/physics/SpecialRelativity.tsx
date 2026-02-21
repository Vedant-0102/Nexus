import React, { useState, useRef, useEffect } from 'react';
import { Zap, Play, Pause, RotateCcw, Info } from 'lucide-react';

export const SpecialRelativity: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [velocity, setVelocity] = useState(0.5); // fraction of c
  const [tab, setTab] = useState<'dilation' | 'contraction' | 'twin'>('dilation');
  const timeRef = useRef(0);

  const gamma = 1 / Math.sqrt(1 - velocity * velocity);
  const timeDilation = gamma;
  const lengthFactor = 1 / gamma;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    let isDark = document.documentElement.classList.contains('dark');

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isPlaying) return;
      timeRef.current += 1;
      isDark = document.documentElement.classList.contains('dark');
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);

      if (tab === 'dilation') drawTimeDilation(ctx, w, h);
      else if (tab === 'contraction') drawLengthContraction(ctx, w, h);
      else drawTwinParadox(ctx, w, h);
    };

    const drawTimeDilation = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w / 2;
      // Stationary clock (left)
      const leftX = centerX - w * 0.25;
      const rightX = centerX + w * 0.25;
      const clockY = h * 0.45;
      const clockR = Math.min(60, w * 0.08);

      // Background labels
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Stationary Observer', leftX, h * 0.12);
      ctx.fillText('Moving Observer (v = ' + (velocity * 100).toFixed(0) + '% c)', rightX, h * 0.12);

      // Draw both clocks
      const stationaryAngle = (timeRef.current * 0.03) % (Math.PI * 2);
      const movingAngle = (timeRef.current * 0.03 / gamma) % (Math.PI * 2);

      drawClock(ctx, leftX, clockY, clockR, stationaryAngle, '#3b82f6');
      drawClock(ctx, rightX, clockY, clockR, movingAngle, '#ef4444');

      // Time display
      const stationaryTime = (timeRef.current * 0.03 / (Math.PI * 2) * 12).toFixed(1);
      const movingTime = (timeRef.current * 0.03 / gamma / (Math.PI * 2) * 12).toFixed(1);

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#3b82f6';
      ctx.fillText(`t = ${stationaryTime}s`, leftX, clockY + clockR + 30);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`t' = ${movingTime}s`, rightX, clockY + clockR + 30);

      // Speed indicator for moving clock
      const shipX = rightX + Math.sin(timeRef.current * 0.05) * 15;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath();
      ctx.ellipse(shipX, clockY - clockR - 30, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Formula
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`γ = ${gamma.toFixed(3)}`, centerX, h * 0.78);
      ctx.fillText(`t' = t / γ = t × ${(1 / gamma).toFixed(3)}`, centerX, h * 0.82);
      ctx.fillText(`Moving clocks tick SLOWER`, centerX, h * 0.88);
    };

    function drawClock(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number, color: string) {
      // Clock face
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Hour markers
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8), 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hand
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle - Math.PI / 2) * (r - 15), cy + Math.sin(angle - Math.PI / 2) * (r - 15));
      ctx.stroke();

      // Center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const drawLengthContraction = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w / 2;
      const topY = h * 0.25;
      const bottomY = h * 0.6;
      const barLen = w * 0.4;
      const barH = 30;

      // Stationary bar
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('At Rest (proper length L₀)', centerX, topY - 20);

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(centerX - barLen / 2, topY, barLen, barH, 5);
      ctx.fill();

      // Length marker
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - barLen / 2, topY + barH + 10);
      ctx.lineTo(centerX - barLen / 2, topY + barH + 20);
      ctx.moveTo(centerX + barLen / 2, topY + barH + 10);
      ctx.lineTo(centerX + barLen / 2, topY + barH + 20);
      ctx.moveTo(centerX - barLen / 2, topY + barH + 15);
      ctx.lineTo(centerX + barLen / 2, topY + barH + 15);
      ctx.stroke();
      ctx.fillStyle = '#1e40af';
      ctx.font = '11px sans-serif';
      ctx.fillText('L₀ = 1.000 m', centerX, topY + barH + 30);

      // Moving bar (contracted)
      const contractedLen = barLen * lengthFactor;
      const moveX = Math.sin(timeRef.current * 0.03) * 40;

      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Moving at v = ${(velocity * 100).toFixed(0)}% c`, centerX, bottomY - 20);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(centerX - contractedLen / 2 + moveX, bottomY, contractedLen, barH, 5);
      ctx.fill();

      // Contracted length marker
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - contractedLen / 2 + moveX, bottomY + barH + 10);
      ctx.lineTo(centerX - contractedLen / 2 + moveX, bottomY + barH + 20);
      ctx.moveTo(centerX + contractedLen / 2 + moveX, bottomY + barH + 10);
      ctx.lineTo(centerX + contractedLen / 2 + moveX, bottomY + barH + 20);
      ctx.moveTo(centerX - contractedLen / 2 + moveX, bottomY + barH + 15);
      ctx.lineTo(centerX + contractedLen / 2 + moveX, bottomY + barH + 15);
      ctx.stroke();
      ctx.fillStyle = '#b91c1c';
      ctx.font = '11px sans-serif';
      ctx.fillText(`L = L₀/γ = ${lengthFactor.toFixed(3)} m`, centerX + moveX, bottomY + barH + 30);

      // Ghost of original length
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(centerX - barLen / 2 + moveX, bottomY, barLen, barH);
      ctx.setLineDash([]);

      // Formula
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`γ = ${gamma.toFixed(3)}   |   L = L₀ × √(1 - v²/c²) = L₀ × ${lengthFactor.toFixed(3)}`, centerX, h * 0.88);
      ctx.fillText('Objects contract in the direction of motion', centerX, h * 0.92);
    };

    const drawTwinParadox = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const earthX = w * 0.2;
      const starX = w * 0.8;
      const pathY = h * 0.5;

      // Earth
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(earthX, pathY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Earth', earthX, pathY + 4);

      // Star
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(starX, pathY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Star', starX, pathY + 4);

      // Path
      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(earthX + 30, pathY);
      ctx.lineTo(starX - 25, pathY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Traveling twin ship
      const journeyTime = 600;
      const t = (timeRef.current % journeyTime) / journeyTime;
      const outbound = t < 0.5;
      const tripProgress = outbound ? t * 2 : 2 - t * 2;
      const shipX = earthX + 35 + (starX - earthX - 60) * tripProgress;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(shipX + (outbound ? 12 : -12), pathY);
      ctx.lineTo(shipX + (outbound ? -8 : 8), pathY - 7);
      ctx.lineTo(shipX + (outbound ? -8 : 8), pathY + 7);
      ctx.closePath();
      ctx.fill();

      // Earth twin ages
      const earthAge = 20 + (timeRef.current % journeyTime) / journeyTime * 30;
      const spaceTwinAge = 20 + ((timeRef.current % journeyTime) / journeyTime * 30) / gamma;

      // Twin faces
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      // Stay-at-home twin
      ctx.fillText('Stay-at-home Twin', earthX, pathY - 60);
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#22c55e';
      ctx.fillText(`Age: ${earthAge.toFixed(1)} yrs`, earthX, pathY - 42);

      // Traveling twin
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText('Traveling Twin', shipX, pathY - 30);
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`Age: ${spaceTwinAge.toFixed(1)} yrs`, shipX, pathY - 14);

      // Info
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`v = ${(velocity * 100).toFixed(0)}% c   |   γ = ${gamma.toFixed(2)}`, w / 2, h * 0.78);
      ctx.fillText(`After the trip: twin on Earth aged ${(30).toFixed(0)} yrs, traveling twin aged ${(30 / gamma).toFixed(1)} yrs`, w / 2, h * 0.84);
      ctx.fillText(`Difference: ${(30 - 30 / gamma).toFixed(1)} years younger!`, w / 2, h * 0.89);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, velocity, tab, gamma, lengthFactor]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-500" />
            Special Relativity
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Time dilation, length contraction & the twin paradox
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => { timeRef.current = 0; }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-2">
        {(['dilation', 'contraction', 'twin'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); timeRef.current = 0; }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-indigo-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {t === 'dilation' ? '⏱️ Time Dilation' : t === 'contraction' ? '📏 Length Contraction' : '👯 Twin Paradox'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full p-2">
            <canvas ref={canvasRef} className="w-full h-full rounded" />
          </div>
        </div>

        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Controls</h4>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Velocity: {(velocity * 100).toFixed(0)}% of c</label>
              <input type="range" min="0.01" max="0.99" step="0.01" value={velocity} onChange={e => setVelocity(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Calculated Values</h4>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-400 uppercase">Lorentz Factor (γ)</div>
              <div className="text-sm font-mono font-bold text-indigo-600">{gamma.toFixed(4)}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-400 uppercase">Time Dilation</div>
              <div className="text-sm font-mono font-bold text-blue-600">×{timeDilation.toFixed(3)} slower</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-400 uppercase">Length Contraction</div>
              <div className="text-sm font-mono font-bold text-purple-600">{(lengthFactor * 100).toFixed(1)}% of L₀</div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Einstein's Postulates
            </h4>
            <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-300">
              <p>1. The laws of physics are the same in all inertial frames.</p>
              <p>2. The speed of light (c) is constant for all observers.</p>
              <p className="font-mono bg-white dark:bg-gray-800 rounded px-1 py-0.5 mt-1">γ = 1/√(1 − v²/c²)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
