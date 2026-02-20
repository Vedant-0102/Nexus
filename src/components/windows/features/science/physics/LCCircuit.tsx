import React, { useState, useRef, useEffect } from 'react';
import { Zap, Play, Pause, RotateCcw, Info } from 'lucide-react';

type CircuitType = 'lc' | 'rlc-under' | 'rlc-critical' | 'rlc-over';

export const LCCircuit: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [circuitType, setCircuitType] = useState<CircuitType>('lc');
  const [inductance, setInductance] = useState(50); // mH
  const [capacitance, setCapacitance] = useState(100); // μF
  const [resistance, setResistance] = useState(10); // Ω
  const timeRef = useRef(0);
  const historyRef = useRef<{ v: number; i: number }[]>([]);

  const resetSimulation = () => {
    timeRef.current = 0;
    historyRef.current = [];
  };

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

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isPlaying) return;
      timeRef.current += 0.02;
      const t = timeRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0c0f1a';
      ctx.fillRect(0, 0, w, h);

      const L = inductance / 1000; // H
      const C = capacitance / 1e6; // F
      const R = resistance;
      const omega0 = 1 / Math.sqrt(L * C); // natural freq

      let voltage: number;
      let current: number;
      const V0 = 1.0; // initial voltage

      if (circuitType === 'lc') {
        voltage = V0 * Math.cos(omega0 * t);
        current = V0 * Math.sqrt(C / L) * Math.sin(omega0 * t);
      } else {
        const alpha = R / (2 * L);
        const omegaD2 = omega0 * omega0 - alpha * alpha;

        if (circuitType === 'rlc-under' || omegaD2 > 0) {
          const omegaD = Math.sqrt(Math.abs(omegaD2));
          voltage = V0 * Math.exp(-alpha * t) * Math.cos(omegaD * t);
          current = V0 * Math.exp(-alpha * t) * Math.sqrt(C / L) * Math.sin(omegaD * t);
        } else if (circuitType === 'rlc-critical' || Math.abs(omegaD2) < 0.01) {
          voltage = V0 * Math.exp(-alpha * t) * (1 + alpha * t);
          current = V0 * Math.exp(-alpha * t) * alpha * t * Math.sqrt(C / L);
        } else {
          const s1 = -alpha + Math.sqrt(-omegaD2);
          const s2 = -alpha - Math.sqrt(-omegaD2);
          voltage = V0 * 0.5 * (Math.exp(s1 * t) + Math.exp(s2 * t));
          current = V0 * 0.5 * Math.sqrt(C / L) * (Math.exp(s1 * t) - Math.exp(s2 * t));
        }
      }

      // Clamp for display
      voltage = Math.max(-1.5, Math.min(1.5, voltage));
      current = Math.max(-1.5, Math.min(1.5, current));

      historyRef.current.push({ v: voltage, i: current });
      if (historyRef.current.length > 400) historyRef.current.shift();

      // Draw circuit schematic (top area)
      const circuitY = h * 0.18;
      const circuitH = h * 0.28;
      const circuitLeft = w * 0.1;
      const circuitRight = w * 0.9;
      const circuitMidX = (circuitLeft + circuitRight) / 2;

      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 2;

      // Top wire
      ctx.beginPath();
      ctx.moveTo(circuitLeft, circuitY);
      ctx.lineTo(circuitRight, circuitY);
      ctx.stroke();

      // Bottom wire
      ctx.beginPath();
      ctx.moveTo(circuitLeft, circuitY + circuitH);
      ctx.lineTo(circuitRight, circuitY + circuitH);
      ctx.stroke();

      // Left wire (capacitor side)
      ctx.beginPath();
      ctx.moveTo(circuitLeft, circuitY);
      ctx.lineTo(circuitLeft, circuitY + circuitH);
      ctx.stroke();

      // Right wire (inductor side)
      ctx.beginPath();
      ctx.moveTo(circuitRight, circuitY);
      ctx.lineTo(circuitRight, circuitY + circuitH);
      ctx.stroke();

      // Capacitor symbol (left side)
      const capX = circuitLeft;
      const capY = circuitY + circuitH * 0.35;
      const plateGap = 8;
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(${Math.round(100 + Math.abs(voltage) * 150)}, 200, 255, 0.9)`;
      ctx.beginPath();
      ctx.moveTo(capX - 12, capY);
      ctx.lineTo(capX + 12, capY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(capX - 12, capY + plateGap);
      ctx.lineTo(capX + 12, capY + plateGap);
      ctx.stroke();

      // Charge visualization on capacitor plates
      const charge = Math.abs(voltage);
      ctx.fillStyle = voltage > 0 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 100, 255, 0.8)';
      const numCharges = Math.round(charge * 5);
      for (let i = 0; i < numCharges; i++) {
        ctx.fillText(voltage > 0 ? '+' : '-', capX - 10 + i * 5, capY - 3);
        ctx.fillText(voltage > 0 ? '-' : '+', capX - 10 + i * 5, capY + plateGap + 12);
      }

      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(`C = ${capacitance} μF`, capX, circuitY + circuitH + 15);

      // Inductor symbol (right side) - coil
      const indX = circuitRight;
      const indTop = circuitY + circuitH * 0.2;
      const indBot = circuitY + circuitH * 0.8;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, ${Math.round(150 + Math.abs(current) * 100)}, 100, 0.9)`;
      ctx.beginPath();
      const coils = 4;
      const coilH = (indBot - indTop) / coils;
      for (let i = 0; i < coils; i++) {
        const y = indTop + i * coilH;
        ctx.moveTo(indX, y);
        ctx.bezierCurveTo(indX + 15, y, indX + 15, y + coilH, indX, y + coilH);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 180, 100, 0.7)';
      ctx.fillText(`L = ${inductance} mH`, indX, circuitY + circuitH + 15);

      // Resistor (on top wire, if RLC)
      if (circuitType !== 'lc') {
        const resY = circuitY;
        const resLeft = circuitMidX - 30;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(100, 255, 150, 0.8)';
        ctx.beginPath();
        ctx.moveTo(resLeft, resY);
        for (let i = 0; i < 6; i++) {
          ctx.lineTo(resLeft + 5 + i * 10, resY + (i % 2 === 0 ? -6 : 6));
        }
        ctx.lineTo(resLeft + 60, resY);
        ctx.stroke();

        ctx.fillStyle = 'rgba(100, 255, 150, 0.7)';
        ctx.fillText(`R = ${resistance} Ω`, circuitMidX, circuitY - 10);
      }

      // Current arrow animation
      ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
      ctx.lineWidth = 1;
      const arrowPhase = t * 3;
      const arrowDir = current > 0 ? 1 : -1;
      for (let i = 0; i < 4; i++) {
        const pos = ((arrowPhase + i * 0.25 * (circuitRight - circuitLeft)) % (circuitRight - circuitLeft));
        if (Math.abs(current) > 0.01) {
          const ax = circuitLeft + pos;
          ctx.beginPath();
          ctx.moveTo(ax, circuitY - 4);
          ctx.lineTo(ax + 5 * arrowDir, circuitY);
          ctx.lineTo(ax, circuitY + 4);
          ctx.stroke();
        }
      }

      // Oscilloscope view (bottom half)
      const graphY = h * 0.55;
      const graphH = h * 0.38;
      const graphLeft = w * 0.08;
      const graphRight = w * 0.92;
      const graphW = graphRight - graphLeft;
      const graphMidY = graphY + graphH / 2;

      // Graph background
      ctx.fillStyle = 'rgba(10, 15, 30, 0.8)';
      ctx.strokeStyle = 'rgba(100, 130, 200, 0.2)';
      ctx.lineWidth = 1;
      ctx.fillRect(graphLeft, graphY, graphW, graphH);
      ctx.strokeRect(graphLeft, graphY, graphW, graphH);

      // Grid lines
      ctx.strokeStyle = 'rgba(100, 130, 200, 0.08)';
      for (let i = 0; i < 10; i++) {
        const x = graphLeft + (graphW / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, graphY);
        ctx.lineTo(x, graphY + graphH);
        ctx.stroke();
      }
      for (let i = 0; i < 6; i++) {
        const y = graphY + (graphH / 6) * i;
        ctx.beginPath();
        ctx.moveTo(graphLeft, y);
        ctx.lineTo(graphRight, y);
        ctx.stroke();
      }

      // Zero line
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(graphLeft, graphMidY);
      ctx.lineTo(graphRight, graphMidY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('Voltage (V)', graphLeft + 5, graphY + 12);
      ctx.fillStyle = 'rgba(255, 180, 100, 0.6)';
      ctx.fillText('Current (A)', graphLeft + 5, graphY + 23);

      // Draw voltage waveform
      const hist = historyRef.current;
      if (hist.length > 2) {
        const scale = graphH / 3;
        
        // Voltage
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = graphLeft + (i / 400) * graphW;
          const y = graphMidY - hist[i].v * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Current
        ctx.strokeStyle = 'rgba(255, 180, 100, 0.9)';
        ctx.beginPath();
        for (let i = 0; i < hist.length; i++) {
          const x = graphLeft + (i / 400) * graphW;
          const y = graphMidY - hist[i].i * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Readout at bottom
      ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`V = ${voltage.toFixed(3)} V`, graphLeft, graphY + graphH + 14);
      ctx.fillStyle = 'rgba(255, 180, 100, 0.9)';
      ctx.fillText(`I = ${current.toFixed(3)} A`, graphLeft + graphW * 0.3, graphY + graphH + 14);
      ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
      ctx.fillText(`f₀ = ${(omega0 / (2 * Math.PI)).toFixed(1)} Hz`, graphLeft + graphW * 0.6, graphY + graphH + 14);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, circuitType, inductance, capacitance, resistance]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-blue-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            LC / RLC Oscillator
          </h2>
          <p className="text-[11px] text-gray-400">
            Electromagnetic oscillations in resonant circuits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/50 text-blue-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={resetSimulation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <div className="rounded-lg shadow-md h-full overflow-hidden border border-gray-800">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Circuit Type</h4>
            {([['lc', 'Pure LC'], ['rlc-under', 'RLC Underdamped'], ['rlc-critical', 'RLC Critical'], ['rlc-over', 'RLC Overdamped']] as [CircuitType, string][]).map(([key, label]) => (
              <button key={key} onClick={() => { setCircuitType(key); resetSimulation(); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${circuitType === key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Parameters</h4>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Inductance: {inductance} mH</label>
              <input type="range" min="10" max="200" step="5" value={inductance} onChange={e => { setInductance(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Capacitance: {capacitance} μF</label>
              <input type="range" min="10" max="500" step="10" value={capacitance} onChange={e => { setCapacitance(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            {circuitType !== 'lc' && (
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Resistance: {resistance} Ω</label>
                <input type="range" min="1" max="100" step="1" value={resistance} onChange={e => { setResistance(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
              </div>
            )}
          </div>

          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> LC Oscillation
            </h4>
            <div className="space-y-1 text-[9px] text-gray-400">
              <p>Energy oscillates between the capacitor's electric field and the inductor's magnetic field.</p>
              <p className="font-mono bg-gray-800/50 rounded px-1 py-0.5">f₀ = 1/(2π√LC)</p>
              <p>Adding resistance (R) causes damping. The damping factor α = R/(2L) determines if oscillations are underdamped, critically damped, or overdamped.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
