import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Info } from 'lucide-react';

export const EclipseSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [eclipseType, setEclipseType] = useState<'solar'|'lunar'>('solar');
  const [viewMode, setViewMode] = useState<'space'|'earth'>('space');
  const timeRef = useRef(0);

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
      ctx.fillStyle = isDark ? '#030810' : '#f8f9fc'; ctx.fillRect(0, 0, w, h);

      if (running) timeRef.current += 0.008 * speed;
      const t = timeRef.current;

      // Stars
      for (let i = 0; i < 100; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h;
        ctx.fillStyle = `rgba(200,200,255,${0.2 + Math.sin(t * 2 + i) * 0.1})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      const cx = w / 2, cy = h * 0.45;
      const sunR = Math.min(w, h) * 0.13;
      const moonR = sunR * 0.28;
      const earthR = sunR * 0.3;

      if (eclipseType === 'solar') {
        if (viewMode === 'space') {
          // Top-down view: Sun on left, Moon passing between Sun and Earth
          const sunX = w * 0.15, sunY = cy;
          const earthX = w * 0.85, earthY = cy;

          // Sun
          const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
          sg.addColorStop(0, '#fff8e0'); sg.addColorStop(0.4, '#ffcc00'); sg.addColorStop(0.8, '#ff8800'); sg.addColorStop(1, 'rgba(255,100,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

          // Earth
          ctx.fillStyle = '#4090ff';
          ctx.beginPath(); ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#30a040';
          ctx.beginPath(); ctx.arc(earthX - 3, earthY - 3, earthR * 0.4, 0, Math.PI * 2); ctx.fill();

          // Moon orbit
          const orbitR = 60;
          ctx.strokeStyle = 'rgba(150,150,200,0.15)'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.arc(earthX, earthY, orbitR, 0, Math.PI * 2); ctx.stroke();

          // Moon
          const moonAngle = t * 0.8;
          const mx = earthX + Math.cos(moonAngle) * orbitR;
          const my = earthY + Math.sin(moonAngle) * orbitR;
          ctx.fillStyle = '#ccc';
          ctx.beginPath(); ctx.arc(mx, my, moonR, 0, Math.PI * 2); ctx.fill();

          // Shadow cone (when moon is between sun and earth)
          const moonToSunAngle = Math.atan2(sunY - my, sunX - mx);
          const moonToEarthAngle = Math.atan2(earthY - my, earthX - mx);
          const diff = Math.abs(moonToSunAngle - moonToEarthAngle);
          if (diff > Math.PI * 0.85 && diff < Math.PI * 1.15) {
            // Shadow cone
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.moveTo(mx + Math.cos(moonToSunAngle + Math.PI) * moonR, my + Math.sin(moonToSunAngle + Math.PI) * moonR);
            const shadowLen = 80;
            ctx.lineTo(mx + Math.cos(moonToSunAngle + Math.PI) * shadowLen + 15, my + Math.sin(moonToSunAngle + Math.PI) * shadowLen + 15);
            ctx.lineTo(mx + Math.cos(moonToSunAngle + Math.PI) * shadowLen - 15, my + Math.sin(moonToSunAngle + Math.PI) * shadowLen - 15);
            ctx.closePath(); ctx.fill();
          }

          // Labels
          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Sun', sunX, sunY + sunR + 15);
          ctx.fillText('Earth', earthX, earthY + earthR + 15);
          ctx.fillText('Moon', mx, my - moonR - 5);
          ctx.fillText('Solar Eclipse - Space View', cx, 20);

        } else {
          // Earth view - Moon covering the Sun
          const phase = (Math.sin(t * 0.3) + 1) / 2; // 0 to 1
          const moonOffsetX = (1 - phase) * sunR * 3 - sunR * 1.5;

          // Sun
          const sg = ctx.createRadialGradient(cx, cy, sunR * 0.8, cx, cy, sunR * 1.5);
          sg.addColorStop(0, '#ffcc00'); sg.addColorStop(0.5, '#ff880040'); sg.addColorStop(1, 'rgba(255,100,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(cx, cy, sunR * 1.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffdd44';
          ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();

          // Corona (visible during totality)
          const overlap = 1 - Math.abs(moonOffsetX) / (sunR * 0.5);
          if (overlap > 0.5) {
            ctx.strokeStyle = `rgba(255,220,180,${(overlap - 0.5) * 0.6})`;
            ctx.lineWidth = 3;
            for (let i = 0; i < 12; i++) {
              const a = (i / 12) * Math.PI * 2 + t * 0.1;
              const len = sunR * (1.2 + Math.sin(a * 3 + t) * 0.3);
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * sunR, cy + Math.sin(a) * sunR);
              ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
              ctx.stroke();
            }
          }

          // Moon silhouette
          ctx.fillStyle = '#0a0a15';
          ctx.beginPath(); ctx.arc(cx + moonOffsetX, cy, sunR * 0.95, 0, Math.PI * 2); ctx.fill();

          // Darkness level
          const darkness = Math.max(0, overlap - 0.3) * 0.7;
          ctx.fillStyle = `rgba(0,0,10,${darkness})`;
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.7)' : 'rgba(30,40,80,0.7)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Solar Eclipse - Earth View', cx, 20);
          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(80,90,130,0.6)'; ctx.font = '10px sans-serif';
          const eclPhase = overlap > 0.9 ? 'Total Eclipse!' : overlap > 0.3 ? 'Partial Eclipse' : 'No Eclipse';
          ctx.fillText(eclPhase, cx, h - 20);
        }

      } else {
        // Lunar eclipse
        if (viewMode === 'space') {
          // Sun on left, Earth in middle, Moon passing through Earth's shadow
          const sunX = w * 0.1, earthX2 = w * 0.5;

          // Sun
          const sg = ctx.createRadialGradient(sunX, cy, 0, sunX, cy, sunR * 0.8);
          sg.addColorStop(0, '#ffee88'); sg.addColorStop(0.5, '#ff8800'); sg.addColorStop(1, 'rgba(255,100,0,0)');
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(sunX, cy, sunR * 0.8, 0, Math.PI * 2); ctx.fill();

          // Earth
          ctx.fillStyle = '#4090ff';
          ctx.beginPath(); ctx.arc(earthX2, cy, earthR, 0, Math.PI * 2); ctx.fill();

          // Earth shadow cone
          ctx.fillStyle = 'rgba(0,0,20,0.2)';
          ctx.beginPath();
          ctx.moveTo(earthX2 + earthR, cy - earthR);
          ctx.lineTo(w, cy - earthR * 0.6);
          ctx.lineTo(w, cy + earthR * 0.6);
          ctx.lineTo(earthX2 + earthR, cy + earthR);
          ctx.closePath(); ctx.fill();

          // Moon
          const moonX = earthX2 + 100 + Math.sin(t * 0.3) * 30;
          const moonY = cy + Math.cos(t * 0.5) * 40;
          const inShadow = moonY > cy - earthR * 0.8 && moonY < cy + earthR * 0.8 && moonX > earthX2;

          ctx.fillStyle = inShadow ? '#8b2020' : '#ccc';
          ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();

          if (inShadow) {
            ctx.fillStyle = 'rgba(139,32,32,0.3)';
            ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 1.3, 0, Math.PI * 2); ctx.fill();
          }

          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Sun', sunX, cy + sunR + 15);
          ctx.fillText('Earth', earthX2, cy + earthR + 15);
          ctx.fillText('Moon', moonX, moonY - moonR - 5);
          ctx.fillText('Lunar Eclipse - Space View', cx, 20);
        } else {
          // Earth view - Moon turning red
          const phase = (Math.sin(t * 0.3) + 1) / 2;
          const inEclipse = phase > 0.3 && phase < 0.7;
          const eclipseDepth = inEclipse ? Math.min(1, (Math.min(phase, 1 - phase) - 0.3) * 5) : 0;

          // Moon
          const moonColor = inEclipse
            ? `rgb(${Math.floor(139 + (200 - 139) * (1 - eclipseDepth))},${Math.floor(32 + (200 - 32) * (1 - eclipseDepth))},${Math.floor(32 + (200 - 32) * (1 - eclipseDepth))})`
            : '#ccc';

          ctx.fillStyle = moonColor;
          ctx.beginPath(); ctx.arc(cx, cy, sunR * 1.2, 0, Math.PI * 2); ctx.fill();

          // Craters
          const craters = [[0.2, -0.3, 0.12], [-0.3, 0.2, 0.08], [0.1, 0.15, 0.1]];
          craters.forEach(([x, y, r2]) => {
            ctx.fillStyle = inEclipse ? 'rgba(100,20,20,0.3)' : 'rgba(150,150,150,0.3)';
            ctx.beginPath(); ctx.arc(cx + x * sunR, cy + y * sunR, r2 * sunR, 0, Math.PI * 2); ctx.fill();
          });

          // Earth's shadow
          if (inEclipse) {
            const shadowX = cx + (0.5 - phase) * sunR * 4;
            ctx.fillStyle = `rgba(0,0,20,${eclipseDepth * 0.6})`;
            ctx.beginPath(); ctx.arc(shadowX, cy, sunR * 1.4, 0, Math.PI * 2); ctx.fill();
          }

          // Blood moon glow
          if (eclipseDepth > 0.5) {
            const bg = ctx.createRadialGradient(cx, cy, sunR * 0.8, cx, cy, sunR * 1.8);
            bg.addColorStop(0, 'rgba(139,32,32,0)'); bg.addColorStop(0.5, `rgba(139,32,32,${(eclipseDepth - 0.5) * 0.3})`); bg.addColorStop(1, 'rgba(139,32,32,0)');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.arc(cx, cy, sunR * 1.8, 0, Math.PI * 2); ctx.fill();
          }

          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.7)' : 'rgba(30,40,80,0.7)'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('Lunar Eclipse - Earth View', cx, 20);
          ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(80,90,130,0.6)'; ctx.font = '10px sans-serif';
          const label = eclipseDepth > 0.8 ? 'Total Lunar Eclipse (Blood Moon)' : eclipseDepth > 0 ? 'Partial Lunar Eclipse' : 'Full Moon';
          ctx.fillText(label, cx, h - 20);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, eclipseType, viewMode]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-950 dark:to-slate-900 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">🌑 Eclipse Simulator</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Solar and lunar eclipse mechanics</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-slate-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Eclipse Type</h4>
            <button onClick={() => setEclipseType('solar')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${eclipseType==='solar'?'bg-yellow-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>☀️ Solar Eclipse</button>
            <button onClick={() => setEclipseType('lunar')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${eclipseType==='lunar'?'bg-red-800 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>🌙 Lunar Eclipse</button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">View</h4>
            <button onClick={() => setViewMode('space')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${viewMode==='space'?'bg-blue-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>🛰 Space View</button>
            <button onClick={() => setViewMode('earth')} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${viewMode==='earth'?'bg-green-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>🌍 Earth View</button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-slate-500"/>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3"/> Info</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-1">
              {eclipseType === 'solar'
                ? <p>A solar eclipse occurs when the Moon passes between the Sun and Earth, blocking sunlight. The Sun's corona becomes visible during totality.</p>
                : <p>A lunar eclipse occurs when Earth passes between Sun and Moon. Earth's shadow makes the Moon appear red ("Blood Moon") due to Rayleigh scattering.</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
