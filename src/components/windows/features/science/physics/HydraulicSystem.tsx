import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

export const HydraulicSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(false);
  const [inputForce, setInputForce] = useState(30);
  const [pistonRatioIdx, setPistonRatioIdx] = useState(1);
  const [fluidType, setFluidType] = useState<'oil' | 'water' | 'glycol'>('oil');
  const phaseRef = useRef(0);

  const pistonRatios = [
    { label: '1:2', small: 20, large: 40 },
    { label: '1:4', small: 15, large: 60 },
    { label: '1:8', small: 10, large: 80 },
  ];

  const fluids: Record<string, { density: number; color: string; name: string }> = {
    oil: { density: 870, color: 'rgba(200,180,50,', name: 'Hydraulic Oil' },
    water: { density: 1000, color: 'rgba(80,140,255,', name: 'Water' },
    glycol: { density: 1110, color: 'rgba(100,200,100,', name: 'Ethylene Glycol' },
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
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      if (running) phaseRef.current = (phaseRef.current + dt * 0.5) % (Math.PI * 2);
      const phase = phaseRef.current;
      const ratio = pistonRatios[pistonRatioIdx];
      const fluid = fluids[fluidType];
      const areaRatio = (ratio.large * ratio.large) / (ratio.small * ratio.small);
      const outputForce = inputForce * areaRatio;
      const pressure = inputForce / (Math.PI * (ratio.small / 100) ** 2);

      const smallPistonX = w * 0.25, largePistonX = w * 0.7;
      const baseY = h * 0.55;
      const cylH = h * 0.25;
      const smallW = ratio.small * 1.2, largeW = ratio.large * 1.2;

      // Piston movement
      const smallDisp = Math.sin(phase) * 30;
      const largeDisp = -Math.sin(phase) * 30 / areaRatio;

      // Connection pipe
      const pipeY = baseY + cylH + 10;
      ctx.fillStyle = 'rgba(80,80,100,0.3)';
      ctx.fillRect(smallPistonX - smallW / 2, pipeY - 8, largePistonX + largeW / 2 - (smallPistonX - smallW / 2), 16);
      ctx.strokeStyle = 'rgba(120,120,150,0.5)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(smallPistonX - smallW / 2, pipeY - 8, largePistonX + largeW / 2 - (smallPistonX - smallW / 2), 16);

      // Fluid in pipe
      ctx.fillStyle = fluid.color + '0.3)';
      ctx.fillRect(smallPistonX - smallW / 2 + 2, pipeY - 6, largePistonX + largeW / 2 - (smallPistonX - smallW / 2) - 4, 12);

      // Draw cylinders
      const drawCylinder = (cx: number, cw: number, disp: number, force: number, label: string, isInput: boolean) => {
        const topY = baseY - 20;
        const botY = baseY + cylH;

        // Cylinder walls
        ctx.strokeStyle = 'rgba(140,140,170,0.6)'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - cw / 2, topY); ctx.lineTo(cx - cw / 2, botY);
        ctx.lineTo(cx - cw / 2, pipeY - 8);
        ctx.moveTo(cx + cw / 2, topY); ctx.lineTo(cx + cw / 2, botY);
        ctx.lineTo(cx + cw / 2, pipeY - 8);
        ctx.stroke();

        // Fluid level
        const fluidTop = baseY + disp + 10;
        ctx.fillStyle = fluid.color + '0.25)';
        ctx.fillRect(cx - cw / 2 + 2, fluidTop, cw - 4, botY - fluidTop + 8);

        // Fluid particles
        for (let i = 0; i < 6; i++) {
          const px = cx - cw / 2 + 5 + Math.sin(phase + i * 1.5) * (cw / 4) + cw / 2 - 5;
          const py = fluidTop + 5 + (i / 6) * (botY - fluidTop);
          ctx.fillStyle = fluid.color + '0.4)';
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }

        // Piston
        const pistonY = baseY + disp;
        ctx.fillStyle = 'rgba(150,150,180,0.6)';
        ctx.fillRect(cx - cw / 2 + 2, pistonY, cw - 4, 10);
        ctx.strokeStyle = 'rgba(180,180,200,0.7)'; ctx.lineWidth = 1;
        ctx.strokeRect(cx - cw / 2 + 2, pistonY, cw - 4, 10);

        // Piston rod
        ctx.fillStyle = 'rgba(120,120,150,0.5)';
        ctx.fillRect(cx - 3, pistonY - 25, 6, 25);

        // Force arrow
        const arrowY = pistonY - 35;
        ctx.strokeStyle = isInput ? 'rgba(100,200,255,0.7)' : 'rgba(255,150,100,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, arrowY - 25); ctx.lineTo(cx, arrowY); ctx.stroke();
        ctx.fillStyle = isInput ? 'rgba(100,200,255,0.7)' : 'rgba(255,150,100,0.7)';
        ctx.beginPath(); ctx.moveTo(cx, arrowY); ctx.lineTo(cx - 5, arrowY - 8); ctx.lineTo(cx + 5, arrowY - 8); ctx.closePath(); ctx.fill();

        // Labels
        ctx.fillStyle = isInput ? 'rgba(100,200,255,0.8)' : 'rgba(255,150,100,0.8)';
        ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(label, cx, arrowY - 32);
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.font = '8px monospace';
        ctx.fillText(`F = ${force.toFixed(1)} N`, cx, arrowY - 42);
        ctx.fillText(`A = ${(Math.PI*(cw/(2*1.2)/100)**2*1e4).toFixed(1)} cm²`, cx, botY + 25);
        ctx.fillText(`⌀ ${(cw/1.2).toFixed(0)} mm`, cx, botY + 38);
      };

      drawCylinder(smallPistonX, smallW, smallDisp, inputForce, 'Input', true);
      drawCylinder(largePistonX, largeW, largeDisp, outputForce, 'Output', false);

      // Pascal's Law equation
      ctx.fillStyle = isDark ? 'rgba(20,25,50,0.5)' : 'rgba(230,235,245,0.8)'; ctx.fillRect(w * 0.3, h * 0.08, w * 0.4, 28);
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("Pascal's Law: P₁ = P₂ → F₁/A₁ = F₂/A₂", w / 2, h * 0.08 + 18);

      // Info panel
      ctx.fillStyle = isDark ? 'rgba(20,25,50,0.4)' : 'rgba(230,235,245,0.8)'; ctx.fillRect(10, h - 50, w - 20, 42);
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`Pressure: ${pressure.toFixed(1)} Pa | Ratio: ${ratio.label} | Area Ratio: 1:${areaRatio.toFixed(1)}`, 20, h - 32);
      ctx.fillText(`Input: ${inputForce} N → Output: ${outputForce.toFixed(1)} N | Mech. Advantage: ${areaRatio.toFixed(1)}x`, 20, h - 18);
      ctx.fillStyle = 'rgba(100,200,100,0.4)'; ctx.fillText(`Fluid: ${fluid.name} (ρ=${fluid.density} kg/m³)`, w * 0.65, h - 32);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, inputForce, pistonRatioIdx, fluidType]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-cyan-100 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔧 Hydraulic System</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Pascal's Law & fluid power</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[190px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-green-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Run</>}
            </button>
            <button onClick={() => phaseRef.current = 0} className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Input Force (N)</span><span>{inputForce}</span></label>
            <input type="range" min={5} max={100} step={1} value={inputForce} onChange={e=>setInputForce(+e.target.value)} className="w-full h-1 accent-cyan-500"/>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Piston Ratio</h4>
            {pistonRatios.map((p, i) => (
              <button key={i} onClick={() => setPistonRatioIdx(i)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${pistonRatioIdx===i?'bg-cyan-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p.label} (⌀{p.small}:{p.large}mm)</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Fluid</h4>
            {(Object.keys(fluids) as Array<'oil'|'water'|'glycol'>).map(f => (
              <button key={f} onClick={() => setFluidType(f)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${fluidType===f?'bg-cyan-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{fluids[f].name}</button>
            ))}
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>Pascal's Law</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">Pressure applied to a confined fluid is transmitted equally in all directions. Larger piston area = more output force.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
