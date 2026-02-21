import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface TectonicPlate {
  name: string; points: [number, number][]; color: string; vx: number; vy: number;
  offsetX: number; offsetY: number;
}

export const PlateTectonics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showQuakes, setShowQuakes] = useState(true);
  const [mode, setMode] = useState<'divergent' | 'convergent' | 'transform'>('divergent');
  const timeRef = useRef(0);
  const quakesRef = useRef<{ x: number; y: number; mag: number; life: number; maxLife: number }[]>([]);

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

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);

      // Background (ocean)
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0a1830' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      if (running) timeRef.current += 0.016 * speed;
      const t = timeRef.current;

      const cx = w / 2, cy = h / 2;

      if (mode === 'divergent') {
        // Two plates moving apart - mid-ocean ridge
        const gap = 2 + t * 0.3;
        const clampGap = Math.min(gap, 60);

        // Left plate
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(0, cy - 60, cx - clampGap, 120);
        // Right plate
        ctx.fillStyle = '#4a5a3a';
        ctx.fillRect(cx + clampGap, cy - 60, w - cx - clampGap, 120);

        // Layers on plates
        for (let i = 0; i < 3; i++) {
          const ly = cy - 60 + i * 40;
          const colors = ['#6a5a4a', '#8a6a4a', '#ba8a5a'];
          ctx.fillStyle = colors[i];
          ctx.fillRect(0, ly, cx - clampGap, 40);
          ctx.fillStyle = colors[i];
          ctx.fillRect(cx + clampGap, ly, w - cx - clampGap, 40);
        }

        // Magma in the gap
        for (let y = cy - 55; y < cy + 55; y += 3) {
          const intensity = Math.sin(y * 0.1 + t * 2) * 0.3 + 0.7;
          ctx.fillStyle = `rgba(255,${100 + intensity * 100},0,${intensity * 0.8})`;
          ctx.fillRect(cx - clampGap + 3, y, clampGap * 2 - 6, 2);
        }

        // Arrows
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        const arrY = cy;
        // Left arrow
        ctx.beginPath(); ctx.moveTo(cx - clampGap - 20, arrY); ctx.lineTo(cx - clampGap - 60, arrY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - clampGap - 60, arrY); ctx.lineTo(cx - clampGap - 50, arrY - 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - clampGap - 60, arrY); ctx.lineTo(cx - clampGap - 50, arrY + 8); ctx.stroke();
        // Right arrow
        ctx.beginPath(); ctx.moveTo(cx + clampGap + 20, arrY); ctx.lineTo(cx + clampGap + 60, arrY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + clampGap + 60, arrY); ctx.lineTo(cx + clampGap + 50, arrY - 8); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + clampGap + 60, arrY); ctx.lineTo(cx + clampGap + 50, arrY + 8); ctx.stroke();

        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Divergent Boundary (Mid-Ocean Ridge)', cx, 20);
        ctx.fillText('Continental Crust', cx - clampGap - 80, cy - 70);
        ctx.fillText('Continental Crust', cx + clampGap + 80, cy - 70);
        ctx.fillStyle = 'rgba(255,150,50,0.7)';
        ctx.fillText('Magma upwelling', cx, cy + 80);

      } else if (mode === 'convergent') {
        // Subduction zone
        const progress = Math.min(t * 0.2, 30);

        // Ocean plate (going under)
        ctx.fillStyle = '#3a4a5a';
        const subAngle = Math.PI * 0.15;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx + progress, cy - 20);
        ctx.lineTo(w + 20, cy - 20);
        ctx.lineTo(w + 20, cy + 60);
        ctx.lineTo(cx + progress + 40, cy + 60);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Subducting part (going down)
        ctx.fillStyle = '#3a4a5a';
        ctx.save();
        ctx.translate(cx + progress, cy - 20);
        ctx.rotate(subAngle);
        ctx.fillRect(-80, 0, 80, 30);
        ctx.restore();

        // Continental plate (on top)
        ctx.fillStyle = '#6a5a4a';
        ctx.fillRect(0, cy - 40, cx + progress - 10, 60);
        // Mountain building
        const mtns = 5;
        for (let i = 0; i < mtns; i++) {
          const mx = cx + progress - 40 - i * 25;
          const mh = 20 + Math.sin(i + t * 0.5) * 5 + progress * 0.3;
          ctx.fillStyle = `rgba(${100+i*10},${80+i*10},${60+i*5},0.9)`;
          ctx.beginPath(); ctx.moveTo(mx - 20, cy - 40); ctx.lineTo(mx, cy - 40 - mh); ctx.lineTo(mx + 20, cy - 40); ctx.closePath(); ctx.fill();
        }

        // Mantle below
        ctx.fillStyle = 'rgba(180,80,20,0.3)';
        ctx.fillRect(0, cy + 20, w, h - cy - 20);

        // Magma pocket
        ctx.fillStyle = 'rgba(255,100,0,0.4)';
        ctx.beginPath(); ctx.ellipse(cx + progress - 30, cy + 40, 20, 12, 0, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Convergent Boundary (Subduction Zone)', cx, 20);
        ctx.fillText('Continental Plate', cx / 2, cy - 50);
        ctx.fillText('Oceanic Plate', cx + (w - cx) / 2 + progress / 2, cy - 30);
        ctx.fillText('← Subduction', cx + progress + 20, cy + 55);

      } else {
        // Transform boundary
        const offset = Math.sin(t * 0.3) * 15;

        // Top plate
        ctx.fillStyle = '#5a5a4a';
        ctx.fillRect(0, 0, w, cy - 5);
        // Grid lines on top
        for (let x = 0; x < w; x += 30) {
          ctx.strokeStyle = 'rgba(100,100,80,0.3)'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x + offset, 0); ctx.lineTo(x + offset, cy - 5); ctx.stroke();
        }

        // Bottom plate
        ctx.fillStyle = '#4a5a5a';
        ctx.fillRect(0, cy + 5, w, h - cy - 5);
        for (let x = 0; x < w; x += 30) {
          ctx.strokeStyle = 'rgba(80,100,100,0.3)'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x - offset, cy + 5); ctx.lineTo(x - offset, h); ctx.stroke();
        }

        // Fault line
        ctx.strokeStyle = 'rgba(255,100,100,0.6)'; ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.setLineDash([]);

        // Arrows
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 30, cy - 25); ctx.lineTo(cx + 30, cy - 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 30, cy - 25); ctx.lineTo(cx + 20, cy - 33); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 30, cy + 25); ctx.lineTo(cx - 30, cy + 25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 30, cy + 25); ctx.lineTo(cx - 20, cy + 17); ctx.stroke();

        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Transform Boundary (Strike-Slip Fault)', cx, 20);

        // Stress buildup indicator
        const stress = Math.abs(Math.sin(t * 0.3));
        ctx.fillStyle = `rgba(255,${255 - stress * 200},0,0.3)`;
        ctx.fillRect(20, h - 30, (w - 40) * stress, 12);
        ctx.strokeStyle = 'rgba(200,200,255,0.2)'; ctx.strokeRect(20, h - 30, w - 40, 12);
        ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`Stress: ${(stress * 100).toFixed(0)}%`, 22, h - 35);
      }

      // Earthquakes
      if (showQuakes && running) {
        if (Math.random() < 0.02 * speed) {
          const qx = cx + (Math.random() - 0.5) * 40;
          const qy = cy + (Math.random() - 0.5) * 20;
          quakesRef.current.push({ x: qx, y: qy, mag: 2 + Math.random() * 6, life: 60, maxLife: 60 });
        }
      }
      quakesRef.current.forEach(q => {
        const alpha = q.life / q.maxLife;
        const r2 = (1 - alpha) * q.mag * 8;
        ctx.strokeStyle = `rgba(255,${50+q.mag*20},50,${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, r2, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(q.x, q.y, r2 * 0.6, 0, Math.PI * 2); ctx.stroke();
        if (running) q.life--;
      });
      quakesRef.current = quakesRef.current.filter(q => q.life > 0);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, showBoundaries, showQuakes, mode]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-orange-100 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🌍 Plate Tectonics & Earthquakes</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Tectonic boundary interactions</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-orange-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
            <button onClick={() => { timeRef.current = 0; quakesRef.current = []; }} className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Boundary Type</h4>
            {(['divergent','convergent','transform'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); timeRef.current = 0; quakesRef.current = []; }} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${mode===m?'bg-orange-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {m === 'divergent' ? '↔ Divergent' : m === 'convergent' ? '→← Convergent' : '⇄ Transform'}
              </button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
              <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-orange-500"/>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showQuakes} onChange={e=>setShowQuakes(e.target.checked)} className="accent-red-500 w-3 h-3"/>Show earthquakes
            </label>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/> Info</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
              {mode === 'divergent' && <p>Plates move apart, magma rises to form new crust. Creates mid-ocean ridges and rift valleys.</p>}
              {mode === 'convergent' && <p>Denser oceanic plate subducts under continental plate. Creates mountains, volcanoes, and deep trenches.</p>}
              {mode === 'transform' && <p>Plates slide past each other horizontally. Builds stress that releases as earthquakes (e.g. San Andreas Fault).</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
