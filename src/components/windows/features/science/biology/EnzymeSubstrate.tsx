import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Substrate { x: number; y: number; vx: number; vy: number; bound: boolean; converted: boolean; timer: number; }
interface Enzyme { x: number; y: number; active: boolean; bindTimer: number; substrate: Substrate | null; angle: number; }

export const EnzymeSubstrate: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({
    enzymes: [] as Enzyme[],
    substrates: [] as Substrate[],
    products: [] as { x: number; y: number; vx: number; vy: number; life: number }[],
    reactionCount: 0,
    time: 0,
    reactionHistory: [] as { t: number; count: number }[],
  });

  const [running, setRunning] = useState(false);
  const [temperature, setTemperature] = useState(37);
  const [pH, setPH] = useState(7);
  const [substrateConc, setSubstrateConc] = useState(20);
  const [enzymeCount, setEnzymeCount] = useState(3);
  const [reactionCount, setReactionCount] = useState(0);
  const [inhibitor, setInhibitor] = useState<'none'|'competitive'|'noncompetitive'>('none');

  const getReactionRate = useCallback(() => {
    let rate = 1.0;
    const tempDiff = Math.abs(temperature - 37);
    rate *= Math.max(0, 1 - (tempDiff / 40) ** 2);
    const phDiff = Math.abs(pH - 7);
    rate *= Math.max(0, 1 - (phDiff / 5) ** 2);
    if (inhibitor === 'competitive') rate *= 0.3;
    if (inhibitor === 'noncompetitive') rate *= 0.5;
    return Math.max(0.05, rate);
  }, [temperature, pH, inhibitor]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const w = r.width, h = r.height;
    const s = stateRef.current;

    s.enzymes = Array.from({ length: enzymeCount }, (_, i) => ({
      x: w * 0.3 + Math.random() * w * 0.4,
      y: h * 0.3 + Math.random() * h * 0.4,
      active: true, bindTimer: 0, substrate: null, angle: Math.random() * Math.PI * 2,
    }));

    s.substrates = Array.from({ length: substrateConc }, () => ({
      x: Math.random() * (w - 40) + 20,
      y: Math.random() * (h - 40) + 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      bound: false, converted: false, timer: 0,
    }));
    s.products = [];
    s.reactionCount = 0;
    s.time = 0;
    s.reactionHistory = [];
    setReactionCount(0);
  }, [enzymeCount, substrateConc]);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d; canvas.height = r.height * d;
      ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);

    const rate = getReactionRate();

    const step = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      const s = stateRef.current;

      if (running) {
        s.time += 1 / 60;
        const speed = 0.5 + (temperature / 37) * 1.5;

        // Move substrates
        s.substrates.forEach(sub => {
          if (sub.bound || sub.converted) return;
          sub.x += sub.vx * speed;
          sub.y += sub.vy * speed;
          sub.vx += (Math.random() - 0.5) * 0.3;
          sub.vy += (Math.random() - 0.5) * 0.3;
          sub.vx = Math.max(-3, Math.min(3, sub.vx));
          sub.vy = Math.max(-3, Math.min(3, sub.vy));
          if (sub.x < 10 || sub.x > w - 10) sub.vx *= -1;
          if (sub.y < 10 || sub.y > h - 10) sub.vy *= -1;
          sub.x = Math.max(10, Math.min(w - 10, sub.x));
          sub.y = Math.max(10, Math.min(h - 10, sub.y));
        });

        // Enzyme-substrate binding
        s.enzymes.forEach(enz => {
          enz.angle += 0.01;
          if (enz.substrate) {
            enz.bindTimer += rate * 0.02;
            enz.substrate.x = enz.x;
            enz.substrate.y = enz.y;
            if (enz.bindTimer >= 1) {
              enz.substrate.converted = true;
              enz.substrate.bound = false;
              s.products.push({ x: enz.x + 15, y: enz.y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 300 });
              s.products.push({ x: enz.x - 15, y: enz.y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 300 });
              enz.substrate = null;
              enz.bindTimer = 0;
              s.reactionCount++;
              setReactionCount(s.reactionCount);
            }
          } else if (enz.active) {
            for (const sub of s.substrates) {
              if (sub.bound || sub.converted) continue;
              const dx = enz.x - sub.x, dy = enz.y - sub.y;
              if (dx * dx + dy * dy < 900) {
                sub.bound = true;
                enz.substrate = sub;
                enz.bindTimer = 0;
                break;
              }
            }
          }
        });

        // Move products
        s.products.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          p.vx *= 0.99; p.vy *= 0.99;
          p.life--;
          if (p.x < 5 || p.x > w - 5) p.vx *= -1;
          if (p.y < 5 || p.y > h - 5) p.vy *= -1;
        });
        s.products = s.products.filter(p => p.life > 0);

        if (Math.floor(s.time * 10) % 5 === 0) {
          s.reactionHistory.push({ t: s.time, count: s.reactionCount });
          if (s.reactionHistory.length > 100) s.reactionHistory.shift();
        }
      }

      // Draw
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      // Rate indicator
      const barH = h - 20;
      ctx.fillStyle = `rgba(${Math.floor(255*(1-rate))},${Math.floor(255*rate)},80,0.15)`;
      ctx.fillRect(w - 25, 10, 15, barH);
      ctx.fillStyle = `rgba(${Math.floor(255*(1-rate))},${Math.floor(255*rate)},80,0.6)`;
      ctx.fillRect(w - 25, 10 + barH * (1 - rate), 15, barH * rate);
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(30,40,80,0.4)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Rate', w - 17, h - 2);

      // Products
      s.products.forEach(p => {
        const alpha = p.life / 300;
        ctx.fillStyle = `rgba(100,220,100,${alpha * 0.7})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 6); ctx.lineTo(p.x + 5, p.y + 3); ctx.lineTo(p.x - 5, p.y + 3); ctx.closePath(); ctx.fill();
      });

      // Substrates
      s.substrates.forEach(sub => {
        if (sub.converted || sub.bound) return;
        ctx.fillStyle = 'rgba(255,180,60,0.8)';
        ctx.fillRect(sub.x - 5, sub.y - 5, 10, 10);
        ctx.strokeStyle = 'rgba(255,200,100,0.4)'; ctx.lineWidth = 1;
        ctx.strokeRect(sub.x - 5, sub.y - 5, 10, 10);
      });

      // Enzymes
      s.enzymes.forEach(enz => {
        const isBinding = enz.substrate !== null;
        const color = inhibitor !== 'none' ? (enz.active ? 'rgba(255,100,100,0.7)' : 'rgba(100,100,100,0.5)') : 'rgba(100,160,255,0.8)';

        // Enzyme body (pac-man like)
        ctx.save();
        ctx.translate(enz.x, enz.y);
        ctx.rotate(enz.angle);
        ctx.beginPath();
        const mouthAngle = isBinding ? 0.05 : 0.4;
        ctx.arc(0, 0, 18, mouthAngle, Math.PI * 2 - mouthAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = 'rgba(150,200,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();

        // Active site
        if (!isBinding) {
          ctx.fillStyle = 'rgba(255,180,60,0.3)';
          ctx.beginPath(); ctx.arc(16, 0, 5, 0, Math.PI * 2); ctx.fill();
        }

        // Binding progress
        if (isBinding) {
          ctx.fillStyle = 'rgba(255,220,100,0.9)';
          ctx.fillRect(-5, -5, 10, 10);
          // Progress ring
          ctx.strokeStyle = 'rgba(100,255,100,0.8)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2 * enz.bindTimer); ctx.stroke();
        }
        ctx.restore();
      });

      // Legend
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,180,60,0.8)'; ctx.fillRect(10, h - 50, 8, 8);
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.fillText('Substrate', 22, h - 43);
      ctx.fillStyle = 'rgba(100,160,255,0.8)'; ctx.beginPath(); ctx.arc(14, h - 30, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.fillText('Enzyme', 22, h - 27);
      ctx.fillStyle = 'rgba(100,220,100,0.7)'; ctx.beginPath(); ctx.moveTo(14, h - 18); ctx.lineTo(18, h - 10); ctx.lineTo(10, h - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.fillText('Product', 22, h - 11);

      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, temperature, pH, inhibitor, getReactionRate]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-emerald-100 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔬 Enzyme-Substrate Interaction</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Lock-and-key model & Michaelis-Menten kinetics</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {running ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Start</>}
            </button>
            <button onClick={init} className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]"><RotateCcw className="h-3 w-3" /></button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Environment</h4>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Temperature</span><span>{temperature}°C</span></label>
              <input type="range" min={0} max={80} value={temperature} onChange={e => setTemperature(+e.target.value)} className="w-full h-1 accent-orange-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>pH</span><span>{pH.toFixed(1)}</span></label>
              <input type="range" min={1} max={14} step={0.5} value={pH} onChange={e => setPH(+e.target.value)} className="w-full h-1 accent-blue-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Substrates</span><span>{substrateConc}</span></label>
              <input type="range" min={5} max={50} value={substrateConc} onChange={e => setSubstrateConc(+e.target.value)} className="w-full h-1 accent-yellow-500" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Enzymes</span><span>{enzymeCount}</span></label>
              <input type="range" min={1} max={8} value={enzymeCount} onChange={e => setEnzymeCount(+e.target.value)} className="w-full h-1 accent-green-500" />
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Inhibitor</h4>
            {(['none','competitive','noncompetitive'] as const).map(i => (
              <button key={i} onClick={() => setInhibitor(i)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${inhibitor===i?'bg-red-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {i === 'none' ? 'None' : i === 'competitive' ? 'Competitive' : 'Non-competitive'}
              </button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Reactions completed: <span className="text-emerald-400 font-bold">{reactionCount}</span></div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Rate efficiency: <span className="text-blue-400 font-bold">{(getReactionRate() * 100).toFixed(0)}%</span></div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> About</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">Enzymes lower activation energy. Substrates fit into the active site (lock-and-key). Temperature and pH affect the enzyme's shape and activity. Inhibitors can block or slow reactions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
