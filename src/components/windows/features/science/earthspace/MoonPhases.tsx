import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Info } from 'lucide-react';

export const MoonPhases: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [day, setDay] = useState(0);
  const [showTides, setShowTides] = useState(true);
  const timeRef = useRef(0);

  const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];

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
      ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, w, h);

      if (running) { timeRef.current += 0.016 * speed; setDay(Math.floor(timeRef.current) % 30); }
      const t = timeRef.current;
      const lunarCycle = 29.53;
      const phase = (t % lunarCycle) / lunarCycle;
      const phaseIdx = Math.floor(phase * 8);
      const phaseName = phases[phaseIdx];

      // Stars
      for (let i = 0; i < 100; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h * 0.6;
        ctx.fillStyle = `rgba(200,200,255,${0.2 + Math.sin(t * 0.3 + i) * 0.1})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Top view: Sun-Earth-Moon system
      const sysCx = w / 2, sysCy = h * 0.25;
      const sysR = Math.min(w, h) * 0.18;

      // Sun rays (far left)
      ctx.fillStyle = 'rgba(255,200,50,0.15)';
      ctx.beginPath(); ctx.arc(10, sysCy, 25, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcc00'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('☀ Sun', 10, sysCy - 30);
      // Sun rays
      for (let i = -3; i <= 3; i++) {
        ctx.strokeStyle = 'rgba(255,200,50,0.1)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(35, sysCy + i * 15); ctx.lineTo(w, sysCy + i * 15); ctx.stroke();
      }

      // Earth
      ctx.fillStyle = '#4090ff';
      ctx.beginPath(); ctx.arc(sysCx, sysCy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200,200,255,0.6)'; ctx.font = '9px sans-serif';
      ctx.fillText('Earth', sysCx, sysCy + 22);

      // Moon orbit
      ctx.strokeStyle = 'rgba(150,150,200,0.2)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.arc(sysCx, sysCy, sysR, 0, Math.PI * 2); ctx.stroke();

      // Moon position
      const moonAngle = phase * Math.PI * 2;
      const mx = sysCx + Math.cos(moonAngle) * sysR;
      const my = sysCy + Math.sin(moonAngle) * sysR;
      ctx.fillStyle = '#ddd';
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
      // Shadow on moon (from sun direction - left)
      ctx.fillStyle = 'rgba(0,0,10,0.7)';
      ctx.beginPath();
      ctx.arc(mx, my, 6, -Math.PI / 2, Math.PI / 2);
      const shadowX = Math.cos(moonAngle) * 6;
      ctx.ellipse(mx, my, Math.abs(shadowX), 6, 0, Math.PI / 2, -Math.PI / 2, shadowX > 0);
      ctx.fill();

      // Phase view (large)
      const moonCx = w / 2, moonCy = h * 0.55;
      const moonR = Math.min(w, h) * 0.15;

      // Moon surface
      ctx.fillStyle = '#ccc';
      ctx.beginPath(); ctx.arc(moonCx, moonCy, moonR, 0, Math.PI * 2); ctx.fill();

      // Craters
      const craters = [[0.3, -0.2, 0.1], [-0.2, 0.3, 0.08], [0.1, 0.1, 0.12], [-0.3, -0.1, 0.06], [0.15, -0.35, 0.07]];
      craters.forEach(([cx, cy, cr]) => {
        ctx.fillStyle = 'rgba(150,150,150,0.4)';
        ctx.beginPath(); ctx.arc(moonCx + cx * moonR, moonCy + cy * moonR, cr * moonR, 0, Math.PI * 2); ctx.fill();
      });

      // Shadow
      ctx.fillStyle = 'rgba(5,8,16,0.95)';
      ctx.beginPath();
      ctx.arc(moonCx, moonCy, moonR, -Math.PI / 2, Math.PI / 2);
      const illumination = Math.cos(phase * Math.PI * 2);
      ctx.ellipse(moonCx, moonCy, Math.abs(illumination) * moonR, moonR, 0, Math.PI / 2, -Math.PI / 2, illumination > 0);
      ctx.fill();

      // Phase label
      ctx.fillStyle = 'rgba(200,200,255,0.8)'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(phaseName, moonCx, moonCy + moonR + 20);
      ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '10px sans-serif';
      ctx.fillText(`Day ${Math.floor(t % lunarCycle).toFixed(0)} of ${lunarCycle}`, moonCx, moonCy + moonR + 34);

      // Tidal effect
      if (showTides) {
        const tideY = h * 0.82;
        const tideH = h * 0.12;
        ctx.fillStyle = 'rgba(40,80,160,0.2)';
        ctx.fillRect(20, tideY, w - 40, tideH);

        // Draw tide wave
        ctx.beginPath();
        ctx.moveTo(20, tideY + tideH);
        const tideFactor = Math.abs(Math.cos(phase * Math.PI * 2));
        for (let x = 20; x <= w - 20; x++) {
          const nx = (x - 20) / (w - 40);
          const tideLevel = tideH * 0.5 + Math.sin(nx * Math.PI * 2 + t * 0.5) * tideH * 0.2 * (1 + tideFactor) + Math.sin(nx * Math.PI * 4) * tideH * 0.05;
          ctx.lineTo(x, tideY + tideH - tideLevel);
        }
        ctx.lineTo(w - 20, tideY + tideH); ctx.closePath();
        ctx.fillStyle = 'rgba(40,120,220,0.4)'; ctx.fill();

        ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`Tidal Strength: ${(tideFactor * 100).toFixed(0)}% (${tideFactor > 0.7 ? 'Spring Tide' : tideFactor < 0.3 ? 'Neap Tide' : 'Normal'})`, w / 2, tideY - 5);
      }

      // Phase strip at bottom
      const stripY = h - 25;
      const stripW = (w - 40) / 8;
      phases.forEach((p, i) => {
        const sx = 20 + i * stripW;
        ctx.fillStyle = i === phaseIdx ? 'rgba(100,150,255,0.3)' : 'rgba(50,50,80,0.2)';
        ctx.fillRect(sx, stripY, stripW - 2, 18);
        ctx.fillStyle = i === phaseIdx ? 'rgba(200,200,255,0.9)' : 'rgba(150,150,200,0.4)';
        ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.split(' ')[0], sx + stripW / 2, stripY + 7);
        ctx.fillText(p.split(' ')[1] || '', sx + stripW / 2, stripY + 15);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, showTides]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-indigo-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🌙 Moon Phases & Tidal Effects</h2>
        <p className="text-[11px] text-gray-400">Lunar cycle and gravitational tides</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-indigo-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <div>
              <label className="text-[10px] text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
              <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-indigo-500"/>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showTides} onChange={e=>setShowTides(e.target.checked)} className="accent-blue-500 w-3 h-3"/>Show tidal effects
            </label>
          </div>
          <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-indigo-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/> Info</h4>
            <div className="text-[9px] text-gray-400 space-y-1">
              <p>The lunar cycle is ~29.53 days. Moon phases result from the angle between Sun, Earth, and Moon.</p>
              <p><strong>Spring tides</strong> occur at New/Full Moon (Sun+Moon aligned). <strong>Neap tides</strong> at quarters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
