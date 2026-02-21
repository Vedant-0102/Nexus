import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Info } from 'lucide-react';

export const SeasonsEarthTilt: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [hemisphere, setHemisphere] = useState<'north'|'south'>('north');
  const timeRef = useRef(0);

  const seasons = [
    { name: 'Spring Equinox', month: 'March', angle: 0 },
    { name: 'Summer Solstice', month: 'June', angle: Math.PI / 2 },
    { name: 'Autumn Equinox', month: 'September', angle: Math.PI },
    { name: 'Winter Solstice', month: 'December', angle: Math.PI * 1.5 },
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
      ctx.fillStyle = isDark ? '#050810' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      if (running) timeRef.current += 0.005 * speed;
      const t = timeRef.current;
      const orbitAngle = t % (Math.PI * 2);

      // Stars
      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h;
        ctx.fillStyle = `rgba(200,200,255,${0.15 + Math.sin(t * 10 + i) * 0.05})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      const cx = w / 2, cy = h * 0.42;
      const orbitRx = Math.min(w * 0.38, 200);
      const orbitRy = orbitRx * 0.35;

      // Sun at center
      const sunR = 22;
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2);
      sg.addColorStop(0, '#fff8e0'); sg.addColorStop(0.3, '#ffcc00'); sg.addColorStop(0.7, '#ff8800'); sg.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx, cy, sunR * 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();

      // Orbit path
      ctx.strokeStyle = 'rgba(100,130,200,0.15)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, orbitRx, orbitRy, 0, 0, Math.PI * 2); ctx.stroke();

      // Season markers
      seasons.forEach((s, i) => {
        const a = s.angle;
        const sx = cx + Math.cos(a) * orbitRx;
        const sy = cy + Math.sin(a) * orbitRy;
        ctx.fillStyle = 'rgba(100,130,200,0.2)';
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(200,200,255,0.3)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        const labelY = i < 2 ? sy - 8 : sy + 12;
        ctx.fillText(s.month, sx, labelY);
      });

      // Earth position on orbit
      const earthX = cx + Math.cos(orbitAngle) * orbitRx;
      const earthY = cy + Math.sin(orbitAngle) * orbitRy;
      const earthR = 16;
      const tiltAngle = 23.5 * Math.PI / 180;

      // Draw Earth with tilt
      ctx.save();
      ctx.translate(earthX, earthY);

      // Axial tilt line (always points same direction in space)
      const axisX = Math.sin(tiltAngle) * earthR * 1.8;
      const axisY = -Math.cos(tiltAngle) * earthR * 1.8;
      ctx.strokeStyle = 'rgba(255,100,100,0.5)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(-axisX, -axisY); ctx.lineTo(axisX, axisY); ctx.stroke();
      ctx.setLineDash([]);

      // Earth body
      ctx.fillStyle = '#4090ff';
      ctx.beginPath(); ctx.arc(0, 0, earthR, 0, Math.PI * 2); ctx.fill();

      // Continents (simplified)
      ctx.fillStyle = '#30a040';
      ctx.beginPath(); ctx.ellipse(-3, -4, 5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, 2, 4, 5, -0.2, 0, Math.PI * 2); ctx.fill();

      // Equator
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.ellipse(0, 0, earthR, earthR * 0.3, 0, 0, Math.PI * 2); ctx.stroke();

      // Day/night terminator (based on sun direction)
      const sunDir = Math.atan2(cy - earthY, cx - earthX);
      ctx.fillStyle = 'rgba(0,0,20,0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, earthR, sunDir + Math.PI / 2, sunDir - Math.PI / 2);
      ctx.closePath(); ctx.fill();

      // N/S poles
      const northY = -Math.cos(tiltAngle) * earthR * 0.8;
      const northX = Math.sin(tiltAngle) * earthR * 0.8;
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('N', northX, northY + 3);
      ctx.fillText('S', -northX, -northY + 3);

      ctx.restore();

      // Determine current season
      let closestSeason = 0;
      let minDist = Infinity;
      seasons.forEach((s, i) => {
        let diff = Math.abs(orbitAngle - s.angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < minDist) { minDist = diff; closestSeason = i; }
      });

      const currentSeason = hemisphere === 'north' ? seasons[closestSeason] : seasons[(closestSeason + 2) % 4];

      // Info box at bottom
      const infoY = h * 0.72;
      ctx.fillStyle = 'rgba(20,25,40,0.8)';
      ctx.fillRect(20, infoY, w - 40, h - infoY - 10);
      ctx.strokeStyle = 'rgba(100,130,200,0.3)'; ctx.lineWidth = 1;
      ctx.strokeRect(20, infoY, w - 40, h - infoY - 10);

      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.8)' : 'rgba(30,40,80,0.8)'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${currentSeason.name} (${hemisphere === 'north' ? 'Northern' : 'Southern'} Hemisphere)`, cx, infoY + 18);

      // Sunlight intensity visualization
      const tiltEffect = Math.sin(orbitAngle) * (hemisphere === 'north' ? 1 : -1);
      const intensity = 0.5 + tiltEffect * 0.4;
      const barW = 120;
      ctx.fillStyle = 'rgba(50,50,80,0.3)';
      ctx.fillRect(cx - barW / 2, infoY + 28, barW, 10);
      const iGrad = ctx.createLinearGradient(cx - barW / 2, 0, cx + barW / 2, 0);
      iGrad.addColorStop(0, '#3060ff'); iGrad.addColorStop(0.5, '#ffcc00'); iGrad.addColorStop(1, '#ff4400');
      ctx.fillStyle = iGrad;
      ctx.fillRect(cx - barW / 2, infoY + 28, barW * intensity, 10);
      ctx.fillStyle = 'rgba(200,200,255,0.4)'; ctx.font = '8px sans-serif';
      ctx.fillText(`Sunlight intensity: ${(intensity * 100).toFixed(0)}%`, cx, infoY + 52);

      // Day length
      const dayLength = 12 + tiltEffect * 6;
      ctx.fillText(`Day length: ~${dayLength.toFixed(1)} hours`, cx, infoY + 64);

      // Tilt info
      ctx.fillStyle = 'rgba(255,100,100,0.5)'; ctx.font = '9px sans-serif';
      ctx.fillText('Earth\'s axial tilt: 23.5°', cx, infoY + 78);

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, hemisphere]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-green-100 dark:from-gray-950 dark:to-green-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🌎 Seasons & Earth Tilt</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Axial tilt and seasonal changes</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-green-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Hemisphere</h4>
            <button onClick={() => setHemisphere('north')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${hemisphere==='north'?'bg-green-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>🌐 Northern</button>
            <button onClick={() => setHemisphere('south')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${hemisphere==='south'?'bg-green-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>🌏 Southern</button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-green-500"/>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-green-700 dark:text-green-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/> Why Seasons?</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
              <p>Earth's axis is tilted 23.5° relative to its orbital plane.</p>
              <p>When a hemisphere tilts toward the Sun, it receives more direct sunlight → <strong>summer</strong>.</p>
              <p>When tilted away → less direct light, shorter days → <strong>winter</strong>.</p>
              <p>Seasons are <strong>opposite</strong> in Northern vs Southern hemispheres.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
