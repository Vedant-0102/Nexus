import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Info } from 'lucide-react';

type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR';

export const LogicGates: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedGate, setSelectedGate] = useState<GateType>('AND');
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);
  const [mode, setMode] = useState<'sandbox' | 'truth-table'>('truth-table');

  const evaluate = (type: GateType, a: boolean, b: boolean): boolean => {
    switch (type) {
      case 'AND': return a && b;
      case 'OR': return a || b;
      case 'NOT': return !a;
      case 'NAND': return !(a && b);
      case 'NOR': return !(a || b);
      case 'XOR': return a !== b;
      case 'XNOR': return a === b;
    }
  };

  const output = evaluate(selectedGate, inputA, inputB);

  const gateSymbols: Record<GateType, string> = {
    AND: '&', OR: '≥1', NOT: '1', NAND: '&̄', NOR: '≥̄1', XOR: '=1', XNOR: '=̄1',
  };

  const gateExpressions: Record<GateType, string> = {
    AND: 'A · B', OR: 'A + B', NOT: '¬A', NAND: '¬(A · B)', NOR: '¬(A + B)', XOR: 'A ⊕ B', XNOR: '¬(A ⊕ B)',
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

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0e1a'; ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(60,70,100,0.15)';
      for (let x = 0; x < w; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      if (mode === 'truth-table') {
        const cx = w / 2, cy = h * 0.35;
        const gw = 80, gh = 50;
        const isNot = selectedGate === 'NOT';

        // Input wires
        const inputAY = cy - (isNot ? 0 : 12);
        const inputBY = cy + 12;

        // Wire A
        ctx.strokeStyle = inputA ? '#4ade80' : '#444'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - gw - 40, inputAY); ctx.lineTo(cx - gw / 2, inputAY); ctx.stroke();

        // Wire B (not for NOT gate)
        if (!isNot) {
          ctx.strokeStyle = inputB ? '#4ade80' : '#444'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(cx - gw - 40, inputBY); ctx.lineTo(cx - gw / 2, inputBY); ctx.stroke();
        }

        // Output wire
        ctx.strokeStyle = output ? '#4ade80' : '#444'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx + gw / 2, cy); ctx.lineTo(cx + gw + 40, cy); ctx.stroke();

        // Gate body
        ctx.fillStyle = 'rgba(30,40,70,0.9)';
        ctx.strokeStyle = output ? 'rgba(100,220,128,0.6)' : 'rgba(100,130,200,0.4)';
        ctx.lineWidth = 2;

        if (selectedGate === 'AND' || selectedGate === 'NAND') {
          ctx.beginPath();
          ctx.moveTo(cx - gw / 2, cy - gh / 2);
          ctx.lineTo(cx, cy - gh / 2);
          ctx.arc(cx, cy, gh / 2, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(cx - gw / 2, cy + gh / 2);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        } else if (selectedGate === 'OR' || selectedGate === 'NOR') {
          ctx.beginPath();
          ctx.moveTo(cx - gw / 2, cy - gh / 2);
          ctx.quadraticCurveTo(cx - gw / 4, cy, cx - gw / 2, cy + gh / 2);
          ctx.quadraticCurveTo(cx + gw / 4, cy + gh / 2, cx + gw / 2, cy);
          ctx.quadraticCurveTo(cx + gw / 4, cy - gh / 2, cx - gw / 2, cy - gh / 2);
          ctx.fill(); ctx.stroke();
        } else if (selectedGate === 'XOR' || selectedGate === 'XNOR') {
          ctx.beginPath();
          ctx.moveTo(cx - gw / 2, cy - gh / 2);
          ctx.quadraticCurveTo(cx - gw / 4, cy, cx - gw / 2, cy + gh / 2);
          ctx.quadraticCurveTo(cx + gw / 4, cy + gh / 2, cx + gw / 2, cy);
          ctx.quadraticCurveTo(cx + gw / 4, cy - gh / 2, cx - gw / 2, cy - gh / 2);
          ctx.fill(); ctx.stroke();
          // Extra arc for XOR
          ctx.beginPath();
          ctx.quadraticCurveTo(cx - gw / 2 - 8, cy, cx - gw / 2 - 5, cy + gh / 2 + 3);
          ctx.stroke();
        } else { // NOT
          ctx.beginPath();
          ctx.moveTo(cx - gw / 2, cy - gh / 2);
          ctx.lineTo(cx + gw / 3, cy);
          ctx.lineTo(cx - gw / 2, cy + gh / 2);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }

        // Bubble for NAND, NOR, NOT, XNOR
        if (['NAND', 'NOR', 'NOT', 'XNOR'].includes(selectedGate)) {
          ctx.fillStyle = '#0a0e1a';
          ctx.strokeStyle = output ? 'rgba(100,220,128,0.6)' : 'rgba(100,130,200,0.4)';
          ctx.lineWidth = 2;
          const bx = selectedGate === 'NOT' ? cx + gw / 3 + 7 : cx + gw / 2 + 7;
          ctx.beginPath(); ctx.arc(bx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        // Gate label
        ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(selectedGate, cx, cy);

        // Input labels
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = inputA ? '#4ade80' : '#666'; ctx.textAlign = 'right';
        ctx.fillText(`A = ${inputA ? '1' : '0'}`, cx - gw - 45, inputAY + 4);
        if (!isNot) {
          ctx.fillStyle = inputB ? '#4ade80' : '#666';
          ctx.fillText(`B = ${inputB ? '1' : '0'}`, cx - gw - 45, inputBY + 4);
        }

        // Output label
        ctx.fillStyle = output ? '#4ade80' : '#666'; ctx.textAlign = 'left';
        ctx.fillText(`Q = ${output ? '1' : '0'}`, cx + gw + 45, cy + 4);

        // Expression
        ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Q = ${gateExpressions[selectedGate]}`, cx, cy + gh / 2 + 25);

        // Truth table
        const ttX = 30, ttY = h * 0.6;
        const colW = 60, rowH = 22;
        const isUnary = selectedGate === 'NOT';
        const cols = isUnary ? ['A', 'Q'] : ['A', 'B', 'Q'];

        // Header
        ctx.fillStyle = 'rgba(60,80,140,0.4)';
        ctx.fillRect(ttX, ttY, colW * cols.length, rowH);
        ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
        cols.forEach((c, i) => ctx.fillText(c, ttX + i * colW + colW / 2, ttY + 14));

        // Rows
        const inputs = isUnary ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
        inputs.forEach((inp, row) => {
          const a = !!inp[0], b = isUnary ? false : !!inp[1];
          const q = evaluate(selectedGate, a, b);
          const ry = ttY + (row + 1) * rowH;
          const isCurrent = isUnary ? (a === inputA) : (a === inputA && b === inputB);
          ctx.fillStyle = isCurrent ? 'rgba(100,160,255,0.15)' : 'rgba(30,35,60,0.3)';
          ctx.fillRect(ttX, ry, colW * cols.length, rowH);

          ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
          if (isUnary) {
            ctx.fillText(inp[0].toString(), ttX + colW / 2, ry + 14);
            ctx.fillStyle = q ? '#4ade80' : '#f87171';
            ctx.fillText(q ? '1' : '0', ttX + colW * 1.5, ry + 14);
          } else {
            ctx.fillText(inp[0].toString(), ttX + colW / 2, ry + 14);
            ctx.fillText(inp[1].toString(), ttX + colW * 1.5, ry + 14);
            ctx.fillStyle = q ? '#4ade80' : '#f87171';
            ctx.fillText(q ? '1' : '0', ttX + colW * 2.5, ry + 14);
          }

          // Border
          ctx.strokeStyle = 'rgba(60,70,100,0.3)'; ctx.lineWidth = 0.5;
          ctx.strokeRect(ttX, ry, colW * cols.length, rowH);
        });

        // Table border
        ctx.strokeStyle = 'rgba(60,70,100,0.4)'; ctx.lineWidth = 1;
        ctx.strokeRect(ttX, ttY, colW * cols.length, rowH * (inputs.length + 1));
      }

      animRef.current = requestAnimationFrame(draw);
    };
    const animRef = { current: requestAnimationFrame(draw) };
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [selectedGate, inputA, inputB, output, mode]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-indigo-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">⚡ Logic Gate Simulator</h2>
        <p className="text-[11px] text-gray-400">Boolean logic gates with truth tables</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Gate Type</h4>
            <div className="grid grid-cols-2 gap-1">
              {(['AND','OR','NOT','NAND','NOR','XOR','XNOR'] as GateType[]).map(g => (
                <button key={g} onClick={() => setSelectedGate(g)} className={`px-2 py-1.5 rounded text-[9px] font-mono font-bold ${selectedGate===g?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}>{g}</button>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Inputs</h4>
            <button onClick={() => setInputA(!inputA)} className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-[10px] ${inputA?'bg-green-700 text-white':'bg-gray-800 text-gray-400'}`}>
              <span>Input A</span><span className="font-mono font-bold">{inputA?'1':'0'}</span>
            </button>
            {selectedGate !== 'NOT' && (
              <button onClick={() => setInputB(!inputB)} className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-[10px] ${inputB?'bg-green-700 text-white':'bg-gray-800 text-gray-400'}`}>
                <span>Input B</span><span className="font-mono font-bold">{inputB?'1':'0'}</span>
              </button>
            )}
            <div className={`flex items-center justify-between w-full px-2 py-1.5 rounded text-[10px] ${output?'bg-cyan-700 text-white':'bg-gray-800 text-gray-400'}`}>
              <span>Output Q</span><span className="font-mono font-bold">{output?'1':'0'}</span>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div className="text-[10px] text-gray-400">Expression:</div>
            <div className="text-[12px] text-indigo-400 font-mono mt-0.5">Q = {gateExpressions[selectedGate]}</div>
          </div>
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-indigo-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" />About</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              <p>Logic gates are the building blocks of digital circuits & CPUs.</p>
              <p>Every computation is ultimately performed by combinations of these gates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
