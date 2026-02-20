import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Wind, Play, Pause, RotateCcw, Info } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export const BernoulliPrinciple: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [nozzleWidth, setNozzleWidth] = useState(0.4); // 0.1 to 1.0
  const [flowSpeed, setFlowSpeed] = useState(3);
  const [showPressure, setShowPressure] = useState(true);
  const [showStreamlines, setShowStreamlines] = useState(true);
  const [tab, setTab] = useState<'venturi' | 'airplane' | 'spray'>('venturi');

  const getNarrowVelocity = useCallback(() => {
    return flowSpeed / nozzleWidth;
  }, [flowSpeed, nozzleWidth]);

  const getPressureDrop = useCallback(() => {
    const v1 = flowSpeed;
    const v2 = getNarrowVelocity();
    // Bernoulli: P1 + 0.5*rho*v1^2 = P2 + 0.5*rho*v2^2
    // dP = 0.5 * rho * (v2^2 - v1^2), rho=1 for simplicity
    return 0.5 * (v2 * v2 - v1 * v1);
  }, [flowSpeed, getNarrowVelocity]);

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
      if (!isPlaying) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      animRef.current = requestAnimationFrame(animate);
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Draw based on selected tab
      if (tab === 'venturi') {
        drawVenturi(ctx, w, h);
      } else if (tab === 'airplane') {
        drawAirplane(ctx, w, h);
      } else {
        drawSpray(ctx, w, h);
      }
    };

    const drawVenturi = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerY = h / 2;
      const pipeHeight = h * 0.5;
      const narrowStart = w * 0.3;
      const narrowEnd = w * 0.7;
      const narrowHeight = pipeHeight * nozzleWidth;

      // Pipe walls (top)
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(0, centerY - pipeHeight / 2);
      ctx.lineTo(narrowStart, centerY - pipeHeight / 2);
      ctx.bezierCurveTo(
        narrowStart + (narrowEnd - narrowStart) * 0.2, centerY - pipeHeight / 2,
        narrowStart + (narrowEnd - narrowStart) * 0.2, centerY - narrowHeight / 2,
        (narrowStart + narrowEnd) / 2, centerY - narrowHeight / 2
      );
      ctx.bezierCurveTo(
        narrowEnd - (narrowEnd - narrowStart) * 0.2, centerY - narrowHeight / 2,
        narrowEnd - (narrowEnd - narrowStart) * 0.2, centerY - pipeHeight / 2,
        narrowEnd, centerY - pipeHeight / 2
      );
      ctx.lineTo(w, centerY - pipeHeight / 2);
      ctx.lineTo(w, centerY - pipeHeight / 2 - 12);
      ctx.lineTo(0, centerY - pipeHeight / 2 - 12);
      ctx.closePath();
      ctx.fill();

      // Pipe walls (bottom) - mirror
      ctx.beginPath();
      ctx.moveTo(0, centerY + pipeHeight / 2);
      ctx.lineTo(narrowStart, centerY + pipeHeight / 2);
      ctx.bezierCurveTo(
        narrowStart + (narrowEnd - narrowStart) * 0.2, centerY + pipeHeight / 2,
        narrowStart + (narrowEnd - narrowStart) * 0.2, centerY + narrowHeight / 2,
        (narrowStart + narrowEnd) / 2, centerY + narrowHeight / 2
      );
      ctx.bezierCurveTo(
        narrowEnd - (narrowEnd - narrowStart) * 0.2, centerY + narrowHeight / 2,
        narrowEnd - (narrowEnd - narrowStart) * 0.2, centerY + pipeHeight / 2,
        narrowEnd, centerY + pipeHeight / 2
      );
      ctx.lineTo(w, centerY + pipeHeight / 2);
      ctx.lineTo(w, centerY + pipeHeight / 2 + 12);
      ctx.lineTo(0, centerY + pipeHeight / 2 + 12);
      ctx.closePath();
      ctx.fill();

      // Pressure colors inside pipe
      if (showPressure) {
        // Wide sections (high pressure - blue)
        const wideGrad = ctx.createLinearGradient(0, centerY - pipeHeight / 2, 0, centerY + pipeHeight / 2);
        wideGrad.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
        wideGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.25)');
        wideGrad.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
        ctx.fillStyle = wideGrad;
        ctx.fillRect(0, centerY - pipeHeight / 2, narrowStart * 0.8, pipeHeight);
        ctx.fillRect(narrowEnd + (w - narrowEnd) * 0.2, centerY - pipeHeight / 2, (w - narrowEnd) * 0.8, pipeHeight);

        // Narrow section (low pressure - red)
        const narrowGrad = ctx.createLinearGradient(0, centerY - narrowHeight / 2, 0, centerY + narrowHeight / 2);
        narrowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.15)');
        narrowGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
        narrowGrad.addColorStop(1, 'rgba(239, 68, 68, 0.15)');
        ctx.fillStyle = narrowGrad;
        ctx.fillRect(narrowStart + (narrowEnd - narrowStart) * 0.3, centerY - narrowHeight / 2, (narrowEnd - narrowStart) * 0.4, narrowHeight);

        // Pressure labels
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('HIGH P', narrowStart * 0.4, centerY - pipeHeight / 2 - 20);
        ctx.fillText('LOW V', narrowStart * 0.4, centerY - pipeHeight / 2 - 6);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('LOW P', (narrowStart + narrowEnd) / 2, centerY - narrowHeight / 2 - 20);
        ctx.fillText('HIGH V', (narrowStart + narrowEnd) / 2, centerY - narrowHeight / 2 - 6);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('HIGH P', narrowEnd + (w - narrowEnd) * 0.5, centerY - pipeHeight / 2 - 20);
        ctx.fillText('LOW V', narrowEnd + (w - narrowEnd) * 0.5, centerY - pipeHeight / 2 - 6);
      }

      // Pressure manometer tubes
      const tubePositions = [narrowStart * 0.4, (narrowStart + narrowEnd) / 2, narrowEnd + (w - narrowEnd) * 0.5];
      tubePositions.forEach((x, i) => {
        const pressureFactor = i === 1 ? 0.3 * nozzleWidth : 0.8;
        const tubeH = 40 * pressureFactor;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, centerY - pipeHeight / 2 - 12);
        ctx.lineTo(x, centerY - pipeHeight / 2 - 50);
        ctx.stroke();

        // Fluid level in tube
        ctx.fillStyle = i === 1 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';
        ctx.fillRect(x - 4, centerY - pipeHeight / 2 - 12 - tubeH, 8, tubeH);
      });

      // Flow particles
      if (particlesRef.current.length < 120) {
        for (let i = 0; i < 3; i++) {
          const yRange = pipeHeight * 0.8;
          particlesRef.current.push({
            x: -Math.random() * 30,
            y: centerY + (Math.random() - 0.5) * yRange,
            vx: flowSpeed,
            vy: 0,
            size: 2 + Math.random() * 2,
          });
        }
      }

      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        // Calculate local pipe bounds
        let localHalfH = pipeHeight / 2;
        if (p.x > narrowStart && p.x < narrowEnd) {
          const t = (p.x - narrowStart) / (narrowEnd - narrowStart);
          const narrowFactor = t < 0.5 ? t * 2 : (1 - t) * 2;
          localHalfH = pipeHeight / 2 - (pipeHeight / 2 - narrowHeight / 2) * Math.sin(narrowFactor * Math.PI / 2);
        }

        // Speed up in narrow section
        const speedMultiplier = p.x > narrowStart && p.x < narrowEnd ? 1 / nozzleWidth : 1;
        p.x += flowSpeed * speedMultiplier * 0.8;

        // Constrain y to pipe bounds + push towards center in narrow
        if (p.y > centerY + localHalfH * 0.85) p.y = centerY + localHalfH * 0.85;
        if (p.y < centerY - localHalfH * 0.85) p.y = centerY - localHalfH * 0.85;

        if (p.x > w + 10) continue;

        // Color based on speed
        const speed = flowSpeed * speedMultiplier;
        const colorT = Math.min(speed / 15, 1);
        const r = Math.round(59 + (239 - 59) * colorT);
        const g = Math.round(130 + (68 - 130) * colorT);
        const b = Math.round(246 + (68 - 246) * colorT);

        ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        alive.push(p);
      }
      particlesRef.current = alive;

      // Streamlines
      if (showStreamlines) {
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          const yOff = (i - 3) * (pipeHeight / 8);
          ctx.beginPath();
          for (let x = 0; x < w; x += 3) {
            let localHalfH = pipeHeight / 2;
            if (x > narrowStart && x < narrowEnd) {
              const t = (x - narrowStart) / (narrowEnd - narrowStart);
              const narrowFactor = t < 0.5 ? t * 2 : (1 - t) * 2;
              localHalfH = pipeHeight / 2 - (pipeHeight / 2 - narrowHeight / 2) * Math.sin(narrowFactor * Math.PI / 2);
            }
            const ratio = localHalfH / (pipeHeight / 2);
            const y = centerY + yOff * ratio;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // Bernoulli equation
      ctx.fillStyle = '#475569';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂', 10, h - 10);
    };

    const drawAirplane = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerY = h * 0.55;
      const wingLen = w * 0.5;
      const wingStart = (w - wingLen) / 2;

      // Airfoil shape
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(wingStart, centerY);
      // Top (curved)
      ctx.bezierCurveTo(
        wingStart + wingLen * 0.3, centerY - 50 - nozzleWidth * 30,
        wingStart + wingLen * 0.6, centerY - 40 - nozzleWidth * 25,
        wingStart + wingLen, centerY
      );
      // Bottom (flatter)
      ctx.bezierCurveTo(
        wingStart + wingLen * 0.6, centerY + 10,
        wingStart + wingLen * 0.3, centerY + 15,
        wingStart, centerY
      );
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Airflow lines (top - faster, closer together)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const yOff = -(20 + i * 15 + nozzleWidth * 10);
        ctx.beginPath();
        for (let x = wingStart - 60; x < wingStart + wingLen + 60; x += 3) {
          let y = centerY + yOff;
          if (x > wingStart && x < wingStart + wingLen) {
            const t = (x - wingStart) / wingLen;
            y -= (30 + nozzleWidth * 20) * Math.sin(t * Math.PI) * (1 / (1 + i * 0.3));
          }
          if (x === wingStart - 60) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Airflow lines (bottom - slower)
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
      for (let i = 0; i < 4; i++) {
        const yOff = 15 + i * 15;
        ctx.beginPath();
        for (let x = wingStart - 60; x < wingStart + wingLen + 60; x += 3) {
          let y = centerY + yOff;
          if (x > wingStart && x < wingStart + wingLen) {
            const t = (x - wingStart) / wingLen;
            y += 5 * Math.sin(t * Math.PI);
          }
          if (x === wingStart - 60) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Labels
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Faster flow → Lower pressure', w / 2, centerY - 80 - nozzleWidth * 30);
      ctx.fillStyle = '#3b82f6';
      ctx.fillText('Slower flow → Higher pressure', w / 2, centerY + 70);

      // Lift arrow
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w / 2, centerY + 5);
      ctx.lineTo(w / 2, centerY - 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 - 8, centerY - 48);
      ctx.lineTo(w / 2, centerY - 60);
      ctx.lineTo(w / 2 + 8, centerY - 48);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('LIFT', w / 2 + 25, centerY - 25);

      // Flow particles over wing
      if (particlesRef.current.length < 80) {
        for (let i = 0; i < 2; i++) {
          const isTop = Math.random() > 0.4;
          particlesRef.current.push({
            x: wingStart - 60 - Math.random() * 30,
            y: centerY + (isTop ? -(20 + Math.random() * 60) : (15 + Math.random() * 40)),
            vx: flowSpeed * (isTop ? 1.4 : 0.9),
            vy: 0,
            size: 2,
          });
        }
      }
      const alive2: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx * 0.8;
        if (p.x > w + 10) continue;
        const isTop = p.y < centerY;
        ctx.fillStyle = isTop ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        alive2.push(p);
      }
      particlesRef.current = alive2;
    };

    const drawSpray = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w / 2;

      // Bottle
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(centerX - 30, h * 0.5, 60, h * 0.4);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.strokeRect(centerX - 30, h * 0.5, 60, h * 0.4);

      // Tube going into bottle
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, h * 0.5);
      ctx.lineTo(centerX, h * 0.35);
      ctx.stroke();

      // Horizontal tube (nozzle)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(centerX - 80, h * 0.33, 160, 8);

      // Air flow arrows
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const x = centerX - 100 + i * 20 - 30;
        ctx.beginPath();
        ctx.moveTo(x, h * 0.37);
        ctx.lineTo(x + 15, h * 0.37);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 12, h * 0.37 - 3);
        ctx.lineTo(x + 15, h * 0.37);
        ctx.lineTo(x + 12, h * 0.37 + 3);
        ctx.fill();
      }

      // Spray droplets
      if (particlesRef.current.length < 40) {
        particlesRef.current.push({
          x: centerX + 80 + Math.random() * 10,
          y: h * 0.37 + (Math.random() - 0.5) * 10,
          vx: 2 + Math.random() * flowSpeed,
          vy: (Math.random() - 0.5) * 2 + 1,
          size: 1 + Math.random() * 3,
        });
      }
      const alive3: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.3;
        p.vy += 0.05;
        if (p.x > w || p.y > h) continue;
        const alpha = Math.max(0, 1 - (p.x - centerX - 80) / 150);
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        alive3.push(p);
      }
      particlesRef.current = alive3;

      // Labels
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fast air flow → Low pressure above tube', centerX, h * 0.25);
      ctx.fillText('Atmospheric pressure pushes liquid up', centerX, h * 0.28 + 14);

      // Rising liquid arrow
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, h * 0.48);
      ctx.lineTo(centerX, h * 0.38);
      ctx.stroke();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(centerX - 5, h * 0.4);
      ctx.lineTo(centerX, h * 0.37);
      ctx.lineTo(centerX + 5, h * 0.4);
      ctx.fill();
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      obs.disconnect();
    };
  }, [isPlaying, nozzleWidth, flowSpeed, showPressure, showStreamlines, tab]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-sky-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-3 overflow-hidden">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Wind className="h-5 w-5 text-sky-500" />
            Bernoulli's Principle & Fluid Dynamics
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Faster fluid → Lower pressure | Explore the Venturi effect
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setIsPlaying(!isPlaying); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-800 transition-all text-xs font-medium">
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => { particlesRef.current = []; }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-xs font-medium">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2">
        {(['venturi', 'airplane', 'spray'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); particlesRef.current = []; }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t ? 'bg-sky-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          >
            {t === 'venturi' ? '🔬 Venturi Tube' : t === 'airplane' ? '✈️ Airplane Wing' : '💨 Spray Bottle'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-w-0 min-h-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-full p-2">
            <canvas ref={canvasRef} className="w-full h-full rounded" />
          </div>
        </div>

        {/* Controls */}
        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-3">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Controls</h4>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">
                {tab === 'venturi' ? 'Nozzle Width' : tab === 'airplane' ? 'Wing Curvature' : 'Air Speed'}: {nozzleWidth.toFixed(1)}
              </label>
              <input type="range" min="0.15" max="1" step="0.05" value={nozzleWidth} onChange={e => setNozzleWidth(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">Flow Speed: {flowSpeed.toFixed(1)} m/s</label>
              <input type="range" min="1" max="10" step="0.5" value={flowSpeed} onChange={e => setFlowSpeed(+e.target.value)} className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700" />
            </div>
            {tab === 'venturi' && (
              <>
                <label className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={showPressure} onChange={e => setShowPressure(e.target.checked)} className="rounded" />
                  Show pressure zones
                </label>
                <label className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={showStreamlines} onChange={e => setShowStreamlines(e.target.checked)} className="rounded" />
                  Show streamlines
                </label>
              </>
            )}
          </div>

          {tab === 'venturi' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 space-y-2">
              <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Readings</h4>
              <div className="bg-sky-50 dark:bg-sky-900/20 rounded-md px-2 py-1.5">
                <div className="text-[9px] text-gray-400 uppercase">Wide Section Velocity</div>
                <div className="text-xs font-mono font-bold text-sky-600">{flowSpeed.toFixed(1)} m/s</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-md px-2 py-1.5">
                <div className="text-[9px] text-gray-400 uppercase">Narrow Section Velocity</div>
                <div className="text-xs font-mono font-bold text-red-600">{getNarrowVelocity().toFixed(1)} m/s</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-md px-2 py-1.5">
                <div className="text-[9px] text-gray-400 uppercase">Pressure Drop (ΔP)</div>
                <div className="text-xs font-mono font-bold text-amber-600">{getPressureDrop().toFixed(1)} Pa</div>
              </div>
            </div>
          )}

          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-sky-800 dark:text-sky-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" /> Bernoulli's Principle
            </h4>
            <div className="space-y-1.5 text-[9px] text-gray-600 dark:text-gray-300">
              <p>As the speed of a fluid increases, its pressure decreases (and vice versa).</p>
              <p className="font-mono text-[8px] bg-white dark:bg-gray-800 rounded px-2 py-1">P + ½ρv² + ρgh = constant</p>
              <p>This explains lift on airplane wings, atomizers, and the Venturi effect in pipes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
