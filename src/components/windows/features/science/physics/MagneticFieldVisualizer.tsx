import React, { useRef, useEffect, useState } from 'react';
import { Trash2, Info } from 'lucide-react';

interface Magnet {
  x: number; // fraction of canvas size (0..1)
  y: number;
  angle: number;
  id: number;
}

const MAGNET_HALF = 40; // px from center to each pole

export const MagneticFieldVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);
  const [magnets, setMagnets] = useState<Magnet[]>([{ x: 0.5, y: 0.5, angle: 0, id: 1 }]);
  const [showCompass, setShowCompass] = useState(true);

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

    const poles = (m: Magnet, w: number, h: number) => {
      const rad = (m.angle * Math.PI) / 180;
      const cx = m.x * w, cy = m.y * h;
      return {
        cx, cy, rad,
        northX: cx - MAGNET_HALF * Math.cos(rad), northY: cy - MAGNET_HALF * Math.sin(rad),
        southX: cx + MAGNET_HALF * Math.cos(rad), southY: cy + MAGNET_HALF * Math.sin(rad),
      };
    };

    const fieldAt = (x: number, y: number, w: number, h: number) => {
      let Bx = 0, By = 0;
      magnets.forEach(m => {
        const p = poles(m, w, h);
        const dxN = x - p.northX, dyN = y - p.northY;
        const rN = Math.hypot(dxN, dyN);
        const dxS = x - p.southX, dyS = y - p.southY;
        const rS = Math.hypot(dxS, dyS);
        if (rN > 1) { const k = 1 / (rN * rN * rN); Bx += k * dxN; By += k * dyN; }
        if (rS > 1) { const k = -1 / (rS * rS * rS); Bx += k * dxS; By += k * dyS; }
      });
      return { Bx, By };
    };

    const getMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };
    const magnetAt = (x: number, y: number, w: number, h: number) =>
      magnets.find(m => Math.hypot(x - m.x * w, y - m.y * h) < MAGNET_HALF + 10);

    const onDown = (e: MouseEvent) => {
      const m = getMouse(e);
      const hit = magnetAt(m.x, m.y, m.w, m.h);
      dragRef.current = hit ? { id: hit.id, moved: false } : null;
    };
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const m = getMouse(e);
      dragRef.current.moved = true;
      const id = dragRef.current.id;
      setMagnets(ms => ms.map(mg => mg.id === id
        ? { ...mg, x: Math.max(0.05, Math.min(0.95, m.x / m.w)), y: Math.max(0.05, Math.min(0.95, m.y / m.h)) }
        : mg));
    };
    const onUp = (e: MouseEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      const m = getMouse(e);
      if (drag && !drag.moved) {
        // Plain click on a magnet rotates it 45°
        setMagnets(ms => ms.map(mg => mg.id === drag.id ? { ...mg, angle: (mg.angle + 45) % 360 } : mg));
        return;
      }
      if (drag) return;
      if (m.x < 0 || m.y < 0 || m.x > m.w || m.y > m.h) return;
      setMagnets(ms => [...ms, { x: m.x / m.w, y: m.y / m.h, angle: 0, id: Date.now() }]);
    };
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);

      // Field lines seeded around every N pole (traced with the field) and S pole (against it)
      const lineCol = isDark ? 'rgba(52,211,153,0.4)' : 'rgba(5,150,105,0.4)';
      const traceLine = (sx: number, sy: number, dir: 1 | -1) => {
        ctx.strokeStyle = lineCol; ctx.lineWidth = 1.2;
        ctx.beginPath();
        let x = sx, y = sy;
        ctx.moveTo(x, y);
        const pts: { x: number; y: number }[] = [];
        for (let step = 0; step < 400; step++) {
          const { Bx, By } = fieldAt(x, y, w, h);
          const mag = Math.hypot(Bx, By);
          if (mag < 1e-7 || x < -20 || x > w + 20 || y < -20 || y > h + 20) break;
          x += dir * (Bx / mag) * 3;
          y += dir * (By / mag) * 3;
          ctx.lineTo(x, y);
          pts.push({ x, y });
          const nearPole = magnets.some(mg => {
            const p = poles(mg, w, h);
            return Math.hypot(x - p.southX, y - p.southY) < 10 || Math.hypot(x - p.northX, y - p.northY) < 10;
          });
          if (step > 8 && nearPole) break;
        }
        ctx.stroke();
        const i = Math.floor(pts.length / 2);
        if (i > 1) {
          const p = pts[i], q = pts[i - 1];
          const from = dir === 1 ? q : p, to = dir === 1 ? p : q;
          const ang = Math.atan2(to.y - from.y, to.x - from.x);
          ctx.fillStyle = isDark ? 'rgba(52,211,153,0.7)' : 'rgba(5,150,105,0.7)';
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(to.x - 6 * Math.cos(ang - 0.4), to.y - 6 * Math.sin(ang - 0.4));
          ctx.lineTo(to.x - 6 * Math.cos(ang + 0.4), to.y - 6 * Math.sin(ang + 0.4));
          ctx.closePath(); ctx.fill();
        }
      };
      magnets.forEach(mg => {
        const p = poles(mg, w, h);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          traceLine(p.northX + Math.cos(a) * 12, p.northY + Math.sin(a) * 12, 1);
        }
      });

      // Compass grid — each needle aligns with the local field, like iron filings
      if (showCompass && magnets.length > 0) {
        const spacing = 42;
        for (let y = spacing; y < h; y += spacing) {
          for (let x = spacing; x < w; x += spacing) {
            const { Bx, By } = fieldAt(x, y, w, h);
            const mag = Math.hypot(Bx, By);
            if (mag < 1e-7) continue;
            const ang = Math.atan2(By, Bx);
            const len = Math.min(13, 4 + mag * 40000);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(ang);
            ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
            ctx.strokeStyle = '#60a5fa';
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-len / 2, 0); ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Magnets
      magnets.forEach(mg => {
        const p = poles(mg, w, h);
        ctx.save();
        ctx.translate(p.cx, p.cy);
        ctx.rotate(p.rad);
        const bw = MAGNET_HALF * 2, bh = 28;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-bw / 2, -bh / 2, bw / 2, bh);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(0, -bh / 2, bw / 2, bh);
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('N', -bw / 4, 0);
        ctx.fillText('S', bw / 4, 0);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
      });

      if (magnets.length === 0) {
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(30,40,80,0.4)';
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Click anywhere to place a bar magnet', w / 2, h / 2);
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
    };
  }, [magnets, showCompass]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-emerald-50 dark:from-gray-950 dark:to-emerald-950/40 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🧲 Magnetic Field Visualizer</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Click empty space to add a magnet · drag to move · click a magnet to rotate it 45°</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full cursor-pointer" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Magnets: {magnets.length}</h4>
            <button onClick={() => setMagnets([])} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]">
              <Trash2 className="h-3 w-3" />Clear All
            </button>
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showCompass} onChange={e => setShowCompass(e.target.checked)} className="accent-emerald-500 w-3 h-3" />
              Compass grid ("iron filings")
            </label>
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Experiments</h4>
            <button onClick={() => setMagnets([{ x: 0.35, y: 0.5, angle: 0, id: 1 }, { x: 0.65, y: 0.5, angle: 0, id: 2 }])} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Attracting pair (N→S)</button>
            <button onClick={() => setMagnets([{ x: 0.35, y: 0.5, angle: 0, id: 1 }, { x: 0.65, y: 0.5, angle: 180, id: 2 }])} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Repelling pair (S←→S)</button>
            <button onClick={() => setMagnets([{ x: 0.5, y: 0.35, angle: 0, id: 1 }, { x: 0.5, y: 0.65, angle: 90, id: 2 }])} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">Perpendicular pair</button>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />Field Lines</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
              <p>Outside a magnet, field lines run <strong className="text-red-400">N</strong> → <strong className="text-blue-400">S</strong>. They never cross, and denser lines mean a stronger field.</p>
              <p>The compass needles show what iron filings do: each aligns with the local field direction.</p>
              <p>Unlike electric charges, magnetic poles always come in N–S pairs — cut a magnet in half and you get two smaller magnets, never a lone pole.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
