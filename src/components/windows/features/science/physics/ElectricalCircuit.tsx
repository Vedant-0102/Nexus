import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface CircuitNode { id: string; x: number; y: number; voltage: number; }
interface Component { id: string; type: 'resistor' | 'battery' | 'capacitor' | 'led' | 'switch' | 'wire'; from: string; to: string; value: number; on: boolean; }

export const ElectricalCircuit: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [preset, setPreset] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const phaseRef = useRef(0);

  const presets = [
    {
      name: 'Series Circuit',
      nodes: [
        { id: 'A', x: 0.2, y: 0.3, voltage: 9 },
        { id: 'B', x: 0.5, y: 0.3, voltage: 6 },
        { id: 'C', x: 0.8, y: 0.3, voltage: 3 },
        { id: 'D', x: 0.8, y: 0.7, voltage: 0 },
        { id: 'E', x: 0.2, y: 0.7, voltage: 0 },
      ],
      components: [
        { id: 'R1', type: 'resistor' as const, from: 'A', to: 'B', value: 100, on: true },
        { id: 'R2', type: 'resistor' as const, from: 'B', to: 'C', value: 200, on: true },
        { id: 'R3', type: 'resistor' as const, from: 'C', to: 'D', value: 100, on: true },
        { id: 'W1', type: 'wire' as const, from: 'D', to: 'E', value: 0, on: true },
        { id: 'V1', type: 'battery' as const, from: 'E', to: 'A', value: 9, on: true },
      ],
    },
    {
      name: 'Parallel Circuit',
      nodes: [
        { id: 'A', x: 0.2, y: 0.5, voltage: 9 },
        { id: 'B', x: 0.5, y: 0.25, voltage: 0 },
        { id: 'C', x: 0.5, y: 0.5, voltage: 0 },
        { id: 'D', x: 0.5, y: 0.75, voltage: 0 },
        { id: 'E', x: 0.8, y: 0.5, voltage: 0 },
      ],
      components: [
        { id: 'W1', type: 'wire' as const, from: 'A', to: 'B', value: 0, on: true },
        { id: 'W2', type: 'wire' as const, from: 'A', to: 'C', value: 0, on: true },
        { id: 'W3', type: 'wire' as const, from: 'A', to: 'D', value: 0, on: true },
        { id: 'R1', type: 'resistor' as const, from: 'B', to: 'E', value: 100, on: true },
        { id: 'R2', type: 'resistor' as const, from: 'C', to: 'E', value: 200, on: true },
        { id: 'R3', type: 'resistor' as const, from: 'D', to: 'E', value: 300, on: true },
        { id: 'V1', type: 'battery' as const, from: 'E', to: 'A', value: 9, on: true },
      ],
    },
    {
      name: 'LED Circuit',
      nodes: [
        { id: 'A', x: 0.2, y: 0.4, voltage: 5 },
        { id: 'B', x: 0.5, y: 0.4, voltage: 3 },
        { id: 'C', x: 0.7, y: 0.4, voltage: 1.8 },
        { id: 'D', x: 0.7, y: 0.7, voltage: 0 },
        { id: 'E', x: 0.2, y: 0.7, voltage: 0 },
      ],
      components: [
        { id: 'R1', type: 'resistor' as const, from: 'A', to: 'B', value: 220, on: true },
        { id: 'S1', type: 'switch' as const, from: 'B', to: 'C', value: 0, on: true },
        { id: 'L1', type: 'led' as const, from: 'C', to: 'D', value: 1.8, on: true },
        { id: 'W1', type: 'wire' as const, from: 'D', to: 'E', value: 0, on: true },
        { id: 'V1', type: 'battery' as const, from: 'E', to: 'A', value: 5, on: true },
      ],
    },
  ];

  const [circuitData, setCircuitData] = useState(presets[0]);

  useEffect(() => {
    setCircuitData(presets[preset]);
  }, [preset]);

  const toggleSwitch = (compId: string) => {
    setCircuitData(prev => ({
      ...prev,
      components: prev.components.map(c => c.id === compId && c.type === 'switch' ? { ...c, on: !c.on } : c),
    }));
  };

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
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#080c18'; ctx.fillRect(0, 0, w, h);
      if (running) phaseRef.current += dt;
      const phase = phaseRef.current;

      const { nodes, components } = circuitData;
      const circuitOpen = components.some(c => c.type === 'switch' && !c.on);

      // Calculate total resistance and current
      const batteries = components.filter(c => c.type === 'battery');
      const totalV = batteries.reduce((s, b) => s + b.value, 0);
      const resistors = components.filter(c => c.type === 'resistor');
      const totalR = resistors.reduce((s, r) => s + r.value, 0) || 1;
      const current = circuitOpen ? 0 : totalV / totalR;

      const getNodePos = (id: string) => {
        const n = nodes.find(n => n.id === id)!;
        return { x: n.x * w, y: n.y * h };
      };

      // Draw components
      components.forEach(comp => {
        const from = getNodePos(comp.from);
        const to = getNodePos(comp.to);
        const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
        const dx = to.x - from.x, dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / len, ny = dy / len;

        if (comp.type === 'wire') {
          ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
        } else if (comp.type === 'resistor') {
          // Wire to resistor
          ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(mx - nx * 20, my - ny * 20); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx + nx * 20, my + ny * 20); ctx.lineTo(to.x, to.y); ctx.stroke();
          // Zigzag
          ctx.strokeStyle = 'rgba(255,180,80,0.7)'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          const zigLen = 40, zigH = 8, steps = 6;
          for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * zigLen - zigLen / 2;
            const px = mx + nx * t + (i % 2 === 0 ? -ny * zigH : ny * zigH);
            const py = my + ny * t + (i % 2 === 0 ? nx * zigH : -nx * zigH);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.stroke();
          if (showValues) {
            ctx.fillStyle = 'rgba(255,180,80,0.6)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${comp.value}Ω`, mx - ny * 18, my + nx * 18);
          }
        } else if (comp.type === 'battery') {
          ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(mx - nx * 10, my - ny * 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx + nx * 10, my + ny * 10); ctx.lineTo(to.x, to.y); ctx.stroke();
          // Battery symbol
          ctx.strokeStyle = 'rgba(100,255,100,0.7)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(mx - nx * 5 - ny * 12, my - ny * 5 + nx * 12); ctx.lineTo(mx - nx * 5 + ny * 12, my - ny * 5 - nx * 12); ctx.stroke();
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(mx + nx * 5 - ny * 7, my + ny * 5 + nx * 7); ctx.lineTo(mx + nx * 5 + ny * 7, my + ny * 5 - nx * 7); ctx.stroke();
          // + -
          ctx.fillStyle = 'rgba(100,255,100,0.5)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('+', mx + nx * 14 - ny * 15, my + ny * 14 + nx * 15);
          ctx.fillText('−', mx - nx * 14 - ny * 15, my - ny * 14 + nx * 15);
          if (showValues) {
            ctx.fillStyle = 'rgba(100,255,100,0.5)'; ctx.font = '8px monospace';
            ctx.fillText(`${comp.value}V`, mx - ny * 20, my + nx * 20);
          }
        } else if (comp.type === 'led') {
          ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(mx - nx * 10, my - ny * 10); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx + nx * 10, my + ny * 10); ctx.lineTo(to.x, to.y); ctx.stroke();
          // LED triangle
          const glowing = !circuitOpen && current > 0;
          ctx.fillStyle = glowing ? 'rgba(255,50,50,0.6)' : 'rgba(100,50,50,0.3)';
          ctx.beginPath();
          ctx.moveTo(mx - nx * 8 - ny * 8, my - ny * 8 + nx * 8);
          ctx.lineTo(mx - nx * 8 + ny * 8, my - ny * 8 - nx * 8);
          ctx.lineTo(mx + nx * 8, my + ny * 8);
          ctx.closePath(); ctx.fill();
          // Glow
          if (glowing) {
            const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 25);
            grad.addColorStop(0, 'rgba(255,80,80,0.2)'); grad.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(mx, my, 25, 0, Math.PI * 2); ctx.fill();
          }
          if (showValues) {
            ctx.fillStyle = 'rgba(255,100,100,0.5)'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${comp.value}V`, mx - ny * 18, my + nx * 18);
          }
        } else if (comp.type === 'switch') {
          ctx.strokeStyle = 'rgba(100,200,255,0.4)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(mx - nx * 15, my - ny * 15); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(mx + nx * 15, my + ny * 15); ctx.lineTo(to.x, to.y); ctx.stroke();
          // Switch
          if (comp.on) {
            ctx.strokeStyle = 'rgba(100,255,100,0.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(mx - nx * 15, my - ny * 15); ctx.lineTo(mx + nx * 15, my + ny * 15); ctx.stroke();
          } else {
            ctx.strokeStyle = 'rgba(255,100,100,0.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(mx - nx * 15, my - ny * 15);
            ctx.lineTo(mx + nx * 5 - ny * 15, my + ny * 5 + nx * 15); ctx.stroke();
          }
          // Dot contacts
          ctx.fillStyle = 'rgba(200,200,255,0.5)';
          ctx.beginPath(); ctx.arc(mx - nx * 15, my - ny * 15, 3, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(mx + nx * 15, my + ny * 15, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = comp.on ? 'rgba(100,255,100,0.5)' : 'rgba(255,100,100,0.5)';
          ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(comp.on ? 'ON' : 'OFF', mx - ny * 14, my + nx * 14);
        }

        // Current flow (electron animation)
        if (!circuitOpen && current > 0 && comp.type !== 'switch') {
          const numDots = Math.max(1, Math.floor(len / 40));
          for (let i = 0; i < numDots; i++) {
            const t = ((phase * current * 20 + i * (len / numDots)) % len) / len;
            const px = from.x + dx * t, py = from.y + dy * t;
            ctx.fillStyle = 'rgba(80,200,255,0.5)';
            ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const x = n.x * w, y = n.y * h;
        ctx.fillStyle = 'rgba(200,200,255,0.5)';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(200,200,255,0.3)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(n.id, x, y - 8);
      });

      // Info panel
      ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(10, h - 45, w - 20, 38);
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`V = ${totalV}V | R_total = ${totalR}Ω | I = ${(current * 1000).toFixed(1)}mA | P = ${(totalV * current * 1000).toFixed(1)}mW`, 20, h - 25);
      ctx.fillText(`Ohm's Law: V = IR | ${circuitOpen ? '⚡ CIRCUIT OPEN' : '✓ Circuit Closed'}`, 20, h - 13);

      // Title
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(circuitData.name, w / 2, 18);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, circuitData, showValues]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-yellow-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">⚡ Electrical Circuit</h2>
        <p className="text-[11px] text-gray-400">Ohm's Law & circuit analysis</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[190px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-green-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Run</>}
            </button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Circuit</h4>
            {presets.map((p, i) => (
              <button key={i} onClick={() => setPreset(i)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${preset===i?'bg-yellow-700 text-white':'bg-gray-800 text-gray-400'}`}>{p.name}</button>
            ))}
          </div>
          {circuitData.components.filter(c => c.type === 'switch').map(sw => (
            <button key={sw.id} onClick={() => toggleSwitch(sw.id)} className={`w-full px-2 py-1.5 rounded text-[10px] font-medium ${sw.on?'bg-green-700 text-white':'bg-red-800 text-white'}`}>
              {sw.id}: {sw.on ? '🟢 ON' : '🔴 OFF'}
            </button>
          ))}
          <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer px-1">
            <input type="checkbox" checked={showValues} onChange={e => setShowValues(e.target.checked)} className="accent-yellow-500" />Show Values
          </label>
          <div className="bg-yellow-950/30 border border-yellow-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-yellow-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>Ohm's Law</h4>
            <div className="text-[9px] text-gray-400 space-y-0.5">
              <p>V = I × R</p>
              <p>Series: R_total = R₁ + R₂ + ...</p>
              <p>Parallel: 1/R = 1/R₁ + 1/R₂ + ...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
