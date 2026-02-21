import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Node { x: number; y: number; fixed: boolean; fx: number; fy: number; }
interface Beam { a: number; b: number; stress: number; force: number; }

export const BridgeStress: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [bridgeType, setBridgeType] = useState<'truss' | 'arch' | 'suspension'>('truss');
  const [loadPos, setLoadPos] = useState(0.5);
  const [loadMag, setLoadMag] = useState(50);
  const [gravity, setGravity] = useState(9.81);
  const [showForces, setShowForces] = useState(true);
  const [showStress, setShowStress] = useState(true);
  const [material, setMaterial] = useState<'steel' | 'wood' | 'concrete'>('steel');

  const materialProps: Record<string, { yield: number; color: string; E: number }> = {
    steel: { yield: 250, color: 'rgba(150,180,220,0.8)', E: 200 },
    wood: { yield: 40, color: 'rgba(180,140,80,0.8)', E: 12 },
    concrete: { yield: 30, color: 'rgba(160,160,160,0.8)', E: 30 },
  };

  const buildBridge = useCallback((w: number, h: number) => {
    const nodes: Node[] = [];
    const beams: Beam[] = [];
    const cx = w / 2, baseY = h * 0.65;
    const spanW = w * 0.7;
    const segments = 6;

    if (bridgeType === 'truss') {
      // Bottom chord
      for (let i = 0; i <= segments; i++) {
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: baseY, fixed: i === 0 || i === segments, fx: 0, fy: 0 });
      }
      // Top chord
      for (let i = 1; i < segments; i++) {
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: baseY - h * 0.2, fixed: false, fx: 0, fy: 0 });
      }
      // Bottom beams
      for (let i = 0; i < segments; i++) beams.push({ a: i, b: i + 1, stress: 0, force: 0 });
      // Top beams
      for (let i = 0; i < segments - 2; i++) beams.push({ a: segments + 1 + i, b: segments + 2 + i, stress: 0, force: 0 });
      // Verticals & diagonals
      for (let i = 1; i < segments; i++) {
        beams.push({ a: i, b: segments + i, stress: 0, force: 0 });
        if (i < segments - 1) beams.push({ a: i, b: segments + i + 1, stress: 0, force: 0 });
      }
    } else if (bridgeType === 'arch') {
      for (let i = 0; i <= segments; i++) {
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: baseY, fixed: i === 0 || i === segments, fx: 0, fy: 0 });
      }
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const archY = baseY - h * 0.25 * Math.sin(t * Math.PI);
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: archY, fixed: i === 0 || i === segments, fx: 0, fy: 0 });
      }
      for (let i = 0; i < segments; i++) { beams.push({ a: i, b: i + 1, stress: 0, force: 0 }); beams.push({ a: segments + 1 + i, b: segments + 2 + i, stress: 0, force: 0 }); }
      for (let i = 0; i <= segments; i++) beams.push({ a: i, b: segments + 1 + i, stress: 0, force: 0 });
    } else {
      // Suspension
      for (let i = 0; i <= segments; i++) {
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: baseY, fixed: i === 0 || i === segments, fx: 0, fy: 0 });
      }
      // Cable
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const cableY = baseY - h * 0.35 + h * 0.15 * Math.pow(2 * t - 1, 2);
        nodes.push({ x: cx - spanW / 2 + (i * spanW / segments), y: cableY, fixed: i === 0 || i === segments, fx: 0, fy: 0 });
      }
      for (let i = 0; i < segments; i++) { beams.push({ a: i, b: i + 1, stress: 0, force: 0 }); beams.push({ a: segments + 1 + i, b: segments + 2 + i, stress: 0, force: 0 }); }
      for (let i = 0; i <= segments; i++) beams.push({ a: i, b: segments + 1 + i, stress: 0, force: 0 });
      // Tower nodes
      const t1 = 1, t2 = segments - 1;
      nodes.push({ x: nodes[t1].x, y: baseY - h * 0.4, fixed: true, fx: 0, fy: 0 });
      nodes.push({ x: nodes[t2].x, y: baseY - h * 0.4, fixed: true, fx: 0, fy: 0 });
      beams.push({ a: t1, b: nodes.length - 2, stress: 0, force: 0 });
      beams.push({ a: t2, b: nodes.length - 1, stress: 0, force: 0 });
    }
    return { nodes, beams };
  }, [bridgeType]);

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

      const { nodes, beams } = buildBridge(w, h);
      const mat = materialProps[material];

      // Apply load
      const loadNodeIdx = Math.round(loadPos * 6);
      if (loadNodeIdx >= 0 && loadNodeIdx < nodes.length) {
        nodes[loadNodeIdx].fy = loadMag * gravity * 0.1;
      }

      // Simple stress calc: distribute load through beams
      beams.forEach(beam => {
        const na = nodes[beam.a], nb = nodes[beam.b];
        const dx = nb.x - na.x, dy = nb.y - na.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const loadNode = nodes[loadNodeIdx];
        if (loadNode) {
          const dA = Math.sqrt((na.x - loadNode.x) ** 2 + (na.y - loadNode.y) ** 2);
          const dB = Math.sqrt((nb.x - loadNode.x) ** 2 + (nb.y - loadNode.y) ** 2);
          const proximity = 1 / (1 + Math.min(dA, dB) / 50);
          beam.force = loadMag * proximity * (dy < 0 ? -1 : 1) * 0.3;
          beam.stress = Math.abs(beam.force) / (len * 0.01);
        }
      });

      // Draw ground
      ctx.fillStyle = 'rgba(40,50,30,0.3)';
      ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.strokeStyle = 'rgba(80,100,60,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, h * 0.7); ctx.lineTo(w, h * 0.7); ctx.stroke();

      // Draw supports
      nodes.forEach(n => {
        if (n.fixed) {
          ctx.fillStyle = 'rgba(100,100,100,0.5)';
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.x - 10, n.y + 15); ctx.lineTo(n.x + 10, n.y + 15); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(100,100,100,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
          // Ground hatch
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath(); ctx.moveTo(n.x - 10 + i * 5, n.y + 15); ctx.lineTo(n.x - 15 + i * 5, n.y + 22); ctx.stroke();
          }
        }
      });

      // Draw beams
      beams.forEach(beam => {
        const na = nodes[beam.a], nb = nodes[beam.b];
        const stressRatio = Math.min(1, beam.stress / (mat.yield * 0.8));

        if (showStress) {
          const r = Math.floor(stressRatio * 255);
          const g = Math.floor((1 - stressRatio) * 200);
          ctx.strokeStyle = `rgba(${r},${g},50,0.8)`;
        } else {
          ctx.strokeStyle = mat.color;
        }
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();

        // Stress danger indicator
        if (beam.stress > mat.yield) {
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
          ctx.fillStyle = 'rgba(255,50,50,0.8)'; ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center'; ctx.fillText('⚠', mx, my - 6);
        }

        // Force arrows
        if (showForces && Math.abs(beam.force) > 2) {
          const mx = (na.x + nb.x) / 2, my = (na.y + nb.y) / 2;
          const dx = nb.x - na.x, dy = nb.y - na.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 0) {
            const arrowLen = Math.min(15, Math.abs(beam.force) * 0.3);
            const dir = beam.force > 0 ? 1 : -1;
            ctx.strokeStyle = beam.force > 0 ? 'rgba(255,100,100,0.5)' : 'rgba(100,100,255,0.5)';
            ctx.lineWidth = 1;
            const ax = mx + dir * (dx / len) * arrowLen, ay = my + dir * (dy / len) * arrowLen;
            ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(ax, ay); ctx.stroke();
          }
        }
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        ctx.fillStyle = n.fixed ? 'rgba(200,200,200,0.6)' : 'rgba(100,200,255,0.7)';
        ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
      });

      // Draw load
      const loadX = (w * 0.15) + loadPos * (w * 0.7);
      const loadY = nodes[loadNodeIdx]?.y || h * 0.65;
      ctx.strokeStyle = 'rgba(255,80,80,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(loadX, loadY - 50); ctx.lineTo(loadX, loadY - 5); ctx.stroke();
      ctx.fillStyle = 'rgba(255,80,80,0.7)';
      ctx.beginPath(); ctx.moveTo(loadX, loadY - 5); ctx.lineTo(loadX - 6, loadY - 15); ctx.lineTo(loadX + 6, loadY - 15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,80,80,0.6)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${loadMag} kN`, loadX, loadY - 55);

      // Title
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${bridgeType.charAt(0).toUpperCase() + bridgeType.slice(1)} Bridge — ${material.charAt(0).toUpperCase() + material.slice(1)}`, w / 2, 18);

      // Max stress indicator
      const maxStress = beams.reduce((m, b) => Math.max(m, b.stress), 0);
      const safetyFactor = maxStress > 0 ? mat.yield / maxStress : Infinity;
      ctx.textAlign = 'left'; ctx.font = '9px monospace';
      ctx.fillStyle = safetyFactor > 2 ? 'rgba(100,255,100,0.6)' : safetyFactor > 1 ? 'rgba(255,200,50,0.6)' : 'rgba(255,80,80,0.6)';
      ctx.fillText(`Max Stress: ${maxStress.toFixed(1)} MPa | Yield: ${mat.yield} MPa | Safety: ${safetyFactor === Infinity ? '∞' : safetyFactor.toFixed(1)}x`, 10, h - 8);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [bridgeType, loadPos, loadMag, gravity, showForces, showStress, material, buildBridge]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-orange-100 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🌉 Bridge Stress Tester</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Load analysis & structural stress</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[190px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Bridge Type</h4>
            {(['truss', 'arch', 'suspension'] as const).map(t => (
              <button key={t} onClick={() => setBridgeType(t)} className={`block w-full text-left px-2 py-1 rounded text-[10px] capitalize ${bridgeType===t?'bg-orange-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{t}</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Material</h4>
            {(['steel', 'wood', 'concrete'] as const).map(m => (
              <button key={m} onClick={() => setMaterial(m)} className={`block w-full text-left px-2 py-1 rounded text-[10px] capitalize ${material===m?'bg-amber-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{m}</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Load Position</span><span>{(loadPos*100).toFixed(0)}%</span></label>
            <input type="range" min={0} max={1} step={0.01} value={loadPos} onChange={e=>setLoadPos(+e.target.value)} className="w-full h-1 accent-red-500"/>
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Load (kN)</span><span>{loadMag}</span></label>
            <input type="range" min={1} max={200} step={1} value={loadMag} onChange={e=>setLoadMag(+e.target.value)} className="w-full h-1 accent-red-500"/>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showStress} onChange={e=>setShowStress(e.target.checked)} className="accent-orange-500"/>Show Stress Colors
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showForces} onChange={e=>setShowForces(e.target.checked)} className="accent-blue-500"/>Show Forces
            </label>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>About</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">Green=low stress, Red=high stress. Warning shown when stress exceeds material yield strength.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
