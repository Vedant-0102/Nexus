import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface TrussNode { x: number; y: number; fixed: boolean; fixedX: boolean; fixedY: boolean; loadX: number; loadY: number; }
interface TrussMember { a: number; b: number; force: number; }

export const TrussAnalysis: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [preset, setPreset] = useState(0);
  const [loadMag, setLoadMag] = useState(50);
  const [loadNode, setLoadNode] = useState(2);
  const [showForceValues, setShowForceValues] = useState(true);
  const [showReactions, setShowReactions] = useState(true);

  const presets = [
    {
      name: 'Warren Truss',
      build: (w: number, h: number) => {
        const nodes: TrussNode[] = [];
        const members: TrussMember[] = [];
        const cx = w / 2, baseY = h * 0.6;
        const span = w * 0.65, panels = 4;
        const trussH = h * 0.2;

        // Bottom chord
        for (let i = 0; i <= panels; i++) {
          nodes.push({ x: cx - span / 2 + (i / panels) * span, y: baseY, fixed: i === 0, fixedX: i === 0, fixedY: i === 0 || i === panels, loadX: 0, loadY: 0 });
        }
        // Top chord
        for (let i = 0; i < panels; i++) {
          nodes.push({ x: cx - span / 2 + ((i + 0.5) / panels) * span, y: baseY - trussH, fixed: false, fixedX: false, fixedY: false, loadX: 0, loadY: 0 });
        }
        // Bottom beams
        for (let i = 0; i < panels; i++) members.push({ a: i, b: i + 1, force: 0 });
        // Top beams
        for (let i = 0; i < panels - 1; i++) members.push({ a: panels + 1 + i, b: panels + 2 + i, force: 0 });
        // Diagonals (Warren pattern - alternating)
        for (let i = 0; i < panels; i++) {
          members.push({ a: i, b: panels + 1 + i, force: 0 });
          members.push({ a: i + 1, b: panels + 1 + i, force: 0 });
        }
        return { nodes, members };
      },
    },
    {
      name: 'Pratt Truss',
      build: (w: number, h: number) => {
        const nodes: TrussNode[] = [];
        const members: TrussMember[] = [];
        const cx = w / 2, baseY = h * 0.6;
        const span = w * 0.65, panels = 4;
        const trussH = h * 0.2;

        // Bottom
        for (let i = 0; i <= panels; i++) {
          nodes.push({ x: cx - span / 2 + (i / panels) * span, y: baseY, fixed: i === 0, fixedX: i === 0, fixedY: i === 0 || i === panels, loadX: 0, loadY: 0 });
        }
        // Top
        for (let i = 0; i <= panels; i++) {
          nodes.push({ x: cx - span / 2 + (i / panels) * span, y: baseY - trussH, fixed: false, fixedX: false, fixedY: false, loadX: 0, loadY: 0 });
        }
        // Bottom beams
        for (let i = 0; i < panels; i++) members.push({ a: i, b: i + 1, force: 0 });
        // Top beams
        for (let i = 0; i < panels; i++) members.push({ a: panels + 1 + i, b: panels + 2 + i, force: 0 });
        // Verticals
        for (let i = 0; i <= panels; i++) members.push({ a: i, b: panels + 1 + i, force: 0 });
        // Diagonals (Pratt: diagonals slope toward center)
        for (let i = 0; i < panels; i++) {
          if (i < panels / 2) members.push({ a: i + 1, b: panels + 1 + i, force: 0 });
          else members.push({ a: i, b: panels + 2 + i, force: 0 });
        }
        return { nodes, members };
      },
    },
    {
      name: 'Howe Truss',
      build: (w: number, h: number) => {
        const nodes: TrussNode[] = [];
        const members: TrussMember[] = [];
        const cx = w / 2, baseY = h * 0.6;
        const span = w * 0.65, panels = 4;
        const trussH = h * 0.2;

        for (let i = 0; i <= panels; i++) {
          nodes.push({ x: cx - span / 2 + (i / panels) * span, y: baseY, fixed: i === 0, fixedX: i === 0, fixedY: i === 0 || i === panels, loadX: 0, loadY: 0 });
        }
        for (let i = 0; i <= panels; i++) {
          nodes.push({ x: cx - span / 2 + (i / panels) * span, y: baseY - trussH, fixed: false, fixedX: false, fixedY: false, loadX: 0, loadY: 0 });
        }
        for (let i = 0; i < panels; i++) members.push({ a: i, b: i + 1, force: 0 });
        for (let i = 0; i < panels; i++) members.push({ a: panels + 1 + i, b: panels + 2 + i, force: 0 });
        for (let i = 0; i <= panels; i++) members.push({ a: i, b: panels + 1 + i, force: 0 });
        // Howe diagonals: slope away from center  
        for (let i = 0; i < panels; i++) {
          if (i < panels / 2) members.push({ a: i, b: panels + 2 + i, force: 0 });
          else members.push({ a: i + 1, b: panels + 1 + i, force: 0 });
        }
        return { nodes, members };
      },
    },
  ];

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
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      const { nodes, members } = presets[preset].build(w, h);

      // Apply load
      const ln = Math.min(loadNode, nodes.length - 1);
      nodes[ln].loadY = loadMag;

      // Simple method of joints approximation
      members.forEach(m => {
        const na = nodes[m.a], nb = nodes[m.b];
        const dx = nb.x - na.x, dy = nb.y - na.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        // Approximate force based on load proximity and member orientation
        const loadN = nodes[ln];
        const distA = Math.sqrt((na.x - loadN.x) ** 2 + (na.y - loadN.y) ** 2);
        const distB = Math.sqrt((nb.x - loadN.x) ** 2 + (nb.y - loadN.y) ** 2);
        const proximity = loadMag / (1 + Math.min(distA, distB) / 30);

        if (Math.abs(dy) < 5) { // Horizontal member → tension or compression
          const isTop = (na.y + nb.y) / 2 < h * 0.5;
          m.force = isTop ? -proximity * 0.4 : proximity * 0.5; // top=compression, bottom=tension
        } else if (Math.abs(dx) < 5) { // Vertical
          m.force = -proximity * 0.3;
        } else { // Diagonal
          m.force = (dy < 0 ? -1 : 1) * proximity * 0.35;
        }
      });

      // Ground
      ctx.fillStyle = 'rgba(40,45,30,0.2)'; ctx.fillRect(0, h * 0.65, w, h * 0.35);
      ctx.strokeStyle = 'rgba(80,90,60,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h * 0.65); ctx.lineTo(w, h * 0.65); ctx.stroke();

      // Draw supports
      nodes.forEach(n => {
        if (n.fixedY) {
          ctx.fillStyle = 'rgba(100,100,110,0.4)';
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x - 10, n.y + 15); ctx.lineTo(n.x + 10, n.y + 15); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(100,100,110,0.5)'; ctx.lineWidth = 1; ctx.stroke();
          if (n.fixedX) {
            // Pin support with hatch
            for (let i = -2; i <= 2; i++) {
              ctx.beginPath(); ctx.moveTo(n.x - 10 + i * 5, n.y + 15); ctx.lineTo(n.x - 15 + i * 5, n.y + 22); ctx.stroke();
            }
          } else {
            // Roller support
            ctx.beginPath(); ctx.arc(n.x, n.y + 18, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100,100,110,0.5)'; ctx.fill();
          }
        }
      });

      // Draw members
      const maxForce = members.reduce((m, mb) => Math.max(m, Math.abs(mb.force)), 1);
      members.forEach(m => {
        const na = nodes[m.a], nb = nodes[m.b];
        const ratio = Math.min(1, Math.abs(m.force) / maxForce);
        const isTension = m.force > 0;
        const isCompression = m.force < 0;

        if (isTension) {
          ctx.strokeStyle = `rgba(${50 + ratio * 200}, ${100 - ratio * 80}, ${50}, ${0.4 + ratio * 0.4})`;
        } else {
          ctx.strokeStyle = `rgba(${50}, ${50}, ${100 + ratio * 155}, ${0.4 + ratio * 0.4})`;
        }
        ctx.lineWidth = 2 + ratio * 2;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();

        // Force value
        if (showForceValues && Math.abs(m.force) > 1) {
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
          ctx.fillStyle = isTension ? 'rgba(200,150,50,0.5)' : 'rgba(100,100,255,0.5)';
          ctx.font = '7px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`${m.force.toFixed(0)}`, mx, my - 5);
        }
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        ctx.fillStyle = i === ln ? 'rgba(255,100,100,0.8)' : (isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)');
        ctx.beginPath(); ctx.arc(n.x, n.y, i === ln ? 5 : 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.3)' : 'rgba(30,40,80,0.3)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${i}`, n.x, n.y - 8);
      });

      // Load arrow
      const loadN = nodes[ln];
      if (loadN) {
        ctx.strokeStyle = 'rgba(255,80,80,0.8)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(loadN.x, loadN.y - 50); ctx.lineTo(loadN.x, loadN.y - 8); ctx.stroke();
        ctx.fillStyle = 'rgba(255,80,80,0.8)';
        ctx.beginPath(); ctx.moveTo(loadN.x, loadN.y - 8); ctx.lineTo(loadN.x - 5, loadN.y - 16); ctx.lineTo(loadN.x + 5, loadN.y - 16); ctx.closePath(); ctx.fill();
        ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${loadMag} kN`, loadN.x, loadN.y - 55);
      }

      // Reactions
      if (showReactions) {
        const supportNodes = nodes.filter(n => n.fixedY);
        const totalReaction = loadMag / supportNodes.length;
        supportNodes.forEach(n => {
          ctx.strokeStyle = 'rgba(100,255,100,0.6)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(n.x, n.y + 25); ctx.lineTo(n.x, n.y + 5); ctx.stroke();
          ctx.fillStyle = 'rgba(100,255,100,0.6)';
          ctx.beginPath(); ctx.moveTo(n.x, n.y + 5); ctx.lineTo(n.x - 4, n.y + 12); ctx.lineTo(n.x + 4, n.y + 12); ctx.closePath(); ctx.fill();
          ctx.font = '8px monospace'; ctx.textAlign = 'center';
          ctx.fillText(`${totalReaction.toFixed(0)} kN`, n.x, n.y + 35);
        });
      }

      // Legend
      ctx.fillStyle = isDark ? 'rgba(20,25,50,0.5)' : 'rgba(230,235,245,0.8)'; ctx.fillRect(10, h - 40, 200, 32);
      ctx.fillStyle = 'rgba(200,150,50,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
      ctx.fillRect(15, h - 32, 10, 3); ctx.fillText('Tension (+)', 30, h - 28);
      ctx.fillStyle = 'rgba(100,100,255,0.7)';
      ctx.fillRect(15, h - 20, 10, 3); ctx.fillText('Compression (−)', 30, h - 16);

      // Title
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(presets[preset].name, w / 2, 18);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [preset, loadMag, loadNode, showForceValues, showReactions]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-950 dark:to-slate-800 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🏗️ Truss Analysis</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Structural analysis & member forces</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[190px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Truss Type</h4>
            {presets.map((p, i) => (
              <button key={i} onClick={() => setPreset(i)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${preset===i?'bg-slate-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p.name}</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Load (kN)</span><span>{loadMag}</span></label>
            <input type="range" min={10} max={200} step={5} value={loadMag} onChange={e => setLoadMag(+e.target.value)} className="w-full h-1 accent-red-500"/>
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Load Node</span><span>{loadNode}</span></label>
            <input type="range" min={0} max={8} step={1} value={loadNode} onChange={e => setLoadNode(+e.target.value)} className="w-full h-1 accent-red-500"/>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showForceValues} onChange={e => setShowForceValues(e.target.checked)} className="accent-yellow-500"/>Force Values
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showReactions} onChange={e => setShowReactions(e.target.checked)} className="accent-green-500"/>Reactions
            </label>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-600/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>About</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">Trusses are rigid structures made of triangles. Tension (yellow) pulls members apart; compression (blue) pushes them together.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
