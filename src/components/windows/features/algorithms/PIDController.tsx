import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

export const PIDController: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(false);
  const [kp, setKp] = useState(1.5);
  const [ki, setKi] = useState(0.3);
  const [kd, setKd] = useState(0.5);
  const [setpoint, setSetpoint] = useState(50);
  const [disturbance, setDisturbance] = useState(0);
  const [plant, setPlant] = useState<'first-order' | 'second-order' | 'integrator'>('first-order');

  const timeRef = useRef(0);
  const processRef = useRef(0);
  const integralRef = useRef(0);
  const prevErrorRef = useRef(0);
  const velocityRef = useRef(0);
  const historyRef = useRef<{ t: number; pv: number; sp: number; output: number; error: number; p: number; i: number; d: number }[]>([]);

  const reset = useCallback(() => {
    timeRef.current = 0;
    processRef.current = 0;
    integralRef.current = 0;
    prevErrorRef.current = 0;
    velocityRef.current = 0;
    historyRef.current = [];
    setRunning(false);
  }, []);

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

      if (running) {
        const simDt = 0.02;
        const error = setpoint - processRef.current;
        integralRef.current += error * simDt;
        integralRef.current = Math.max(-100, Math.min(100, integralRef.current));
        const derivative = (error - prevErrorRef.current) / simDt;
        prevErrorRef.current = error;

        const pTerm = kp * error;
        const iTerm = ki * integralRef.current;
        const dTerm = kd * derivative;
        const output = Math.max(-100, Math.min(100, pTerm + iTerm + dTerm));

        // Plant simulation
        if (plant === 'first-order') {
          const tau = 0.5;
          processRef.current += (output + disturbance - processRef.current) * simDt / tau;
        } else if (plant === 'second-order') {
          const wn = 3, zeta = 0.3;
          const accel = wn * wn * (output + disturbance - processRef.current) - 2 * zeta * wn * velocityRef.current;
          velocityRef.current += accel * simDt;
          processRef.current += velocityRef.current * simDt;
        } else {
          processRef.current += (output + disturbance) * simDt * 0.5;
        }

        timeRef.current += simDt;
        historyRef.current.push({
          t: timeRef.current, pv: processRef.current, sp: setpoint, output,
          error, p: pTerm, i: iTerm, d: dTerm
        });
        if (historyRef.current.length > 600) historyRef.current.shift();
      }

      const hist = historyRef.current;
      const margin = { top: 30, right: 10, bottom: 30, left: 40 };
      const gw = w - margin.left - margin.right;
      const gh1 = (h - margin.top - margin.bottom - 30) * 0.55;
      const gh2 = (h - margin.top - margin.bottom - 30) * 0.35;

      // Process Value chart
      const chart1Y = margin.top;
      ctx.save(); ctx.translate(margin.left, chart1Y);
      ctx.fillStyle = 'rgba(20,25,50,0.5)'; ctx.fillRect(0, 0, gw, gh1);
      ctx.strokeStyle = 'rgba(60,70,100,0.3)'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * gh1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(gw, y); ctx.stroke();
      }

      // Axes labels
      ctx.fillStyle = 'rgba(150,150,200,0.6)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const val = 100 - i * 25;
        const y = (i / 4) * gh1;
        ctx.fillText(val.toString(), -4, y + 3);
      }
      ctx.fillStyle = 'rgba(150,200,255,0.5)'; ctx.textAlign = 'center'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('Process Value vs Setpoint', gw / 2, -8);

      if (hist.length > 1) {
        const tMax = hist[hist.length - 1].t;
        const tMin = hist.length > 1 ? hist[0].t : 0;
        const tRange = Math.max(tMax - tMin, 1);

        // Setpoint line (dashed)
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(255,200,50,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath();
        hist.forEach((p, i) => {
          const x = ((p.t - tMin) / tRange) * gw;
          const y = (1 - p.sp / 100) * gh1;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Process value line
        ctx.strokeStyle = 'rgba(100,200,255,0.9)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        hist.forEach((p, i) => {
          const x = ((p.t - tMin) / tRange) * gw;
          const y = Math.max(0, Math.min(gh1, (1 - p.pv / 100) * gh1));
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Error fill
        ctx.fillStyle = 'rgba(255,100,100,0.05)';
        ctx.beginPath();
        hist.forEach((p, i) => {
          const x = ((p.t - tMin) / tRange) * gw;
          const yPV = Math.max(0, Math.min(gh1, (1 - p.pv / 100) * gh1));
          const ySP = (1 - p.sp / 100) * gh1;
          i === 0 ? ctx.moveTo(x, ySP) : ctx.lineTo(x, yPV);
        });
        for (let i = hist.length - 1; i >= 0; i--) {
          const x = ((hist[i].t - tMin) / tRange) * gw;
          const ySP = (1 - hist[i].sp / 100) * gh1;
          ctx.lineTo(x, ySP);
        }
        ctx.closePath(); ctx.fill();
      }

      // Legend
      ctx.fillStyle = 'rgba(100,200,255,0.8)'; ctx.fillRect(gw - 80, 5, 8, 2);
      ctx.fillStyle = 'rgba(100,200,255,0.6)'; ctx.font = '7px sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('PV', gw - 70, 8);
      ctx.fillStyle = 'rgba(255,200,50,0.6)'; ctx.fillRect(gw - 45, 5, 8, 2);
      ctx.fillStyle = 'rgba(255,200,50,0.6)'; ctx.fillText('SP', gw - 35, 8);
      ctx.restore();

      // PID Components chart
      const chart2Y = chart1Y + gh1 + 20;
      ctx.save(); ctx.translate(margin.left, chart2Y);
      ctx.fillStyle = 'rgba(20,25,50,0.3)'; ctx.fillRect(0, 0, gw, gh2);
      ctx.fillStyle = 'rgba(150,200,255,0.4)'; ctx.textAlign = 'center'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText('PID Components', gw / 2, -6);

      if (hist.length > 1) {
        const tMax = hist[hist.length - 1].t;
        const tMin = hist[0].t;
        const tRange = Math.max(tMax - tMin, 1);
        const maxComp = hist.reduce((m, p) => Math.max(m, Math.abs(p.p), Math.abs(p.i), Math.abs(p.d)), 10);

        [{ data: (p: typeof hist[0]) => p.p, color: 'rgba(255,100,100,0.7)', label: 'P' },
         { data: (p: typeof hist[0]) => p.i, color: 'rgba(100,255,100,0.7)', label: 'I' },
         { data: (p: typeof hist[0]) => p.d, color: 'rgba(100,100,255,0.7)', label: 'D' },
        ].forEach((series, si) => {
          ctx.strokeStyle = series.color; ctx.lineWidth = 1;
          ctx.beginPath();
          hist.forEach((p, i) => {
            const x = ((p.t - tMin) / tRange) * gw;
            const y = (1 - series.data(p) / maxComp) * gh2 / 2;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
          ctx.fillStyle = series.color; ctx.font = '7px sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(series.label, gw - 80 + si * 20, gh2 - 4);
          ctx.fillRect(gw - 88 + si * 20, gh2 - 7, 6, 2);
        });

        // Zero line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, gh2 / 2); ctx.lineTo(gw, gh2 / 2); ctx.stroke();
      }
      ctx.restore();

      // Current values overlay
      if (hist.length > 0) {
        const last = hist[hist.length - 1];
        ctx.fillStyle = 'rgba(200,200,255,0.2)'; ctx.fillRect(w - 125, h - 60, 120, 55);
        ctx.fillStyle = 'rgba(200,200,255,0.5)'; ctx.font = '8px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`PV: ${last.pv.toFixed(1)}  SP: ${last.sp.toFixed(0)}`, w - 120, h - 46);
        ctx.fillText(`Error: ${last.error.toFixed(2)}`, w - 120, h - 34);
        ctx.fillText(`P:${last.p.toFixed(1)} I:${last.i.toFixed(1)} D:${last.d.toFixed(1)}`, w - 120, h - 22);
        ctx.fillText(`Output: ${last.output.toFixed(1)}`, w - 120, h - 10);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, kp, ki, kd, setpoint, disturbance, plant]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-teal-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🎛️ PID Controller</h2>
        <p className="text-[11px] text-gray-400">Proportional-Integral-Derivative control</p>
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
            <button onClick={reset} className="px-2 py-1.5 rounded bg-gray-700 text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">PID Gains</h4>
            {[{ label: 'Kp (Proportional)', val: kp, set: setKp, max: 5, color: 'red' },
              { label: 'Ki (Integral)', val: ki, set: setKi, max: 2, color: 'green' },
              { label: 'Kd (Derivative)', val: kd, set: setKd, max: 3, color: 'blue' }].map(g => (
              <div key={g.label}>
                <label className="text-[9px] text-gray-400 flex justify-between"><span>{g.label}</span><span className="font-mono">{g.val.toFixed(2)}</span></label>
                <input type="range" min={0} max={g.max} step={0.05} value={g.val} onChange={e => g.set(+e.target.value)} className={`w-full h-1 accent-${g.color}-500`} />
              </div>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-400 flex justify-between"><span>Setpoint</span><span className="font-mono">{setpoint}</span></label>
            <input type="range" min={0} max={100} step={1} value={setpoint} onChange={e => setSetpoint(+e.target.value)} className="w-full h-1 accent-yellow-500"/>
            <label className="text-[9px] text-gray-400 flex justify-between"><span>Disturbance</span><span className="font-mono">{disturbance}</span></label>
            <input type="range" min={-30} max={30} step={1} value={disturbance} onChange={e => setDisturbance(+e.target.value)} className="w-full h-1 accent-orange-500"/>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Plant</h4>
            {(['first-order', 'second-order', 'integrator'] as const).map(p => (
              <button key={p} onClick={() => { setPlant(p); reset(); }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${plant===p?'bg-teal-700 text-white':'bg-gray-800 text-gray-400'}`}>{p.replace('-', ' ')}</button>
            ))}
          </div>
          <div className="bg-teal-950/30 border border-teal-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-teal-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>Guide</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              <p><b>P</b>: Reduces error proportionally</p>
              <p><b>I</b>: Eliminates steady-state error</p>
              <p><b>D</b>: Reduces overshoot/oscillation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
