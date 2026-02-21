import React, { useState, useRef, useEffect } from 'react';
import { Waves, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface FluidParticle {
  x: number;
  y: number;
  vy: number;
}

export const Buoyancy: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [objectDensity, setObjectDensity] = useState(500); // kg/m³
  const [fluidDensity, setFluidDensity] = useState(1000); // kg/m³ (water)
  const [objectVolume, setObjectVolume] = useState(50); // scaled
  const [showForces, setShowForces] = useState(true);
  const timeRef = useRef(0);
  const objectYRef = useRef(200);
  const objectVyRef = useRef(0);
  const bubblesRef = useRef<FluidParticle[]>([]);

  const presets = [
    { name: 'Wood in Water', od: 600, fd: 1000 },
    { name: 'Ice in Water', od: 917, fd: 1000 },
    { name: 'Steel in Water', od: 7800, fd: 1000 },
    { name: 'Cork in Mercury', od: 200, fd: 13534 },
    { name: 'Lead in Mercury', od: 11340, fd: 13534 },
  ];

  const resetSimulation = () => {
    objectYRef.current = 200;
    objectVyRef.current = 0;
    timeRef.current = 0;
    bubblesRef.current = [];
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
      timeRef.current += 0.016;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const waterlineY = h * 0.35;
      const objSize = Math.cbrt(objectVolume) * 5;
      const objCenterX = w * 0.4;
      const g = 9.81;
      const dt = 0.05;
      const damping = 0.97;

      // Physics
      let objY = objectYRef.current;
      const objTop = objY - objSize;
      const objBot = objY + objSize;

      // Submerged fraction
      let submergedFraction = 0;
      if (objBot <= waterlineY) {
        submergedFraction = 0;
      } else if (objTop >= waterlineY) {
        submergedFraction = 1;
      } else {
        submergedFraction = (objBot - waterlineY) / (objSize * 2);
      }

      const mass = objectDensity * objectVolume * 0.001;
      const weight = mass * g;
      const buoyantForce = fluidDensity * objectVolume * 0.001 * g * submergedFraction;
      const netForce = weight - buoyantForce;

      // Drag in fluid
      const dragCoeff = submergedFraction > 0 ? 0.3 : 0.01;
      const drag = dragCoeff * objectVyRef.current * Math.abs(objectVyRef.current);

      objectVyRef.current += (netForce / mass - drag / mass) * dt;
      objectVyRef.current *= damping;
      objectYRef.current += objectVyRef.current;

      // Boundary checks
      if (objectYRef.current + objSize > h - 20) {
        objectYRef.current = h - 20 - objSize;
        objectVyRef.current *= -0.3;
      }
      if (objectYRef.current - objSize < 20) {
        objectYRef.current = 20 + objSize;
        objectVyRef.current *= -0.3;
      }

      objY = objectYRef.current;

      // Background (sky)
      const isDark = document.documentElement.classList.contains('dark');
      const skyGrad = ctx.createLinearGradient(0, 0, 0, waterlineY);
      skyGrad.addColorStop(0, isDark ? '#1a2a4a' : '#c8daf0');
      skyGrad.addColorStop(1, isDark ? '#2a3a5a' : '#e0eaf8');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, waterlineY);

      // Container walls
      ctx.strokeStyle = 'rgba(150, 180, 200, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, 20);
      ctx.lineTo(w * 0.08, h - 15);
      ctx.lineTo(w * 0.72, h - 15);
      ctx.lineTo(w * 0.72, 20);
      ctx.stroke();

      // Fluid
      const fluidColor = fluidDensity > 5000 ? 'rgba(180, 180, 200, 0.4)' : 'rgba(50, 120, 200, 0.25)';
      ctx.fillStyle = fluidColor;
      ctx.fillRect(w * 0.08, waterlineY, w * 0.64, h - waterlineY - 15);

      // Water surface wave
      ctx.strokeStyle = fluidDensity > 5000 ? 'rgba(200, 200, 220, 0.6)' : 'rgba(100, 180, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = w * 0.08; x <= w * 0.72; x += 2) {
        const wave = Math.sin(x * 0.05 + timeRef.current * 2) * 2;
        if (x === w * 0.08) ctx.moveTo(x, waterlineY + wave);
        else ctx.lineTo(x, waterlineY + wave);
      }
      ctx.stroke();

      // Bubbles
      if (submergedFraction > 0 && Math.random() < 0.1) {
        bubblesRef.current.push({
          x: objCenterX + (Math.random() - 0.5) * objSize * 2,
          y: objY + objSize,
          vy: -1 - Math.random() * 2,
        });
      }
      bubblesRef.current = bubblesRef.current.filter(b => {
        b.y += b.vy;
        b.x += Math.sin(b.y * 0.1) * 0.3;
        if (b.y < waterlineY) return false;
        ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // Object
      const subColor = objectDensity < fluidDensity ? '#e8a340' : '#a05a30';
      ctx.fillStyle = subColor;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(objCenterX - objSize, objY - objSize, objSize * 2, objSize * 2);
      ctx.fill();
      ctx.stroke();

      // Waterline indicator on object
      if (submergedFraction > 0 && submergedFraction < 1) {
        ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(objCenterX - objSize - 5, waterlineY);
        ctx.lineTo(objCenterX + objSize + 5, waterlineY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Density label on object
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${objectDensity}`, objCenterX, objY - 3);
      ctx.fillText('kg/m³', objCenterX, objY + 10);

      // Force arrows
      if (showForces) {
        const arrowScale = 0.15;
        const maxArrowLen = 80;

        // Weight (down, red)
        const weightLen = Math.min(weight * arrowScale, maxArrowLen);
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
        ctx.lineWidth = 2.5;
        const wStartY = objY + objSize + 5;
        ctx.beginPath();
        ctx.moveTo(objCenterX, wStartY);
        ctx.lineTo(objCenterX, wStartY + weightLen);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(objCenterX, wStartY + weightLen + 5);
        ctx.lineTo(objCenterX - 5, wStartY + weightLen - 3);
        ctx.lineTo(objCenterX + 5, wStartY + weightLen - 3);
        ctx.fill();
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Fg = ${weight.toFixed(1)} N`, objCenterX + 10, wStartY + weightLen / 2);

        // Buoyant force (up, blue)
        if (buoyantForce > 0.01) {
          const buoyLen = Math.min(buoyantForce * arrowScale, maxArrowLen);
          ctx.strokeStyle = 'rgba(100, 180, 255, 0.8)';
          ctx.fillStyle = 'rgba(100, 180, 255, 0.8)';
          ctx.lineWidth = 2.5;
          const bStartY = objY - objSize - 5;
          ctx.beginPath();
          ctx.moveTo(objCenterX, bStartY);
          ctx.lineTo(objCenterX, bStartY - buoyLen);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(objCenterX, bStartY - buoyLen - 5);
          ctx.lineTo(objCenterX - 5, bStartY - buoyLen + 3);
          ctx.lineTo(objCenterX + 5, bStartY - buoyLen + 3);
          ctx.fill();
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Fb = ${buoyantForce.toFixed(1)} N`, objCenterX + 10, bStartY - buoyLen / 2);
        }
      }

      // Status text
      const status = objectDensity < fluidDensity ? 'FLOATING' : objectDensity === fluidDensity ? 'NEUTRAL' : 'SINKING';
      const statusColor = objectDensity < fluidDensity ? '#4ade80' : objectDensity === fluidDensity ? '#fbbf24' : '#ef4444';
      ctx.fillStyle = statusColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(status, w * 0.4, 18);

      // Fluid density indicator
      ctx.fillStyle = isDark ? 'rgba(200, 200, 255, 0.5)' : 'rgba(80, 90, 130, 0.7)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Fluid: ${fluidDensity} kg/m³`, w * 0.1, waterlineY + 15);

      // Submerged percentage
      ctx.fillStyle = isDark ? 'rgba(200, 200, 255, 0.5)' : 'rgba(80, 90, 130, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText(`Submerged: ${(submergedFraction * 100).toFixed(0)}%`, w * 0.7, waterlineY + 15);

      // Displacement visualization (right panel)
      const dpX = w * 0.75;
      const dpW = w * 0.22;
      const dpH = h * 0.6;
      const dpTop = h * 0.15;

      ctx.fillStyle = 'rgba(20, 25, 40, 0.6)';
      ctx.fillRect(dpX, dpTop, dpW, dpH);
      ctx.strokeStyle = 'rgba(100, 130, 200, 0.2)';
      ctx.strokeRect(dpX, dpTop, dpW, dpH);

      ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Displaced', dpX + dpW / 2, dpTop - 5);
      ctx.fillText('Fluid', dpX + dpW / 2, dpTop + 8);

      // show displaced fluid volume as filled bar
      const displVolFraction = submergedFraction;
      ctx.fillStyle = fluidDensity > 5000 ? 'rgba(180, 180, 200, 0.3)' : 'rgba(50, 120, 200, 0.2)';
      const barH = dpH * 0.8;
      const barTop = dpTop + dpH * 0.1;
      const filledH = barH * displVolFraction;
      ctx.fillRect(dpX + dpW * 0.2, barTop + barH - filledH, dpW * 0.6, filledH);
      ctx.strokeStyle = 'rgba(100, 130, 200, 0.3)';
      ctx.strokeRect(dpX + dpW * 0.2, barTop, dpW * 0.6, barH);

      ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
      ctx.font = '8px monospace';
      ctx.fillText(`${(displVolFraction * 100).toFixed(0)}%`, dpX + dpW / 2, barTop + barH + 12);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, objectDensity, fluidDensity, objectVolume, showForces]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-cyan-100 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Waves className="h-5 w-5 text-cyan-400" />
            Buoyancy & Archimedes' Principle
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Floating, sinking, and displaced fluid dynamics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-900/50 text-cyan-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={resetSimulation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <div className="rounded-lg shadow-md h-full overflow-hidden border border-gray-300 dark:border-gray-800">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        <div className="w-[210px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Presets</h4>
            {presets.map(p => (
              <button key={p.name} onClick={() => { setObjectDensity(p.od); setFluidDensity(p.fd); resetSimulation(); }} className="block w-full text-left px-2 py-1 rounded text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                {p.name}
              </button>
            ))}
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Parameters</h4>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Object Density: {objectDensity} kg/m³</label>
              <input type="range" min="50" max="15000" step="50" value={objectDensity} onChange={e => { setObjectDensity(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Fluid Density: {fluidDensity} kg/m³</label>
              <input type="range" min="500" max="14000" step="100" value={fluidDensity} onChange={e => { setFluidDensity(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Object Volume: {objectVolume}</label>
              <input type="range" min="20" max="150" step="5" value={objectVolume} onChange={e => { setObjectVolume(+e.target.value); resetSimulation(); }} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showForces} onChange={e => setShowForces(e.target.checked)} className="rounded" />
              Show force arrows
            </label>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Archimedes' Principle
            </h4>
            <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-400">
              <p className="font-mono bg-gray-200/50 dark:bg-gray-800/50 rounded px-1 py-0.5">Fb = ρ_fluid × V_displaced × g</p>
              <p>An object floats when its density is less than the fluid's density. It displaces exactly its own weight in fluid.</p>
              <p>The buoyant force equals the weight of the displaced fluid.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
