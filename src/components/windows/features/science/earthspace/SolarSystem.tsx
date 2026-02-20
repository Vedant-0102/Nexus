import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Planet { name: string; distance: number; radius: number; color: string; period: number; angle: number; speed: number; moons?: { dist: number; radius: number; period: number; angle: number; color: string }[]; }

export const SolarSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const timeRef = useRef(0);

  const planets: Planet[] = [
    { name: 'Mercury', distance: 58, radius: 3, color: '#b0b0b0', period: 0.24, angle: 0, speed: 4.15 },
    { name: 'Venus', distance: 85, radius: 5, color: '#e8c060', period: 0.62, angle: Math.PI / 3, speed: 1.62 },
    { name: 'Earth', distance: 115, radius: 5.5, color: '#4090ff', period: 1, angle: Math.PI, speed: 1, moons: [{ dist: 14, radius: 1.5, period: 0.075, angle: 0, color: '#aaa' }] },
    { name: 'Mars', distance: 150, radius: 4, color: '#e06030', period: 1.88, angle: Math.PI / 2, speed: 0.53, moons: [{ dist: 10, radius: 1, period: 0.09, angle: 0, color: '#cba' }] },
    { name: 'Jupiter', distance: 200, radius: 14, color: '#d4a060', period: 11.86, angle: Math.PI * 1.5, speed: 0.084, moons: [{ dist: 20, radius: 2, period: 0.05, angle: 0, color: '#fda' }, { dist: 26, radius: 2.5, period: 0.1, angle: 1, color: '#adf' }, { dist: 32, radius: 1.8, period: 0.2, angle: 2, color: '#dda' }] },
    { name: 'Saturn', distance: 260, radius: 12, color: '#e8d080', period: 29.46, angle: 0.8, speed: 0.034, moons: [{ dist: 22, radius: 1.5, period: 0.06, angle: 0, color: '#ddd' }] },
    { name: 'Uranus', distance: 310, radius: 8, color: '#80d0d0', period: 84.01, angle: 2.5, speed: 0.012 },
    { name: 'Neptune', distance: 355, radius: 7.5, color: '#4060e0', period: 164.8, angle: 4, speed: 0.006 },
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
      const cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Background stars
      ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 150; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h;
        const br = 0.3 + Math.sin(timeRef.current * 0.5 + i) * 0.2;
        ctx.fillStyle = `rgba(200,200,255,${br})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      if (running) timeRef.current += 0.016 * speed;
      const t = timeRef.current;
      const s = Math.min(scale, (Math.min(w, h) - 40) / 750);

      // Sun
      const sunR = 18 * s;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2);
      grad.addColorStop(0, '#fff8e0'); grad.addColorStop(0.3, '#ffcc00'); grad.addColorStop(0.7, '#ff8800'); grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, sunR * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe070';
      ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();
      if (showLabels) {
        ctx.fillStyle = 'rgba(255,255,200,0.7)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Sun', cx, cy + sunR + 12);
      }

      // Planets
      planets.forEach(p => {
        const dist = p.distance * s;
        const angle = p.angle + t * p.speed;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist * 0.4; // Elliptical
        const pr = Math.max(2, p.radius * s * 0.5);

        // Orbit
        if (showOrbits) {
          ctx.strokeStyle = `rgba(100,120,180,${selected === p.name ? 0.4 : 0.12})`;
          ctx.lineWidth = selected === p.name ? 1.5 : 0.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy, dist, dist * 0.4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Planet shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.arc(px + 1, py + 1, pr, 0, Math.PI * 2); ctx.fill();

        // Planet
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();

        // Saturn rings
        if (p.name === 'Saturn') {
          ctx.strokeStyle = 'rgba(220,200,160,0.5)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(px, py, pr * 2, pr * 0.5, 0.3, 0, Math.PI * 2); ctx.stroke();
        }

        // Moons
        p.moons?.forEach(m => {
          const ma = m.angle + t * (1 / m.period) * 0.5;
          const md = m.dist * s * 0.5;
          const mx = px + Math.cos(ma) * md;
          const my = py + Math.sin(ma) * md * 0.5;
          ctx.fillStyle = m.color;
          ctx.beginPath(); ctx.arc(mx, my, Math.max(1, m.radius * s * 0.3), 0, Math.PI * 2); ctx.fill();
        });

        // Label
        if (showLabels) {
          ctx.fillStyle = selected === p.name ? 'rgba(255,255,255,0.9)' : 'rgba(200,200,255,0.5)';
          ctx.font = `${selected === p.name ? 'bold ' : ''}9px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.name, px, py - pr - 5);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, showOrbits, showLabels, scale, selected]);

  const selPlanet = selected ? planets.find(p => p.name === selected) : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-blue-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">🌌 Solar System Simulator</h2>
        <p className="text-[11px] text-gray-400">Orbital mechanics and planetary motion</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-blue-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
            <button onClick={() => { timeRef.current = 0; }} className="px-2 py-1.5 rounded bg-gray-700 text-white text-[10px]"><RotateCcw className="h-3 w-3"/></button>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <div>
              <label className="text-[10px] text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
              <input type="range" min={0.1} max={10} step={0.1} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-blue-500"/>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 flex justify-between"><span>Zoom</span><span>{scale.toFixed(1)}x</span></label>
              <input type="range" min={0.3} max={2} step={0.1} value={scale} onChange={e=>setScale(+e.target.value)} className="w-full h-1 accent-indigo-500"/>
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showOrbits} onChange={e=>setShowOrbits(e.target.checked)} className="accent-blue-500 w-3 h-3"/>Show orbits
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)} className="accent-blue-500 w-3 h-3"/>Show labels
            </label>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase mb-1">Planets</h4>
            {planets.map(p => (
              <button key={p.name} onClick={() => setSelected(selected===p.name?null:p.name)} className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded text-[10px] ${selected===p.name?'bg-blue-700 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-750'}`}>
                <span className="w-2 h-2 rounded-full" style={{background:p.color}}/>{p.name}
              </button>
            ))}
          </div>
          {selPlanet && (
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2.5">
              <h4 className="text-[10px] font-bold text-blue-300 mb-1">{selPlanet.name}</h4>
              <div className="text-[9px] text-gray-400 space-y-0.5">
                <p>Orbital period: {selPlanet.period} years</p>
                <p>Distance from Sun: {selPlanet.distance} (scaled AU)</p>
                <p>Moons shown: {selPlanet.moons?.length || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
