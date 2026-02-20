import React, { useState, useRef, useEffect } from 'react';
import { Thermometer, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface HeatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  temp: number;
}

export const Thermodynamics: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<HeatParticle[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [tab, setTab] = useState<'conduction' | 'convection' | 'radiation'>('conduction');
  const [hotTemp, setHotTemp] = useState(400);
  const [coldTemp, setColdTemp] = useState(100);
  const [material, setMaterial] = useState<'copper' | 'iron' | 'wood'>('copper');
  const timeRef = useRef(0);

  const conductivity: Record<string, number> = { copper: 0.015, iron: 0.008, wood: 0.001 };

  const tempToColor = (t: number): string => {
    const ratio = Math.min(1, Math.max(0, (t - 50) / 500));
    if (ratio < 0.5) {
      const r = Math.round(ratio * 2 * 255);
      const b = Math.round((1 - ratio * 2) * 200 + 55);
      return `rgb(${r}, 50, ${b})`;
    } else {
      const r = 255;
      const g = Math.round((ratio - 0.5) * 2 * 200);
      const b = Math.round((1 - (ratio - 0.5) * 2) * 50);
      return `rgb(${r}, ${g}, ${b})`;
    }
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

    // Initialize conduction bar temperatures
    const barTemps = new Array(50).fill(0).map((_, i) => {
      if (i < 5) return hotTemp;
      if (i > 44) return coldTemp;
      return coldTemp + (hotTemp - coldTemp) * (1 - i / 50);
    });

    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      if (!isPlaying) return;
      timeRef.current += 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (tab === 'conduction') drawConduction(ctx, w, h, barTemps);
      else if (tab === 'convection') drawConvection(ctx, w, h);
      else drawRadiation(ctx, w, h);
    };

    const drawConduction = (ctx: CanvasRenderingContext2D, w: number, h: number, temps: number[]) => {
      const barY = h * 0.4;
      const barH = h * 0.15;
      const segW = (w * 0.8) / temps.length;
      const startX = w * 0.1;
      const k = conductivity[material];

      // Simulate heat diffusion
      for (let iter = 0; iter < 3; iter++) {
        const newTemps = [...temps];
        for (let i = 1; i < temps.length - 1; i++) {
          newTemps[i] += k * (temps[i - 1] - 2 * temps[i] + temps[i + 1]);
        }
        newTemps[0] = hotTemp;
        newTemps[temps.length - 1] = coldTemp;
        for (let i = 0; i < temps.length; i++) temps[i] = newTemps[i];
      }

      // Draw bar segments
      for (let i = 0; i < temps.length; i++) {
        ctx.fillStyle = tempToColor(temps[i]);
        ctx.fillRect(startX + i * segW, barY, segW + 1, barH);
      }

      // Bar outline
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, barY, temps.length * segW, barH);

      // Heat source (left)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(startX - 15, barY + barH / 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${hotTemp}°`, startX - 15, barY + barH / 2 + 4);

      // Cold end (right)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(startX + temps.length * segW + 15, barY + barH / 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(`${coldTemp}°`, startX + temps.length * segW + 15, barY + barH / 2 + 4);

      // Vibrating atoms
      for (let i = 0; i < temps.length; i += 2) {
        const vibration = (temps[i] / 500) * 5;
        const x = startX + i * segW + segW / 2 + (Math.random() - 0.5) * vibration;
        const y = barY + barH / 2 + (Math.random() - 0.5) * vibration;
        ctx.fillStyle = `rgba(255,255,255,0.5)`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Temperature graph below
      const graphY = barY + barH + 40;
      const graphH = h - graphY - 30;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, graphY);
      ctx.lineTo(startX, graphY + graphH);
      ctx.lineTo(startX + temps.length * segW, graphY + graphH);
      ctx.stroke();

      // Temperature curve
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < temps.length; i++) {
        const x = startX + i * segW;
        const y = graphY + graphH - (temps[i] / 600) * graphH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Temperature Distribution Along Bar', w / 2, graphY - 15);
      ctx.fillText(`Material: ${material.charAt(0).toUpperCase() + material.slice(1)} (k = ${conductivity[material]})`, w / 2, barY - 15);

      // Energy flow arrow
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Heat Flow →', w / 2, barY + barH + 18);
    };

    const drawConvection = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Container
      const cX = w * 0.15, cY = h * 0.15, cW = w * 0.7, cH = h * 0.7;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(cX, cY, cW, cH);

      // Heat source at bottom
      const heatW = cW * 0.4;
      const heatX = cX + (cW - heatW) / 2;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(heatX, cY + cH - 5, heatW, 10);

      // Convection current arrows (circular)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 2;
      const cx = cX + cW / 2;
      const cy = cY + cH / 2;
      // Left loop
      drawConvectionArrow(ctx, cx - cW * 0.15, cy, cW * 0.2, cH * 0.35, true);
      // Right loop
      drawConvectionArrow(ctx, cx + cW * 0.15, cy, cW * 0.2, cH * 0.35, false);

      // Particles
      if (particlesRef.current.length < 100) {
        for (let i = 0; i < 3; i++) {
          const isLeft = Math.random() > 0.5;
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * cW * 0.3,
            y: cY + cH - 15,
            vx: isLeft ? -1 : 1,
            vy: -(1 + Math.random() * 2),
            temp: hotTemp,
          });
        }
      }

      const alive: HeatParticle[] = [];
      for (const p of particlesRef.current) {
        // Simulate convection current
        const relY = (p.y - cY) / cH;
        const relX = (p.x - cx) / (cW / 2);

        if (relY < 0.3) { // at top, move outwards
          p.vx += relX > 0 ? 0.1 : -0.1;
          p.vy += 0.05;
        } else if (relY > 0.7) { // at bottom, move inward
          p.vx += relX > 0 ? -0.15 : 0.15;
          p.vy -= 0.1;
        } else { // sides
          if (Math.abs(relX) > 0.3) {
            p.vy += relX * p.vx > 0 ? 0.08 : -0.08;
          } else {
            p.vy -= 0.05;
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        // Cool as it rises
        p.temp = hotTemp - (hotTemp - coldTemp) * (1 - relY);

        // Bounce off walls
        if (p.x < cX + 8) { p.x = cX + 8; p.vx *= -0.5; }
        if (p.x > cX + cW - 8) { p.x = cX + cW - 8; p.vx *= -0.5; }
        if (p.y < cY + 8) { p.y = cY + 8; p.vy *= -0.5; }
        if (p.y > cY + cH - 8) { p.y = cY + cH - 8; p.vy *= -0.5; }

        ctx.fillStyle = tempToColor(p.temp);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        alive.push(p);
      }
      particlesRef.current = alive;

      // Labels
      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Convection Currents in Fluid', w / 2, cY - 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Heat Source', cx, cY + cH + 20);
    };

    function drawConvectionArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, clockwise: boolean) {
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 100, 100, 0.2)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Arrow heads
      const angle = clockwise ? -Math.PI / 4 : Math.PI / 4;
      const ax = cx + rx * Math.cos(angle);
      const ay = cy + ry * Math.sin(angle);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (clockwise ? -8 : 8), ay - 8);
      ctx.lineTo(ax + (clockwise ? 8 : -8), ay - 4);
      ctx.closePath();
      ctx.fill();
    }

    const drawRadiation = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const sourceX = w * 0.2;
      const sourceY = h * 0.5;

      // Hot body
      const glowSize = 40 + Math.sin(timeRef.current * 0.05) * 5;
      const glow = ctx.createRadialGradient(sourceX, sourceY, 10, sourceX, sourceY, glowSize + 30);
      glow.addColorStop(0, tempToColor(hotTemp));
      glow.addColorStop(0.5, `rgba(255, 100, 50, 0.3)`);
      glow.addColorStop(1, 'rgba(255, 100, 50, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sourceX, sourceY, glowSize + 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = tempToColor(hotTemp);
      ctx.beginPath();
      ctx.arc(sourceX, sourceY, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${hotTemp}K`, sourceX, sourceY + 4);

      // EM waves radiating outward
      for (let angle = -Math.PI / 3; angle <= Math.PI / 3; angle += Math.PI / 12) {
        const waveLen = 15 + (600 - hotTemp) / 30;
        ctx.strokeStyle = tempToColor(hotTemp);
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        for (let d = 40; d < w * 0.6; d += 2) {
          const x = sourceX + d * Math.cos(angle);
          const y = sourceY + d * Math.sin(angle);
          const wave = Math.sin((d - timeRef.current * 2) / waveLen) * 8 * (1 - d / (w * 0.8));
          const nx = x - wave * Math.sin(angle);
          const ny = y + wave * Math.cos(angle);
          if (d === 40) ctx.moveTo(nx, ny);
          else ctx.lineTo(nx, ny);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Receiving body
      const recvX = w * 0.75;
      const recvY = sourceY;
      const recvTemp = coldTemp + (hotTemp - coldTemp) * 0.3 * Math.min(1, timeRef.current / 500);
      ctx.fillStyle = tempToColor(recvTemp);
      ctx.beginPath();
      ctx.arc(recvX, recvY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`${Math.round(recvTemp)}K`, recvX, recvY + 4);

      // Stefan-Boltzmann law
      const power = 5.67e-8 * Math.pow(hotTemp, 4);
      ctx.fillStyle = '#475569';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Electromagnetic Radiation (no medium needed)', w / 2, h * 0.12);
      ctx.font = '10px monospace';
      ctx.fillText(`Stefan-Boltzmann: P = σT⁴ = ${power.toExponential(2)} W/m²`, w / 2, h * 0.9);

      // Spectrum indicator
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText(`Peak λ ≈ ${(2.898e6 / hotTemp).toFixed(0)} nm (${hotTemp > 3000 ? 'visible' : hotTemp > 700 ? 'infrared' : 'far infrared'})`, w / 2, h * 0.85);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, tab, hotTemp, coldTemp, material]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            Thermodynamics & Heat Transfer
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Conduction, Convection & Radiation — Three modes of heat transfer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => { particlesRef.current = []; timeRef.current = 0; }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(['conduction', 'convection', 'radiation'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); particlesRef.current = []; timeRef.current = 0; }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-red-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {t === 'conduction' ? '🔗 Conduction' : t === 'convection' ? '🌊 Convection' : '☀️ Radiation'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full p-2">
            <canvas ref={canvasRef} className="w-full h-full rounded" />
          </div>
        </div>

        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Controls</h4>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Hot Temperature: {hotTemp}°</label>
              <input type="range" min="100" max="600" value={hotTemp} onChange={e => setHotTemp(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">Cold Temperature: {coldTemp}°</label>
              <input type="range" min="0" max="300" value={coldTemp} onChange={e => setColdTemp(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700" />
            </div>
            {tab === 'conduction' && (
              <div>
                <label className="text-[10px] text-gray-500 block mb-1">Material</label>
                <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1.5">
                  <option value="copper">Copper (high k)</option>
                  <option value="iron">Iron (medium k)</option>
                  <option value="wood">Wood (low k)</option>
                </select>
              </div>
            )}
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> {tab === 'conduction' ? 'Conduction' : tab === 'convection' ? 'Convection' : 'Radiation'}
            </h4>
            <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-300">
              {tab === 'conduction' && (
                <>
                  <p>Heat transfers through direct molecular vibration contact.</p>
                  <p className="font-mono bg-white dark:bg-gray-800 rounded px-1 py-0.5">Q = kA(ΔT/Δx)</p>
                  <p>Metals conduct well; insulators (wood) are poor conductors.</p>
                </>
              )}
              {tab === 'convection' && (
                <>
                  <p>Heat transfers through bulk fluid movement — hot fluid rises, cold fluid sinks.</p>
                  <p className="font-mono bg-white dark:bg-gray-800 rounded px-1 py-0.5">Q = hA(Ts - T∞)</p>
                  <p>Creates circulation currents. Drives weather &amp; ocean currents.</p>
                </>
              )}
              {tab === 'radiation' && (
                <>
                  <p>Heat transfers via electromagnetic waves — no medium required.</p>
                  <p className="font-mono bg-white dark:bg-gray-800 rounded px-1 py-0.5">P = εσAT⁴</p>
                  <p>All objects emit radiation. Hotter objects radiate more intensely at shorter λ.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
