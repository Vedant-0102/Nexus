import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Info } from 'lucide-react';

interface StarStage { name: string; duration: number; color: string; radius: number; temp: number; description: string; }

export const StarLifeCycle: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [starMass, setStarMass] = useState<'low'|'medium'|'high'>('medium');
  const timeRef = useRef(0);

  const cycles: Record<string, StarStage[]> = {
    low: [
      { name: 'Nebula', duration: 3, color: '#8060c0', radius: 40, temp: 100, description: 'Gas and dust cloud begins to collapse under gravity.' },
      { name: 'Protostar', duration: 3, color: '#ff6040', radius: 25, temp: 3000, description: 'Core heats up as material accretes. Not yet fusing hydrogen.' },
      { name: 'Main Sequence', duration: 8, color: '#ffcc00', radius: 18, temp: 5000, description: 'Stable hydrogen fusion. Our Sun is in this stage.' },
      { name: 'Red Giant', duration: 3, color: '#ff4020', radius: 45, temp: 3500, description: 'Hydrogen exhausted in core. Outer layers expand & cool.' },
      { name: 'Planetary Nebula', duration: 2, color: '#60a0ff', radius: 50, temp: 30000, description: 'Outer layers ejected, exposing the hot core.' },
      { name: 'White Dwarf', duration: 4, color: '#e0e0ff', radius: 6, temp: 100000, description: 'Dense stellar remnant slowly cooling over billions of years.' },
    ],
    medium: [
      { name: 'Nebula', duration: 3, color: '#8060c0', radius: 45, temp: 100, description: 'Massive gas cloud collapses under its own gravity.' },
      { name: 'Protostar', duration: 2, color: '#ff8040', radius: 30, temp: 4000, description: 'Rapid accretion and heating of the core.' },
      { name: 'Main Sequence', duration: 6, color: '#ffffcc', radius: 22, temp: 10000, description: 'Hotter and brighter than low-mass stars. Burns hydrogen faster.' },
      { name: 'Red Supergiant', duration: 3, color: '#ff3010', radius: 60, temp: 3200, description: 'Massive expansion. Fuses heavier elements up to iron.' },
      { name: 'Supernova', duration: 1.5, color: '#ffffff', radius: 80, temp: 1000000, description: 'Catastrophic explosion! Outshines entire galaxies briefly.' },
      { name: 'Neutron Star', duration: 4, color: '#a0a0ff', radius: 5, temp: 600000, description: 'Ultra-dense remnant. A teaspoon weighs ~6 billion tons.' },
    ],
    high: [
      { name: 'Nebula', duration: 2, color: '#a060e0', radius: 50, temp: 100, description: 'Extremely massive cloud collapses rapidly.' },
      { name: 'Protostar', duration: 1.5, color: '#ffa060', radius: 35, temp: 5000, description: 'Rapid formation due to immense gravitational force.' },
      { name: 'Main Sequence', duration: 4, color: '#ccccff', radius: 28, temp: 30000, description: 'Blue-white supergiant. Burns through fuel extremely fast.' },
      { name: 'Red Supergiant', duration: 2, color: '#ff2000', radius: 70, temp: 3000, description: 'Onion-like layers of fusion (H→He→C→O→Si→Fe).' },
      { name: 'Supernova', duration: 1, color: '#ffffff', radius: 90, temp: 5000000, description: 'Violent explosion creating elements heavier than iron.' },
      { name: 'Black Hole', duration: 5, color: '#000000', radius: 12, temp: 0, description: 'Gravity so strong not even light can escape. Singularity forms.' },
    ],
  };

  const stages = cycles[starMass];
  const totalDuration = stages.reduce((a, s) => a + s.duration, 0);

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

      if (running) timeRef.current += 0.016 * speed;
      const t = timeRef.current;
      const cycleT = t % totalDuration;

      // Find current stage
      let elapsed = 0, stageIdx = 0, stageProgress = 0;
      for (let i = 0; i < stages.length; i++) {
        if (cycleT < elapsed + stages[i].duration) {
          stageIdx = i;
          stageProgress = (cycleT - elapsed) / stages[i].duration;
          break;
        }
        elapsed += stages[i].duration;
      }

      const stage = stages[stageIdx];
      const nextStage = stages[Math.min(stageIdx + 1, stages.length - 1)];
      const lerp = (a: number, b: number, t2: number) => a + (b - a) * t2;
      const easeProgress = stageProgress > 0.8 ? (stageProgress - 0.8) / 0.2 : 0;

      const currentRadius = lerp(stage.radius, nextStage.radius, easeProgress);

      // Stars background
      for (let i = 0; i < 120; i++) {
        const sx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 311.7) * 0.5 + 0.5) * h;
        ctx.fillStyle = `rgba(200,200,255,${0.2 + Math.sin(t * 0.5 + i) * 0.1})`;
        ctx.fillRect(sx, sy, 1, 1);
      }

      const cx = w * 0.45, cy = h * 0.45;
      const scale = Math.min(w, h) / 250;
      const displayR = currentRadius * scale;

      // Draw star based on stage
      if (stage.name === 'Nebula') {
        // Nebula - swirling gas
        for (let i = 0; i < 60; i++) {
          const angle = (i / 60) * Math.PI * 2 + t * 0.1;
          const dist = displayR * (0.3 + Math.sin(i * 3 + t) * 0.3 + Math.random() * 0.4);
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          const r2 = 3 + Math.random() * 5;
          ctx.fillStyle = `rgba(${130+Math.random()*60},${80+Math.random()*40},${180+Math.random()*60},${0.1 + Math.random()*0.1})`;
          ctx.beginPath(); ctx.arc(px, py, r2, 0, Math.PI * 2); ctx.fill();
        }
      } else if (stage.name === 'Supernova') {
        // Supernova explosion
        const explodeR = displayR * (0.3 + stageProgress * 2);
        for (let ring = 0; ring < 5; ring++) {
          const rr = explodeR * (0.5 + ring * 0.3);
          const alpha = 0.6 - ring * 0.1;
          ctx.strokeStyle = `rgba(255,${200-ring*30},${100-ring*20},${alpha})`;
          ctx.lineWidth = 3 - ring * 0.4;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        }
        // Core flash
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, explodeR * 0.3);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, explodeR * 0.3, 0, Math.PI * 2); ctx.fill();
      } else if (stage.name === 'Black Hole') {
        // Black hole with accretion disk
        const bhR = displayR;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx, cy, bhR, 0, Math.PI * 2); ctx.fill();
        // Event horizon glow
        ctx.strokeStyle = 'rgba(255,150,50,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, bhR + 3, 0, Math.PI * 2); ctx.stroke();
        // Accretion disk
        ctx.strokeStyle = 'rgba(255,200,50,0.4)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.ellipse(cx, cy, bhR * 3, bhR * 0.8, t * 0.1, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,100,20,0.3)'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(cx, cy, bhR * 2.5, bhR * 0.6, t * 0.1, 0, Math.PI * 2); ctx.stroke();
        // Gravitational lensing effect
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          const lr = bhR * 1.5 + i * 3;
          ctx.beginPath(); ctx.arc(cx, cy, lr, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (stage.name === 'Planetary Nebula') {
        // Central star
        ctx.fillStyle = '#a0c0ff';
        ctx.beginPath(); ctx.arc(cx, cy, displayR * 0.15, 0, Math.PI * 2); ctx.fill();
        // Expanding shells
        for (let i = 0; i < 3; i++) {
          const shellR = displayR * (0.4 + i * 0.25 + stageProgress * 0.1);
          ctx.strokeStyle = `rgba(${100+i*50},${150+i*30},255,${0.3 - i * 0.08})`;
          ctx.lineWidth = 3 - i;
          ctx.beginPath(); ctx.arc(cx, cy, shellR, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        // Normal star
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, displayR * 1.5);
        grad.addColorStop(0, stage.color === '#000000' ? '#333' : '#ffffff');
        grad.addColorStop(0.3, stage.color);
        grad.addColorStop(0.7, stage.color + '80');
        grad.addColorStop(1, stage.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cy, displayR * 1.5, 0, Math.PI * 2); ctx.fill();

        // Surface details
        ctx.fillStyle = stage.color;
        ctx.beginPath(); ctx.arc(cx, cy, displayR, 0, Math.PI * 2); ctx.fill();
        // Convection cells
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + t * 0.2;
          const d = displayR * 0.5;
          ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.sin(a + t) * 0.03})`;
          ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, displayR * 0.2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Stage name
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.8)' : 'rgba(30,40,80,0.8)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(stage.name, cx, h * 0.82);
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(80,90,130,0.6)'; ctx.font = '10px sans-serif';
      ctx.fillText(stage.description.slice(0, 60) + (stage.description.length > 60 ? '...' : ''), cx, h * 0.87);

      // Timeline at bottom
      const tlY = h - 25;
      let tlX = 20;
      const tlW = w - 40;
      stages.forEach((s, i) => {
        const sw = (s.duration / totalDuration) * tlW;
        ctx.fillStyle = i === stageIdx ? s.color + '60' : 'rgba(50,50,80,0.3)';
        ctx.fillRect(tlX, tlY, sw - 1, 16);
        if (i === stageIdx) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
          ctx.strokeRect(tlX, tlY, sw - 1, 16);
        }
        ctx.fillStyle = i === stageIdx ? 'rgba(255,255,255,0.9)' : 'rgba(200,200,255,0.4)';
        ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
        if (sw > 30) ctx.fillText(s.name.split(' ')[0], tlX + sw / 2, tlY + 10);
        tlX += sw;
      });

      // Progress indicator
      const progressX = 20 + (cycleT / totalDuration) * tlW;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(progressX, tlY - 3); ctx.lineTo(progressX - 3, tlY - 8); ctx.lineTo(progressX + 3, tlY - 8); ctx.closePath(); ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [running, speed, starMass]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-yellow-100 dark:from-gray-950 dark:to-yellow-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">⭐ Star Life Cycle</h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Stellar evolution from birth to death</p>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            <button onClick={() => setRunning(!running)} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium ${running?'bg-amber-600 text-white':'bg-yellow-600 text-white'}`}>
              {running?<><Pause className="h-3 w-3"/>Pause</>:<><Play className="h-3 w-3"/>Play</>}
            </button>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Star Mass</h4>
            {(['low','medium','high'] as const).map(m => (
              <button key={m} onClick={() => { setStarMass(m); timeRef.current = 0; }} className={`block w-full text-left px-2 py-1.5 rounded text-[10px] ${starMass===m?'bg-yellow-700 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {m === 'low' ? '☀ Low mass (< 8 M☉)' : m === 'medium' ? '🌟 Medium (8-25 M☉)' : '💫 High mass (> 25 M☉)'}
              </button>
            ))}
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <label className="text-[10px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Speed</span><span>{speed}x</span></label>
            <input type="range" min={0.5} max={5} step={0.5} value={speed} onChange={e=>setSpeed(+e.target.value)} className="w-full h-1 accent-yellow-500"/>
          </div>
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-1">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Endpoints</h4>
            <div className="text-[9px] text-gray-600 dark:text-gray-400 space-y-0.5">
              <p>Low mass → White Dwarf</p>
              <p>Medium → Neutron Star</p>
              <p>High mass → Black Hole</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
