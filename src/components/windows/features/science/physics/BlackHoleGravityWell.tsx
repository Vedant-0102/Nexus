import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Circle, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface OrbitalBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  color: string;
  trail: { x: number; y: number }[];
}

export const BlackHoleGravityWell: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const bodiesRef = useRef<OrbitalBody[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [blackHoleMass, setBlackHoleMass] = useState(5000);
  const [showGrid, setShowGrid] = useState(true);
  const [showTrails, setShowTrails] = useState(true);
  const [particlesSwallowed, setParticlesSwallowed] = useState(0);
  const timeRef = useRef(0);
  const swallowedRef = useRef(0);

  const spawnParticle = useCallback((w: number, h: number): OrbitalBody => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 150;
    const cx = w / 2;
    const cy = h / 2;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    // Tangential velocity for orbit
    const speed = Math.sqrt(blackHoleMass / dist) * (0.6 + Math.random() * 0.8);
    return {
      x, y,
      vx: -Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
      vy: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
      mass: 1,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      trail: [],
    };
  }, [blackHoleMass]);

  const resetSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    bodiesRef.current = [];
    for (let i = 0; i < 30; i++) {
      bodiesRef.current.push(spawnParticle(rect.width, rect.height));
    }
    swallowedRef.current = 0;
    setParticlesSwallowed(0);
    timeRef.current = 0;
  }, [spawnParticle]);

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

    if (bodiesRef.current.length === 0) {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < 30; i++) {
        bodiesRef.current.push(spawnParticle(rect.width, rect.height));
      }
    }

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isPlaying) return;
      timeRef.current++;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Background - deep space
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#050510' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);

      // Draw spacetime grid (warped)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(100, 130, 255, 0.12)';
        ctx.lineWidth = 0.8;
        const gridSpacing = 30;

        for (let gx = 0; gx < w; gx += gridSpacing) {
          ctx.beginPath();
          for (let gy = 0; gy < h; gy += 3) {
            const dx = gx - cx;
            const dy = gy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const warp = blackHoleMass / (dist * dist + 500) * 15;
            const warpedX = gx + dx / (dist || 1) * warp;
            const warpedY = gy + dy / (dist || 1) * warp;
            if (gy === 0) ctx.moveTo(warpedX, warpedY);
            else ctx.lineTo(warpedX, warpedY);
          }
          ctx.stroke();
        }

        for (let gy = 0; gy < h; gy += gridSpacing) {
          ctx.beginPath();
          for (let gx = 0; gx < w; gx += 3) {
            const dx = gx - cx;
            const dy = gy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const warp = blackHoleMass / (dist * dist + 500) * 15;
            const warpedX = gx + dx / (dist || 1) * warp;
            const warpedY = gy + dy / (dist || 1) * warp;
            if (gx === 0) ctx.moveTo(warpedX, warpedY);
            else ctx.lineTo(warpedX, warpedY);
          }
          ctx.stroke();
        }
      }

      // Event horizon
      const eventHorizonR = Math.sqrt(blackHoleMass) * 0.3;
      const accretionR = eventHorizonR * 2.5;

      // Accretion disk glow
      ctx.save();
      const accGlow = ctx.createRadialGradient(cx, cy, eventHorizonR, cx, cy, accretionR * 1.5);
      accGlow.addColorStop(0, 'rgba(255, 150, 50, 0.3)');
      accGlow.addColorStop(0.3, 'rgba(255, 100, 30, 0.15)');
      accGlow.addColorStop(0.6, 'rgba(255, 50, 50, 0.05)');
      accGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = accGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, accretionR * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Black hole
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx, cy, eventHorizonR, 0, Math.PI * 2);
      ctx.fill();

      // Photon ring
      ctx.strokeStyle = `rgba(255, 200, 100, ${0.3 + Math.sin(timeRef.current * 0.05) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, eventHorizonR + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Schwarzschild radius label
      ctx.fillStyle = 'rgba(255, 200, 100, 0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Rs = ${(eventHorizonR * 2).toFixed(0)}`, cx + eventHorizonR + 8, cy - 5);

      // Spawn new particles occasionally
      if (bodiesRef.current.length < 40 && timeRef.current % 30 === 0) {
        bodiesRef.current.push(spawnParticle(w, h));
      }

      // Update bodies
      const alive: OrbitalBody[] = [];
      for (const body of bodiesRef.current) {
        const dx = cx - body.x;
        const dy = cy - body.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Gravitational acceleration
        const force = blackHoleMass / (dist * dist + 10);
        const ax = (dx / dist) * force * 0.01;
        const ay = (dy / dist) * force * 0.01;

        body.vx += ax;
        body.vy += ay;
        body.x += body.vx;
        body.y += body.vy;

        // Record trail
        if (showTrails) {
          body.trail.push({ x: body.x, y: body.y });
          if (body.trail.length > 80) body.trail.shift();
        }

        // Check if swallowed
        if (dist < eventHorizonR + 3) {
          swallowedRef.current++;
          setParticlesSwallowed(swallowedRef.current);
          continue;
        }

        // Check if escaped
        if (body.x < -50 || body.x > w + 50 || body.y < -50 || body.y > h + 50) {
          continue;
        }

        // Draw trail
        if (showTrails && body.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(body.trail[0].x, body.trail[0].y);
          for (let i = 1; i < body.trail.length; i++) {
            ctx.lineTo(body.trail[i].x, body.trail[i].y);
          }
          ctx.strokeStyle = body.color.replace('60%)', '60%, 0.15)').replace('hsl', 'hsla');
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw body
        const closeness = Math.max(0, 1 - dist / 300);
        const glow = ctx.createRadialGradient(body.x, body.y, 0, body.x, body.y, 8);
        glow.addColorStop(0, body.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(body.x, body.y, 4 + closeness * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = body.color;
        ctx.beginPath();
        ctx.arc(body.x, body.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        alive.push(body);
      }
      bodiesRef.current = alive;

      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Mass: ${blackHoleMass.toLocaleString()} M☉`, cx, cy + eventHorizonR + 20);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, blackHoleMass, showGrid, showTrails, spawnParticle]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-indigo-100 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Circle className="h-5 w-5 text-purple-400" />
            Black Hole Gravity Well
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Spacetime curvature & gravitational lensing simulation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/50 text-purple-300 text-xs font-medium">
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

        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Controls</h4>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Black Hole Mass: {blackHoleMass.toLocaleString()} M☉</label>
              <input type="range" min="1000" max="15000" step="500" value={blackHoleMass} onChange={e => setBlackHoleMass(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-700" />
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} className="rounded" />
              Show spacetime grid
            </label>
            <label className="flex items-center gap-2 text-[10px] text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={showTrails} onChange={e => setShowTrails(e.target.checked)} className="rounded" />
              Show orbital trails
            </label>
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Statistics</h4>
            <div className="bg-red-50 dark:bg-red-950/40 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Particles Swallowed</div>
              <div className="text-sm font-mono font-bold text-red-400">{particlesSwallowed}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/40 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Event Horizon Radius</div>
              <div className="text-sm font-mono font-bold text-purple-400">{(Math.sqrt(blackHoleMass) * 0.3 * 2).toFixed(0)} units</div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-md px-2 py-1.5">
              <div className="text-[9px] text-gray-500 uppercase">Active Particles</div>
              <div className="text-sm font-mono font-bold text-amber-400">{bodiesRef.current.length}</div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> General Relativity
            </h4>
            <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-400">
              <p>Mass warps spacetime, causing objects to follow curved paths (geodesics).</p>
              <p className="font-mono bg-gray-200/50 dark:bg-gray-800/50 rounded px-1 py-0.5">Rs = 2GM/c²</p>
              <p>The event horizon is the boundary beyond which nothing can escape — not even light.</p>
              <p>The grid shows the curvature of spacetime around the black hole.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
