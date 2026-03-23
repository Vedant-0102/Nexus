import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const SpringSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [springK, setSpringK] = useState(0.1);
  const [mass, setMass] = useState(1.0);
  const [damping, setDamping] = useState(0.995);
  const [initDisp, setInitDisp] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [dispDisplay, setDispDisplay] = useState(100);
  const [velDisplay, setVelDisplay] = useState(0);
  const [timeDisplay, setTimeDisplay] = useState(0);
  const [keDisplay, setKeDisplay] = useState(0);
  const [peDisplay, setPeDisplay] = useState(0);

  const dispRef = useRef(100);
  const velRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const isActiveRef = useRef(false);
  const animationRef = useRef<number>();
  const posHistoryRef = useRef<number[]>([]);

  // Interaction refs
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isHoveringMassRef = useRef(false);
  const initDispRef = useRef(100);

  // Sync refs with state
  isRunningRef.current = isRunning;
  isPausedRef.current = isPaused;
  initDispRef.current = initDisp;

  const paramsRef = useRef({ springK, mass, damping, speed });
  paramsRef.current = { springK, mass, damping, speed };

  const getFrequency = () => Math.sqrt(springK / mass) / (2 * Math.PI);
  const getPeriod = () => { const f = getFrequency(); return f > 0 ? 1 / f : Infinity; };

  const drawSpring = (
    ctx: CanvasRenderingContext2D,
    x1: number, y: number, x2: number, coils: number, amplitude: number
  ) => {
    const len = x2 - x1;
    const coilW = len / (coils * 2 + 1);
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + coilW, y);
    for (let i = 0; i < coils; i++) {
      const baseX = x1 + coilW + i * 2 * coilW;
      ctx.bezierCurveTo(baseX + coilW * 0.3, y - amplitude, baseX + coilW * 0.7, y - amplitude, baseX + coilW, y);
      ctx.bezierCurveTo(baseX + coilW * 1.3, y + amplitude, baseX + coilW * 1.7, y + amplitude, baseX + coilW * 2, y);
    }
    ctx.lineTo(x2, y);
    ctx.stroke();
  };

  const renderCanvas = useCallback((disp: number, vel: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const isDark = document.documentElement.classList.contains('dark');

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = isDark ? '#080c18' : '#f0f4f8';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    const centerY = H / 2;
    const wallX = 40;
    const equilibriumX = W * 0.4;
    const massX = equilibriumX + disp;
    const massW = 44, massH = 44;

    // Equilibrium dashed line
    ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.5)' : 'rgba(217,119,6,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX, centerY - 60);
    ctx.lineTo(equilibriumX, centerY + 60);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isDark ? '#FCD34D' : '#B45309';
    ctx.font = '9px Segoe UI, sans-serif';
    ctx.fillText('eq.', equilibriumX - 10, centerY - 64);

    // Wall
    const wallGrad = ctx.createLinearGradient(wallX - 12, 0, wallX, 0);
    wallGrad.addColorStop(0, isDark ? '#374151' : '#9CA3AF');
    wallGrad.addColorStop(1, isDark ? '#4B5563' : '#D1D5DB');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.roundRect(wallX - 14, centerY - 65, 14, 130, [4, 0, 0, 4]);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#6B7280' : '#9CA3AF';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = isDark ? '#4B5563' : '#6B7280';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const wy = centerY - 55 + i * 16;
      ctx.beginPath(); ctx.moveTo(wallX - 14, wy); ctx.lineTo(wallX - 5, wy + 8); ctx.stroke();
    }

    // Position history graph
    if (posHistoryRef.current.length > 2) {
      const graphX = W - 130, graphY = 12, graphW = 118, graphH = 50;
      ctx.fillStyle = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.roundRect(graphX, graphY, graphW, graphH, 5); ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(graphX, graphY + graphH / 2); ctx.lineTo(graphX + graphW, graphY + graphH / 2); ctx.stroke();
      ctx.setLineDash([]);
      const hist = posHistoryRef.current;
      const maxDisp = Math.max(...hist.map(Math.abs), 1);
      ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      hist.forEach((d, i) => {
        const hx = graphX + 4 + (i / (hist.length - 1)) * (graphW - 8);
        const hy = graphY + graphH / 2 - (d / maxDisp) * (graphH / 2 - 4);
        i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
      });
      ctx.stroke();
      ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillText('Position history', graphX + 3, graphY + graphH + 9);
    }

    // Spring
    const springAmp = Math.max(10, 22 - Math.abs(disp) * 0.03);
    ctx.strokeStyle = isDark ? '#2DD4BF' : '#0D9488';
    ctx.lineWidth = 2.5;
    drawSpring(ctx, wallX, centerY, massX - massW / 2, 10, springAmp);

    // Motion trail
    if (posHistoryRef.current.length > 5) {
      const hist = posHistoryRef.current;
      const recent = hist.slice(-15);
      for (let i = 1; i < recent.length; i++) {
        const alpha = (i / recent.length) * 0.3;
        const trailX = equilibriumX + recent[i];
        ctx.fillStyle = isDark ? `rgba(239,68,68,${alpha})` : `rgba(220,38,38,${alpha})`;
        ctx.beginPath();
        ctx.roundRect(trailX - massW / 2 - i * 0.5, centerY - massH / 2, massW + i, massH + i, 4);
        ctx.fill();
      }
    }

    // Hover/drag glow ring
    if (isDraggingRef.current || isHoveringMassRef.current) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = 'rgba(239,68,68,0.5)';
      ctx.strokeStyle = isDark ? 'rgba(252,165,165,0.7)' : 'rgba(220,38,38,0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(massX - massW / 2 - 7, centerY - massH / 2 - 7, massW + 14, massH + 14, 9);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Mass block
    const massGrad = ctx.createLinearGradient(massX - massW / 2, centerY - massH / 2, massX + massW / 2, centerY + massH / 2);
    massGrad.addColorStop(0, '#FCA5A5');
    massGrad.addColorStop(0.5, '#EF4444');
    massGrad.addColorStop(1, '#B91C1C');
    ctx.shadowBlur = isDraggingRef.current ? 28 : 18;
    ctx.shadowColor = 'rgba(239,68,68,0.55)';
    ctx.fillStyle = massGrad;
    ctx.beginPath();
    ctx.roundRect(massX - massW / 2, centerY - massH / 2, massW, massH, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#7F1D1D'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.min(12, 10 + paramsRef.current.mass)}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${paramsRef.current.mass.toFixed(1)}`, massX, centerY + 4);
    ctx.textAlign = 'left';

    // Velocity vector
    const vScale = 8;
    if (Math.abs(vel) > 0.2) {
      const headLen = Math.min(10, Math.abs(vel) * vScale * 0.3);
      const toX = massX + vel * vScale;
      const dir = vel > 0 ? 1 : -1;
      ctx.strokeStyle = '#10B981'; ctx.fillStyle = '#10B981'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(massX + (dir * massW / 2), centerY); ctx.lineTo(toX, centerY); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(toX, centerY);
      ctx.lineTo(toX - headLen * dir, centerY - headLen * 0.5);
      ctx.lineTo(toX - headLen * dir, centerY + headLen * 0.5);
      ctx.closePath(); ctx.fill();
    }

    // Force vector
    const { springK: k } = paramsRef.current;
    const force = -k * disp;
    const fScale = 30;
    if (Math.abs(force) > 0.01) {
      const headLen = Math.min(10, Math.abs(force) * fScale * 0.25);
      const fDir = force > 0 ? 1 : -1;
      const fToX = massX + force * fScale;
      ctx.strokeStyle = '#8B5CF6'; ctx.fillStyle = '#8B5CF6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(massX, centerY + 28); ctx.lineTo(fToX, centerY + 28); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fToX, centerY + 28);
      ctx.lineTo(fToX - headLen * fDir, centerY + 28 - headLen * 0.5);
      ctx.lineTo(fToX - headLen * fDir, centerY + 28 + headLen * 0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = isDark ? '#C4B5FD' : '#7C3AED';
      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillText(`F=${force.toFixed(2)}N`, fToX + (fDir > 0 ? 3 : -40), centerY + 26);
    }

    // Energy bars
    const { springK: kk, mass: m } = paramsRef.current;
    const KE = 0.5 * m * vel * vel;
    const PE = 0.5 * kk * disp * disp;
    const TE = KE + PE;
    const initTE = 0.5 * kk * initDispRef.current * initDispRef.current;
    const maxE = Math.max(initTE, TE, 0.001);
    const barX2 = 8, barMaxH = 60, barW2 = 14, barY2 = centerY + massH / 2 + 20;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath(); ctx.roundRect(barX2, barY2 - barMaxH, barW2, barMaxH, 3); ctx.fill();
    const keH = (KE / maxE) * barMaxH;
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.roundRect(barX2, barY2 - keH, barW2, keH, 3); ctx.fill();
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath(); ctx.roundRect(barX2 + barW2 + 4, barY2 - barMaxH, barW2, barMaxH, 3); ctx.fill();
    const peH = (PE / maxE) * barMaxH;
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath(); ctx.roundRect(barX2 + barW2 + 4, barY2 - peH, barW2, peH, 3); ctx.fill();
    ctx.font = '8px Segoe UI, sans-serif';
    ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
    ctx.fillText('KE', barX2, barY2 + 10);
    ctx.fillText('PE', barX2 + barW2 + 4, barY2 + 10);

    // Displacement label
    ctx.fillStyle = isDark ? 'rgba(251,191,36,0.7)' : 'rgba(217,119,6,0.8)';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillText(`x=${disp.toFixed(1)}`, equilibriumX + 5, centerY + massH / 2 + 14);

    // Drag hint when idle
    if (!isRunningRef.current && !isDraggingRef.current && posHistoryRef.current.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag the mass to set displacement', W / 2, centerY - massH / 2 - 16);
      ctx.textAlign = 'left';
    }
  }, []);

  // Init canvas + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      canvas.width = r.width * d;
      canvas.height = r.height * d;
      ctx.scale(d, d);
      renderCanvas(dispRef.current, velRef.current);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [renderCanvas]);

  // Pointer interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        mx: (e.clientX - rect.left) * (canvas.width / rect.width / dpr),
        my: (e.clientY - rect.top) * (canvas.height / rect.height / dpr),
      };
    };

    const getMassHit = (mx: number, my: number) => {
      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);
      const centerY = H / 2;
      const equilibriumX = W * 0.4;
      const massX = equilibriumX + dispRef.current;
      return mx >= massX - 28 && mx <= massX + 28 && my >= centerY - 28 && my <= centerY + 28;
    };

    const onPointerMove = (e: PointerEvent) => {
      const { mx, my } = getPos(e);
      if (isDraggingRef.current) {
        const W = canvas.width / (window.devicePixelRatio || 1);
        const equilibriumX = W * 0.4;
        const newDisp = Math.max(-160, Math.min(160, mx - equilibriumX));
        dispRef.current = newDisp;
        velRef.current = 0;
        renderCanvas(newDisp, 0);
      } else {
        const wasHovering = isHoveringMassRef.current;
        const nowHovering = !isRunningRef.current && getMassHit(mx, my);
        if (wasHovering !== nowHovering) {
          isHoveringMassRef.current = nowHovering;
          canvas.style.cursor = nowHovering ? 'grab' : 'default';
          renderCanvas(dispRef.current, velRef.current);
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isRunningRef.current && !isPausedRef.current) return;
      const { mx, my } = getPos(e);
      if (getMassHit(mx, my)) {
        isDraggingRef.current = true;
        isHoveringMassRef.current = false;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        renderCanvas(dispRef.current, velRef.current);
      }
    };

    const onPointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        const finalDisp = dispRef.current;
        canvas.style.cursor = 'grab';
        setInitDisp(Math.round(finalDisp));
        renderCanvas(finalDisp, 0);
      }
    };

    const onPointerLeave = () => {
      if (!isDraggingRef.current) {
        isHoveringMassRef.current = false;
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [renderCanvas]);

  // Re-draw on param changes while idle
  useEffect(() => {
    if (!isRunning && !isDraggingRef.current) {
      dispRef.current = initDisp;
      velRef.current = 0;
      posHistoryRef.current = [];
      setDispDisplay(initDisp);
      setVelDisplay(0);
      setTimeDisplay(0);
      setKeDisplay(0);
      setPeDisplay(0.5 * springK * initDisp * initDisp);
      renderCanvas(initDisp, 0);
    }
  }, [springK, mass, damping, initDisp, isRunning, renderCanvas]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || isPaused) {
      isActiveRef.current = false;
      return;
    }
    isActiveRef.current = true;
    lastTimestampRef.current = 0;

    const animate = (ts: number) => {
      if (!isActiveRef.current) return;
      if (lastTimestampRef.current === 0) lastTimestampRef.current = ts;

      const rawDt = Math.min((ts - lastTimestampRef.current) / 1000, 0.05);
      lastTimestampRef.current = ts;
      const frameDt = rawDt * paramsRef.current.speed;

      const steps = 8;
      const dt = frameDt / steps;
      const { springK: k, mass: m, damping: damp } = paramsRef.current;

      for (let i = 0; i < steps; i++) {
        const force = -k * dispRef.current;
        const acc = force / m;
        velRef.current = (velRef.current + acc * dt) * Math.pow(damp, dt);
        dispRef.current += velRef.current * dt * 60;
      }

      elapsedRef.current += frameDt;
      posHistoryRef.current.push(dispRef.current);
      if (posHistoryRef.current.length > 200) posHistoryRef.current.shift();

      const KE = 0.5 * m * velRef.current * velRef.current;
      const PE = 0.5 * k * dispRef.current * dispRef.current;

      setDispDisplay(dispRef.current);
      setVelDisplay(velRef.current);
      setTimeDisplay(elapsedRef.current);
      setKeDisplay(KE);
      setPeDisplay(PE);

      renderCanvas(dispRef.current, velRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      isActiveRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, isPaused, renderCanvas]);

  const handleStart = () => {
    dispRef.current = initDisp;
    velRef.current = 0;
    elapsedRef.current = 0;
    posHistoryRef.current = [];
    setDispDisplay(initDisp);
    setVelDisplay(0);
    setTimeDisplay(0);
    setIsPaused(false);
    setIsRunning(true);
  };

  const handlePause = () => setIsPaused(p => !p);

  const handleReset = () => {
    isActiveRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setIsPaused(false);
    dispRef.current = initDisp;
    velRef.current = 0;
    elapsedRef.current = 0;
    posHistoryRef.current = [];
    setDispDisplay(initDisp);
    setVelDisplay(0);
    setTimeDisplay(0);
    setKeDisplay(0);
    setPeDisplay(0.5 * springK * initDisp * initDisp);
    renderCanvas(initDisp, 0);
  };

  const frequency = getFrequency();
  const period = getPeriod();
  const totalE = keDisplay + peDisplay;

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold mb-2 dark:text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
        Spring Oscillator
      </h2>

      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        <div className="space-y-2 overflow-y-auto pr-1">
          {[
            { label: 'Spring Const. (k)', value: springK, min: 0.005, max: 0.5, step: 0.005, unit: ' N/m', set: setSpringK },
            { label: 'Mass', value: mass, min: 0.2, max: 8, step: 0.1, unit: ' kg', set: setMass },
            { label: 'Damping', value: damping, min: 0.980, max: 1.000, step: 0.001, unit: '', set: setDamping },
            { label: 'Initial Disp.', value: initDisp, min: -160, max: 160, step: 5, unit: ' px', set: setInitDisp },
          ].map(({ label, value, min, max, step, unit, set }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <label className="flex justify-between text-xs font-medium mb-1 dark:text-gray-300">
                <span>{label}</span>
                <span className="font-mono text-teal-600 dark:text-teal-400">{value.toFixed(step < 1 ? (step < 0.01 ? 3 : 2) : 0)}{unit}</span>
              </label>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-teal-500 h-1.5"
                disabled={isRunning && !isPaused} />
            </div>
          ))}

          {/* Speed control */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <label className="text-xs font-medium dark:text-gray-300 block mb-1.5">Speed</label>
            <div className="flex gap-1">
              {[0.25, 0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${speed === s ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {!isRunning ? (
              <button onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-medium py-1.5 rounded-lg transition-colors text-xs">
                <Play className="h-3.5 w-3.5" /> Start
              </button>
            ) : (
              <button onClick={handlePause}
                className={`flex-1 flex items-center justify-center gap-1.5 ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'} text-white font-medium py-1.5 rounded-lg transition-colors text-xs`}>
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            <button onClick={handleReset}
              className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-1.5 px-3 rounded-lg transition-colors text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-lg border border-teal-200 dark:border-teal-800 p-2">
            <h3 className="font-semibold dark:text-white text-xs mb-1.5">Physics Data</h3>
            <div className="space-y-1">
              {[
                { label: 'Period', value: period === Infinity ? '∞' : `${period.toFixed(3)} s` },
                { label: 'Frequency', value: `${frequency.toFixed(3)} Hz` },
                { label: 'Displacement', value: `${dispDisplay.toFixed(2)} px`, color: 'text-cyan-600 dark:text-cyan-400' },
                { label: 'Velocity', value: `${velDisplay.toFixed(3)} px/s`, color: 'text-green-600 dark:text-green-400' },
                { label: 'KE', value: `${keDisplay.toFixed(4)} J` },
                { label: 'PE', value: `${peDisplay.toFixed(4)} J` },
                { label: 'Total E', value: `${totalE.toFixed(4)} J`, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Time', value: `${timeDisplay.toFixed(2)} s` },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[10px] dark:text-gray-300">
                  <span>{label}</span>
                  <span className={`font-bold font-mono ${color || ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold dark:text-gray-300 mb-1">Hooke's Law</h3>
            <div className="text-[9px] font-mono dark:text-gray-400 space-y-0.5">
              <p>F = −kx</p>
              <p>ω = √(k/m)</p>
              <p>T = 2π√(m/k)</p>
              <p>E = ½mv² + ½kx²</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col overflow-hidden min-h-0">
          <canvas ref={canvasRef}
            className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
            style={{ minHeight: 0 }} />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] dark:text-gray-400 px-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span>Mass</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-teal-500 inline-block"></span>Spring</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-green-500 inline-block"></span>Velocity (v)</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-purple-500 inline-block"></span>Force (F)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-500 inline-block rounded-sm"></span>KE bar</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 inline-block rounded-sm"></span>PE bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
