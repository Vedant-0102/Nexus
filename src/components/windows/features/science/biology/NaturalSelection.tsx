import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Creature {
  x: number; y: number; speed: number; size: number;
  color: string; fitness: number; genes: { r: number; g: number; b: number; spd: number; sz: number };
  energy: number; age: number;
}

export const NaturalSelection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [generation, setGeneration] = useState(1);
  const [envColor, setEnvColor] = useState<'green'|'sand'|'snow'|'dark'>('green');
  const [predatorSpeed, setPredatorSpeed] = useState(2);
  const [mutationRate, setMutationRate] = useState(15);
  const creaturesRef = useRef<Creature[]>([]);
  const foodRef = useRef<{x:number;y:number}[]>([]);
  const timeRef = useRef(0);
  const genTimeRef = useRef(0);
  const statsRef = useRef<{gen:number;avgFit:number;pop:number}[]>([]);

  const envColors: Record<string, string> = {
    green: '#1a4a1a', sand: '#5a4a2a', snow: '#c0c8d0', dark: '#151520',
  };
  const envTargetRGB: Record<string, number[]> = {
    green: [40, 120, 40], sand: [160, 140, 80], snow: [200, 210, 220], dark: [30, 30, 50],
  };

  const initCreatures = () => {
    const c: Creature[] = [];
    for (let i = 0; i < 40; i++) {
      const genes = { r: Math.random()*255, g: Math.random()*255, b: Math.random()*255, spd: 0.5+Math.random()*3, sz: 3+Math.random()*6 };
      c.push({
        x: Math.random()*0.9+0.05, y: Math.random()*0.9+0.05,
        speed: genes.spd, size: genes.sz,
        color: `rgb(${Math.round(genes.r)},${Math.round(genes.g)},${Math.round(genes.b)})`,
        fitness: 0, genes, energy: 100, age: 0,
      });
    }
    creaturesRef.current = c;
    foodRef.current = Array.from({length:30}, () => ({x:Math.random()*0.9+0.05, y:Math.random()*0.9+0.05}));
    genTimeRef.current = 0;
    statsRef.current = [];
    setGeneration(1);
  };

  useEffect(() => { initCreatures(); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio||1;
      canvas.width = r.width*d; canvas.height = r.height*d; ctx.scale(d,d);
    };
    resize();
    const obs = new ResizeObserver(resize); obs.observe(canvas);

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const r = canvas.getBoundingClientRect();
      const w = r.width, h = r.height;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = envColors[envColor]; ctx.fillRect(0,0,w,h);

      if (!isPlaying) return;
      timeRef.current += 0.016;
      genTimeRef.current += 0.016;
      const creatures = creaturesRef.current;
      const food = foodRef.current;
      const target = envTargetRGB[envColor];

      // Move creatures toward food
      for (const c of creatures) {
        c.age += 0.016;
        c.energy -= 0.1 + c.speed * 0.05 + c.size * 0.02;
        let nearFood = food[0], minD = 999;
        for (const f of food) {
          const d = Math.hypot(f.x-c.x, f.y-c.y);
          if (d < minD) { minD = d; nearFood = f; }
        }
        if (nearFood && minD > 0.02) {
          const dx = nearFood.x-c.x, dy = nearFood.y-c.y, d = Math.hypot(dx,dy);
          c.x += (dx/d)*c.speed*0.003;
          c.y += (dy/d)*c.speed*0.003;
        }
        // Eat food
        if (nearFood && minD < 0.025) {
          c.energy += 40;
          const idx = food.indexOf(nearFood);
          if (idx >= 0) food.splice(idx, 1);
        }
        // Camouflage fitness (how well creature blends with environment)
        const camoDist = Math.sqrt((c.genes.r-target[0])**2 + (c.genes.g-target[1])**2 + (c.genes.b-target[2])**2);
        c.fitness = Math.max(0, 1 - camoDist / 441);
        // Predator: worse camo = more likely to be eaten
        if (Math.random() < (1 - c.fitness) * predatorSpeed * 0.0005) {
          c.energy = 0;
        }
        c.x = Math.max(0.02, Math.min(0.98, c.x));
        c.y = Math.max(0.02, Math.min(0.98, c.y));
      }

      // Respawn food
      if (food.length < 15 && Math.random() < 0.1) {
        food.push({x:Math.random()*0.9+0.05, y:Math.random()*0.9+0.05});
      }

      // Remove dead
      creaturesRef.current = creatures.filter(c => c.energy > 0);

      // Generation cycle
      if (genTimeRef.current > 8 || creaturesRef.current.length < 5) {
        const alive = creaturesRef.current;
        const avgFit = alive.length > 0 ? alive.reduce((s,c) => s+c.fitness, 0)/alive.length : 0;
        statsRef.current.push({gen:generation, avgFit, pop:alive.length});
        if (statsRef.current.length > 30) statsRef.current.shift();

        // Select fittest for reproduction
        alive.sort((a,b) => b.fitness + b.energy/100 - a.fitness - a.energy/100);
        const parents = alive.slice(0, Math.max(4, Math.floor(alive.length * 0.4)));
        const newGen: Creature[] = [];
        for (let i = 0; i < 40; i++) {
          const p = parents[Math.floor(Math.random()*parents.length)];
          const mr = mutationRate / 100;
          const genes = {
            r: Math.max(0, Math.min(255, p.genes.r + (Math.random()-0.5)*100*mr)),
            g: Math.max(0, Math.min(255, p.genes.g + (Math.random()-0.5)*100*mr)),
            b: Math.max(0, Math.min(255, p.genes.b + (Math.random()-0.5)*100*mr)),
            spd: Math.max(0.3, Math.min(5, p.genes.spd + (Math.random()-0.5)*mr*2)),
            sz: Math.max(2, Math.min(10, p.genes.sz + (Math.random()-0.5)*mr*3)),
          };
          newGen.push({
            x: Math.random()*0.9+0.05, y: Math.random()*0.9+0.05,
            speed: genes.spd, size: genes.sz,
            color: `rgb(${Math.round(genes.r)},${Math.round(genes.g)},${Math.round(genes.b)})`,
            fitness: 0, genes, energy: 100, age: 0,
          });
        }
        creaturesRef.current = newGen;
        foodRef.current = Array.from({length:30}, () => ({x:Math.random()*0.9+0.05, y:Math.random()*0.9+0.05}));
        genTimeRef.current = 0;
        setGeneration(g => g + 1);
      }

      // Draw food
      for (const f of food) {
        ctx.fillStyle = 'rgba(100,255,100,0.6)';
        ctx.beginPath(); ctx.arc(f.x*w, f.y*h, 3, 0, Math.PI*2); ctx.fill();
      }

      // Draw creatures
      for (const c of creaturesRef.current) {
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.arc(c.x*w, c.y*h, c.size, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
      }

      // Mini graph
      const stats = statsRef.current;
      if (stats.length > 1) {
        const gx = 10, gy = h - 60, gw = 120, gh = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(gx,gy,gw,gh);
        ctx.strokeStyle = 'rgba(100,255,150,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
        stats.forEach((s,i) => {
          const x = gx + (i/(stats.length-1))*gw;
          const y = gy + gh - s.avgFit * gh;
          i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        });
        ctx.stroke();
        ctx.fillStyle='rgba(200,255,200,0.4)'; ctx.font='7px monospace'; ctx.textAlign='left';
        ctx.fillText('Avg Fitness', gx+2, gy+8);
      }
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); obs.disconnect(); };
  }, [isPlaying, envColor, predatorSpeed, mutationRate, generation]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-950 to-emerald-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">🧬 Natural Selection Simulator</h2>
          <p className="text-[11px] text-gray-400">Generation {generation} — Camouflage evolution</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 text-emerald-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button onClick={initCreatures} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs font-medium">
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
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase">Environment</h4>
            {(['green','sand','snow','dark'] as const).map(e => (
              <button key={e} onClick={() => setEnvColor(e)} className={`block w-full text-left px-2 py-1 rounded text-[10px] ${envColor===e?'bg-emerald-600 text-white':'bg-gray-800 text-gray-400'}`}>
                {e.charAt(0).toUpperCase()+e.slice(1)}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Predator Pressure: {predatorSpeed}</label>
              <input type="range" min="0" max="5" step="0.5" value={predatorSpeed} onChange={e => setPredatorSpeed(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">Mutation Rate: {mutationRate}%</label>
              <input type="range" min="1" max="50" step="1" value={mutationRate} onChange={e => setMutationRate(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1 mb-1"><Info className="h-3 w-3" /> Evolution</h4>
            <p className="text-[9px] text-gray-400">Organisms that blend with the environment survive longer. Over generations, the population evolves to match the background color through natural selection. Change the environment to see re-adaptation!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
