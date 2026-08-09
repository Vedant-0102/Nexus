import React, { useRef, useEffect, useState } from 'react';
import { Plus, Minus, Trash2, Info } from 'lucide-react';

interface Charge {
  x: number; // fraction of canvas width (0..1) so charges survive resizes
  y: number;
  q: number;
  id: number;
}

export const ElectricFieldVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);
  const [charges, setCharges] = useState<Charge[]>([
    { x: 0.35, y: 0.5, q: 1, id: 1 },
    { x: 0.65, y: 0.5, q: -1, id: 2 },
  ]);
  const [chargeType, setChargeType] = useState<'positive' | 'negative'>('positive');
  const [magnitude, setMagnitude] = useState(1);
  const [showPotential, setShowPotential] = useState(false);

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

    const toPx = (c: Charge, w: number, h: number) => ({ x: c.x * w, y: c.y * h });

    const fieldAt = (x: number, y: number, w: number, h: number) => {
      let Ex = 0, Ey = 0, V = 0;
      charges.forEach(c => {
        const p = toPx(c, w, h);
        const dx = x - p.x, dy = y - p.y;
        const r = Math.hypot(dx, dy);
        if (r > 2) {
          const k = (c.q * 3000) / (r * r * r);
          Ex += k * dx; Ey += k * dy;
          V += (c.q * 100) / r;
        }
      });
      return { Ex, Ey, V };
    };

    const getMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };
    const chargeAt = (x: number, y: number, w: number, h: number) =>
      charges.find(c => Math.hypot(x - c.x * w, y - c.y * h) < 18);

    const onDown = (e: MouseEvent) => {
      const m = getMouse(e);
      const hit = chargeAt(m.x, m.y, m.w, m.h);
      dragRef.current = hit ? { id: hit.id, moved: false } : null;
    };
    const onMove = (e: MouseEvent) => {
      const m = getMouse(e);
      mouseRef.current = { x: m.x, y: m.y };
      if (dragRef.current) {
        dragRef.current.moved = true;
        const id = dragRef.current.id;
        setCharges(cs => cs.map(c => c.id === id
          ? { ...c, x: Math.max(0.03, Math.min(0.97, m.x / m.w)), y: Math.max(0.03, Math.min(0.97, m.y / m.h)) }
          : c));
      }
    };
    const onUp = (e: MouseEvent) => {
      const m = getMouse(e);
      const wasDrag = dragRef.current;
      dragRef.current = null;
      if (wasDrag) return; // finished dragging (or clicked a charge) — don't add
      if (m.x < 0 || m.y < 0 || m.x > m.w || m.y > m.h) return;
      setCharges(cs => [...cs, {
        x: m.x / m.w, y: m.y / m.h,
        q: (chargeType === 'positive' ? 1 : -1) * magnitude,
        id: Date.now(),
      }]);
    };
    const onLeave = () => { mouseRef.current = null; };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onLeave);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);

      // Potential heatmap — fillRect blocks respect ctx.scale, so this stays DPI-correct
      if (showPotential && charges.length > 0) {
        const res = 8;
        for (let y = 0; y < h; y += res) {
          for (let x = 0; x < w; x += res) {
            const { V } = fieldAt(x + res / 2, y + res / 2, w, h);
            const n = Math.tanh(V / 4);
            if (Math.abs(n) < 0.02) continue;
            ctx.fillStyle = n > 0 ? `rgba(248,113,113,${n * 0.35})` : `rgba(96,165,250,${-n * 0.35})`;
            ctx.fillRect(x, y, res, res);
          }
        }
      }

      // Field lines: forward from + charges, backward from − charges, so any
      // arrangement (including negative-only) shows its field
      const traceLine = (sx: number, sy: number, dir: 1 | -1) => {
        ctx.strokeStyle = isDark ? 'rgba(250,204,21,0.45)' : 'rgba(180,120,10,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        let x = sx, y = sy;
        ctx.moveTo(x, y);
        const pts: { x: number; y: number }[] = [];
        for (let step = 0; step < 300; step++) {
          const { Ex, Ey } = fieldAt(x, y, w, h);
          const mag = Math.hypot(Ex, Ey);
          if (mag < 1e-6 || x < -20 || x > w + 20 || y < -20 || y > h + 20) break;
          x += dir * (Ex / mag) * 4;
          y += dir * (Ey / mag) * 4;
          ctx.lineTo(x, y);
          pts.push({ x, y });
          const hit = charges.find(c => Math.hypot(x - c.x * w, y - c.y * h) < 14);
          if (hit) break;
        }
        ctx.stroke();
        // Direction arrowhead a third of the way along (always pointing along E)
        const i = Math.floor(pts.length / 3);
        if (i > 1) {
          const p = pts[i], q = pts[i - 1];
          const from = dir === 1 ? q : p, to = dir === 1 ? p : q;
          const ang = Math.atan2(to.y - from.y, to.x - from.x);
          ctx.fillStyle = isDark ? 'rgba(250,204,21,0.7)' : 'rgba(180,120,10,0.7)';
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(to.x - 6 * Math.cos(ang - 0.4), to.y - 6 * Math.sin(ang - 0.4));
          ctx.lineTo(to.x - 6 * Math.cos(ang + 0.4), to.y - 6 * Math.sin(ang + 0.4));
          ctx.closePath(); ctx.fill();
        }
      };

      charges.forEach(c => {
        const p = toPx(c, w, h);
        const numLines = Math.round(8 + 4 * Math.abs(c.q)); // line density ∝ charge
        for (let i = 0; i < numLines; i++) {
          const a = (i / numLines) * Math.PI * 2;
          traceLine(p.x + Math.cos(a) * 17, p.y + Math.sin(a) * 17, c.q > 0 ? 1 : -1);
        }
      });

      // Charges
      charges.forEach(c => {
        const p = toPx(c, w, h);
        const rad = 12 + 3 * Math.abs(c.q);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 2);
        const col = c.q > 0 ? '248,113,113' : '96,165,250';
        glow.addColorStop(0, `rgba(${col},0.35)`); glow.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(p.x, p.y, rad * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.q > 0 ? '#f87171' : '#60a5fa';
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = `bold ${12 + 2 * Math.abs(c.q)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.q > 0 ? '+' : '−', p.x, p.y + 1);
        ctx.textBaseline = 'alphabetic';
      });

      // Field probe at the cursor
      const m = mouseRef.current;
      if (m && charges.length > 0 && !dragRef.current && !chargeAt(m.x, m.y, w, h)) {
        const { Ex, Ey, V } = fieldAt(m.x, m.y, w, h);
        const mag = Math.hypot(Ex, Ey);
        if (mag > 1e-5) {
          const len = Math.min(40, 10 + mag * 400);
          const ux = Ex / mag, uy = Ey / mag;
          ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + ux * len, m.y + uy * len); ctx.stroke();
          const ang = Math.atan2(uy, ux);
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.moveTo(m.x + ux * len, m.y + uy * len);
          ctx.lineTo(m.x + ux * len - 8 * Math.cos(ang - 0.4), m.y + uy * len - 8 * Math.sin(ang - 0.4));
          ctx.lineTo(m.x + ux * len - 8 * Math.cos(ang + 0.4), m.y + uy * len - 8 * Math.sin(ang + 0.4));
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = isDark ? 'rgba(20,25,50,0.85)' : 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.roundRect(m.x + 12, m.y - 34, 132, 28, 4); ctx.fill();
          ctx.fillStyle = '#34d399'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
          ctx.fillText(`|E| = ${(mag * 1000).toFixed(1)} (rel.)`, m.x + 18, m.y - 22);
          ctx.fillStyle = V >= 0 ? '#f87171' : '#60a5fa';
          ctx.fillText(`V  = ${V.toFixed(2)} (rel.)`, m.x + 18, m.y - 11);
        }
      }

      if (charges.length === 0) {
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(30,40,80,0.4)';
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Click anywhere to place a charge · drag charges to move them', w / 2, h / 2);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, [charges, chargeType, magnitude, showPotential]);

  const loadPreset = (preset: 'dipole' | 'like' | 'quad') => {
    if (preset === 'dipole') setCharges([{ x: 0.35, y: 0.5, q: 1, id: 1 }, { x: 0.65, y: 0.5, q: -1, id: 2 }]);
    else if (preset === 'like') setCharges([{ x: 0.35, y: 0.5, q: 1, id: 1 }, { x: 0.65, y: 0.5, q: 1, id: 2 }]);
    else setCharges([
      { x: 0.35, y: 0.35, q: 1, id: 1 }, { x: 0.65, y: 0.35, q: -1, id: 2 },
      { x: 0.35, y: 0.65, q: -1, id: 3 }, { x: 0.65, y: 0.65, q: 1, id: 4 },
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-yellow-50 dark:from-gray-950 dark:to-yellow-950/40 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚡ Electric Field Visualizer</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Click to place charges, drag to move them — the green probe follows your cursor</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Place Charges</h4>
            <div className="flex gap-1">
              <button onClick={() => setChargeType('positive')} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${chargeType === 'positive' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                <Plus className="h-3 w-3" />Positive
              </button>
              <button onClick={() => setChargeType('negative')} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${chargeType === 'negative' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                <Minus className="h-3 w-3" />Negative
              </button>
            </div>
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Magnitude</span><span>{magnitude}q</span></label>
            <input type="range" min={1} max={3} step={1} value={magnitude} onChange={e => setMagnitude(+e.target.value)} className="w-full h-1 accent-yellow-500" />
            <button onClick={() => setCharges([])} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]">
              <Trash2 className="h-3 w-3" />Clear All
            </button>
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Presets</h4>
            <button onClick={() => loadPreset('dipole')} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Dipole (+ / −)</button>
            <button onClick={() => loadPreset('like')} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Two like charges (+ / +)</button>
            <button onClick={() => loadPreset('quad')} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Quadrupole</button>
          </div>

          <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer px-1">
            <input type="checkbox" checked={showPotential} onChange={e => setShowPotential(e.target.checked)} className="accent-yellow-500 w-3 h-3" />
            Show potential heatmap
          </label>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />Reading Field Lines</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
              <p>Arrows show the push on a <strong>positive</strong> test charge: out of +, into −. Where lines crowd together the field is strong.</p>
              <p className="font-mono bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-0.5">E = kq/r² · V = kq/r</p>
              <p>The heatmap shows potential V: <span className="text-red-400">red hills</span> around +, <span className="text-blue-400">blue wells</span> around −. Field lines run downhill.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
