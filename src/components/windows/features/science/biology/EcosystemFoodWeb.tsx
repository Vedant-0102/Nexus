import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Organism {
  id: string; name: string; level: number; population: number; maxPop: number;
  x: number; y: number; color: string; emoji: string; growthRate: number;
}

interface Link { predator: string; prey: string; strength: number; }

export const EcosystemFoodWeb: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timeRef = useRef(0);
  const [speed, setSpeed] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const orgsRef = useRef<Organism[]>([
    { id:'grass', name:'Grass', level:0, population:800, maxPop:1000, x:0.15, y:0.82, color:'#4ade80', emoji:'🌿', growthRate:0.03 },
    { id:'algae', name:'Algae', level:0, population:600, maxPop:800, x:0.45, y:0.85, color:'#22c55e', emoji:'🌱', growthRate:0.04 },
    { id:'berries', name:'Berries', level:0, population:500, maxPop:700, x:0.75, y:0.82, color:'#f472b6', emoji:'🫐', growthRate:0.025 },
    { id:'rabbit', name:'Rabbit', level:1, population:200, maxPop:400, x:0.1, y:0.55, color:'#fbbf24', emoji:'🐇', growthRate:0.02 },
    { id:'deer', name:'Deer', level:1, population:150, maxPop:300, x:0.4, y:0.52, color:'#d97706', emoji:'🦌', growthRate:0.015 },
    { id:'fish', name:'Fish', level:1, population:250, maxPop:500, x:0.7, y:0.55, color:'#60a5fa', emoji:'🐟', growthRate:0.02 },
    { id:'bird', name:'Bird', level:1, population:180, maxPop:350, x:0.88, y:0.52, color:'#818cf8', emoji:'🐦', growthRate:0.018 },
    { id:'fox', name:'Fox', level:2, population:60, maxPop:150, x:0.2, y:0.28, color:'#f97316', emoji:'🦊', growthRate:0.008 },
    { id:'snake', name:'Snake', level:2, population:80, maxPop:200, x:0.55, y:0.25, color:'#a3e635', emoji:'🐍', growthRate:0.01 },
    { id:'hawk', name:'Hawk', level:2, population:40, maxPop:100, x:0.8, y:0.28, color:'#a78bfa', emoji:'🦅', growthRate:0.006 },
    { id:'wolf', name:'Wolf', level:3, population:20, maxPop:50, x:0.35, y:0.08, color:'#94a3b8', emoji:'🐺', growthRate:0.003 },
    { id:'eagle', name:'Eagle', level:3, population:15, maxPop:40, x:0.65, y:0.08, color:'#eab308', emoji:'🦅', growthRate:0.002 },
  ]);

  const links: Link[] = [
    { predator:'rabbit', prey:'grass', strength:0.0003 },
    { predator:'deer', prey:'grass', strength:0.0002 },
    { predator:'deer', prey:'berries', strength:0.0002 },
    { predator:'fish', prey:'algae', strength:0.0003 },
    { predator:'bird', prey:'berries', strength:0.0002 },
    { predator:'bird', prey:'algae', strength:0.0001 },
    { predator:'fox', prey:'rabbit', strength:0.0004 },
    { predator:'fox', prey:'bird', strength:0.0002 },
    { predator:'snake', prey:'rabbit', strength:0.0003 },
    { predator:'snake', prey:'fish', strength:0.0002 },
    { predator:'hawk', prey:'rabbit', strength:0.0003 },
    { predator:'hawk', prey:'fish', strength:0.0002 },
    { predator:'hawk', prey:'bird', strength:0.0003 },
    { predator:'wolf', prey:'deer', strength:0.0005 },
    { predator:'wolf', prey:'fox', strength:0.0003 },
    { predator:'eagle', prey:'snake', strength:0.0004 },
    { predator:'eagle', prey:'fish', strength:0.0003 },
    { predator:'eagle', prey:'hawk', strength:0.0002 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d; canvas.height = r.height * d;
      ctx.scale(d, d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a1020'; ctx.fillRect(0, 0, w, h);

      if (isPlaying) {
        timeRef.current += 0.016 * speed;
        const orgs = orgsRef.current;
        // Lotka-Volterra style update
        for (const o of orgs) {
          if (o.level === 0) {
            o.population += o.growthRate * o.population * (1 - o.population / o.maxPop) * speed;
          } else {
            o.population -= 0.005 * o.population * speed; // natural death
          }
        }
        for (const l of links) {
          const pred = orgs.find(o => o.id === l.predator)!;
          const prey = orgs.find(o => o.id === l.prey)!;
          const eaten = l.strength * pred.population * prey.population * speed;
          prey.population -= eaten;
          pred.population += eaten * 0.3;
        }
        for (const o of orgs) {
          o.population = Math.max(2, Math.min(o.maxPop, o.population));
        }
      }

      const orgs = orgsRef.current;
      // Trophic level bands
      const levelLabels = ['Producers', 'Primary Consumers', 'Secondary Consumers', 'Apex Predators'];
      for (let lv = 0; lv < 4; lv++) {
        const bandY = h * (0.85 - lv * 0.25);
        ctx.fillStyle = `rgba(100, 150, 255, ${0.02 + lv * 0.01})`;
        ctx.fillRect(0, bandY - h * 0.1, w, h * 0.2);
        ctx.fillStyle = 'rgba(200,200,255,0.15)';
        ctx.font = '9px sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(levelLabels[lv], w - 8, bandY - h * 0.08);
      }

      // Draw links
      for (const l of links) {
        const pred = orgs.find(o => o.id === l.predator)!;
        const prey = orgs.find(o => o.id === l.prey)!;
        const flow = l.strength * pred.population * prey.population;
        const alpha = Math.min(0.4, flow * 0.5);
        ctx.strokeStyle = `rgba(255,200,100,${alpha})`;
        ctx.lineWidth = Math.max(0.5, flow * 3);
        ctx.beginPath();
        ctx.moveTo(prey.x * w, prey.y * h);
        ctx.lineTo(pred.x * w, pred.y * h);
        ctx.stroke();
        // Arrow
        const mx = (prey.x * w + pred.x * w * 2) / 3;
        const my = (prey.y * h + pred.y * h * 2) / 3;
        ctx.fillStyle = `rgba(255,200,100,${alpha})`;
        ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2); ctx.fill();
      }

      // Draw organisms
      for (const o of orgs) {
        const ox = o.x * w, oy = o.y * h;
        const radius = 12 + (o.population / o.maxPop) * 20;
        const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius + 10);
        glow.addColorStop(0, o.color + '40');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(ox, oy, radius + 10, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = o.color + '30';
        ctx.beginPath(); ctx.arc(ox, oy, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = o.color; ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = `${14 + (o.population / o.maxPop) * 8}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.emoji, ox, oy);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '9px sans-serif'; ctx.textBaseline = 'top';
        ctx.fillText(o.name, ox, oy + radius + 3);
        ctx.fillStyle = o.color;
        ctx.font = '8px monospace';
        ctx.fillText(`${Math.round(o.population)}`, ox, oy + radius + 14);
      }
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [isPlaying, speed]);

  const reset = () => {
    orgsRef.current.forEach(o => { o.population = o.maxPop * 0.5; });
    timeRef.current = 0;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-green-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">🌍 Ecosystem Food Web</h2>
          <p className="text-[11px] text-gray-400">Predator-prey dynamics & trophic levels</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900/50 text-green-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
        <div className="w-[200px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Speed</h4>
            <input type="range" min="0.2" max="5" step="0.2" value={speed} onChange={e => setSpeed(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            <span className="text-[10px] text-gray-500">{speed.toFixed(1)}x</span>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1.5">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Populations</h4>
            {orgsRef.current.map(o => (
              <div key={o.id} className="flex items-center justify-between text-[9px]">
                <span style={{ color: o.color }}>{o.emoji} {o.name}</span>
                <span className="font-mono text-gray-400">{Math.round(o.population)}</span>
              </div>
            ))}
          </div>
          <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-green-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> Ecology</h4>
            <p className="text-[9px] text-gray-400">Energy flows from producers → consumers → apex predators. Each level sustains ~10% of energy from below (10% rule). Populations oscillate following Lotka-Volterra dynamics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
