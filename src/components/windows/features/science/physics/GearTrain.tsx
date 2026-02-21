import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Gear {
  x: number; y: number; radius: number; teeth: number; angle: number;
  rpm: number; torque: number; isDriver: boolean; meshWith: number[];
  color: string;
}

export const GearTrain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [driverRPM, setDriverRPM] = useState(60);
  const [driverTorque, setDriverTorque] = useState(10);
  const [preset, setPreset] = useState(0);
  const [showInfo, setShowInfo] = useState(true);
  const gearsRef = useRef<Gear[]>([]);

  const presets = [
    {
      name: 'Simple Pair',
      gears: (cx: number, cy: number): Gear[] => [
        { x: cx - 60, y: cy, radius: 40, teeth: 20, angle: 0, rpm: 0, torque: 0, isDriver: true, meshWith: [1], color: 'rgba(100,160,255,0.7)' },
        { x: cx + 60, y: cy, radius: 60, teeth: 30, angle: 0, rpm: 0, torque: 0, isDriver: false, meshWith: [0], color: 'rgba(255,160,100,0.7)' },
      ],
    },
    {
      name: 'Compound Train',
      gears: (cx: number, cy: number): Gear[] => [
        { x: cx - 110, y: cy, radius: 35, teeth: 14, angle: 0, rpm: 0, torque: 0, isDriver: true, meshWith: [1], color: 'rgba(100,160,255,0.7)' },
        { x: cx - 30, y: cy, radius: 55, teeth: 28, angle: 0, rpm: 0, torque: 0, isDriver: false, meshWith: [0, 2], color: 'rgba(255,160,100,0.7)' },
        { x: cx + 30, y: cy - 10, radius: 25, teeth: 10, angle: 0, rpm: 0, torque: 0, isDriver: false, meshWith: [1, 3], color: 'rgba(100,255,160,0.7)' },
        { x: cx + 100, y: cy - 10, radius: 50, teeth: 25, angle: 0, rpm: 0, torque: 0, isDriver: false, meshWith: [2], color: 'rgba(255,100,160,0.7)' },
      ],
    },
    {
      name: 'Speed Increaser',
      gears: (cx: number, cy: number): Gear[] => [
        { x: cx - 55, y: cy, radius: 65, teeth: 36, angle: 0, rpm: 0, torque: 0, isDriver: true, meshWith: [1], color: 'rgba(100,160,255,0.7)' },
        { x: cx + 55, y: cy, radius: 30, teeth: 12, angle: 0, rpm: 0, torque: 0, isDriver: false, meshWith: [0], color: 'rgba(255,200,50,0.7)' },
      ],
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
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      const cx = w / 2, cy = h * 0.45;
      if (gearsRef.current.length === 0 || gearsRef.current[0].x === 0) {
        gearsRef.current = presets[preset].gears(cx, cy);
      }
      const gears = gearsRef.current;

      // Update gear rotations
      if (running) {
        gears[0].rpm = driverRPM;
        gears[0].torque = driverTorque;
        gears[0].angle += (driverRPM / 60) * Math.PI * 2 * dt;

        const updated = new Set([0]);
        const queue = [0];
        while (queue.length > 0) {
          const idx = queue.shift()!;
          const g = gears[idx];
          g.meshWith.forEach(mi => {
            if (!updated.has(mi)) {
              const mg = gears[mi];
              const ratio = g.teeth / mg.teeth;
              mg.rpm = g.rpm * ratio;
              mg.torque = g.torque / ratio;
              mg.angle -= (mg.rpm / 60) * Math.PI * 2 * dt;
              updated.add(mi);
              queue.push(mi);
            }
          });
        }
      }

      // Draw gears
      gears.forEach((gear, gi) => {
        ctx.save();
        ctx.translate(gear.x, gear.y);
        ctx.rotate(gear.angle);

        // Gear body
        const toothH = 6;
        ctx.beginPath();
        for (let i = 0; i < gear.teeth; i++) {
          const a1 = (i / gear.teeth) * Math.PI * 2;
          const a2 = ((i + 0.3) / gear.teeth) * Math.PI * 2;
          const a3 = ((i + 0.5) / gear.teeth) * Math.PI * 2;
          const a4 = ((i + 0.7) / gear.teeth) * Math.PI * 2;
          ctx.lineTo(Math.cos(a1) * gear.radius, Math.sin(a1) * gear.radius);
          ctx.lineTo(Math.cos(a2) * (gear.radius + toothH), Math.sin(a2) * (gear.radius + toothH));
          ctx.lineTo(Math.cos(a3) * (gear.radius + toothH), Math.sin(a3) * (gear.radius + toothH));
          ctx.lineTo(Math.cos(a4) * gear.radius, Math.sin(a4) * gear.radius);
        }
        ctx.closePath();
        ctx.fillStyle = gear.color.replace('0.7', '0.15');
        ctx.fill();
        ctx.strokeStyle = gear.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Center hole
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc'; ctx.fill();
        ctx.strokeStyle = gear.color; ctx.lineWidth = 1; ctx.stroke();

        // Spoke line
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(gear.radius * 0.8, 0);
        ctx.strokeStyle = gear.color.replace('0.7', '0.3'); ctx.lineWidth = 1; ctx.stroke();

        ctx.restore();

        // Labels
        if (showInfo) {
          ctx.fillStyle = gear.color;
          ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(gear.isDriver ? 'DRIVER' : `Gear ${gi + 1}`, gear.x, gear.y + gear.radius + 22);
          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.5)' : 'rgba(30,40,80,0.5)'; ctx.font = '8px monospace';
          ctx.fillText(`${Math.abs(gear.rpm).toFixed(0)} RPM`, gear.x, gear.y + gear.radius + 34);
          ctx.fillText(`${gear.teeth}T | τ=${gear.torque.toFixed(1)}Nm`, gear.x, gear.y + gear.radius + 44);
        }

        // Rotation direction arrow
        if (running) {
          const dir = gear.rpm > 0 ? 1 : -1;
          const arrowAngle = gear.angle + dir * 0.3;
          const ax = gear.x + Math.cos(arrowAngle) * (gear.radius + 14);
          const ay = gear.y + Math.sin(arrowAngle) * (gear.radius + 14);
          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.3)' : 'rgba(30,40,80,0.3)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(dir > 0 ? '↻' : '↺', ax, ay);
        }
      });

      // Overall ratio
      if (gears.length >= 2) {
        const totalRatio = gears[0].teeth / gears[gears.length - 1].teeth;
        const outputRPM = gears[gears.length - 1].rpm;
        const outputTorque = gears[gears.length - 1].torque;

        ctx.fillStyle = isDark ? 'rgba(20,25,50,0.5)' : 'rgba(230,235,245,0.8)'; ctx.fillRect(10, h - 55, w - 20, 45);
        ctx.strokeStyle = isDark ? 'rgba(60,70,100,0.3)' : 'rgba(180,190,210,0.3)'; ctx.lineWidth = 0.5; ctx.strokeRect(10, h - 55, w - 20, 45);
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`Gear Ratio: 1:${(1 / totalRatio).toFixed(2)}`, 20, h - 38);
        ctx.fillText(`Input: ${driverRPM} RPM, ${driverTorque} Nm`, 20, h - 24);
        ctx.fillText(`Output: ${Math.abs(outputRPM).toFixed(1)} RPM, ${outputTorque.toFixed(1)} Nm`, w / 2, h - 24);
        ctx.fillStyle = 'rgba(100,200,100,0.5)';
        ctx.fillText(`Mechanical Advantage: ${(outputTorque / driverTorque).toFixed(2)}x`, 20, h - 16);
      }

      // Title
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(presets[preset].name, w / 2, 18);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, driverRPM, driverTorque, preset, showInfo]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-stone-100 dark:from-gray-950 dark:to-stone-900 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ Gear Train Simulator</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Mechanical advantage & gear ratios</p>
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
            <button onClick={() => { gearsRef.current = []; }} className="px-2 py-1.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Preset</h4>
            {presets.map((p, i) => (
              <button key={i} onClick={() => { setPreset(i); gearsRef.current = []; }} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${preset===i?'bg-stone-600 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{p.name}</button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Driver RPM</span><span>{driverRPM}</span></label>
            <input type="range" min={10} max={300} step={5} value={driverRPM} onChange={e=>setDriverRPM(+e.target.value)} className="w-full h-1 accent-blue-500"/>
            <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Input Torque (Nm)</span><span>{driverTorque}</span></label>
            <input type="range" min={1} max={50} step={1} value={driverTorque} onChange={e=>setDriverTorque(+e.target.value)} className="w-full h-1 accent-orange-500"/>
          </div>
          <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer px-1">
            <input type="checkbox" checked={showInfo} onChange={e=>setShowInfo(e.target.checked)} className="accent-blue-500"/>Show Labels
          </label>
          <div className="bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-700/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/>How it works</h4>
            <p className="text-[9px] text-gray-600 dark:text-gray-400">Meshing gears transfer torque inversely proportional to their tooth ratio. More teeth = more torque, less speed.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
