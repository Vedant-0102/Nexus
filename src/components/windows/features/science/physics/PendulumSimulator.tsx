import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, MousePointer } from 'lucide-react';

export const PendulumSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [lengthPx, setLengthPx] = useState(200);
  const [mass, setMass] = useState(10);
  const [gravity, setGravity] = useState(9.8);
  const [initialAngle, setInitialAngle] = useState(45);
  const [damping, setDamping] = useState(0.999);
  const [speed, setSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [displayAngle, setDisplayAngle] = useState(45);
  const [displayOmega, setDisplayOmega] = useState(0);
  const [displayEnergy, setDisplayEnergy] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringBob, setIsHoveringBob] = useState(false);

  const angleRef = useRef((initialAngle * Math.PI) / 180);
  const omegaRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const isActiveRef = useRef(false);
  const animationRef = useRef<number>();
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const isDraggingRef = useRef(false);

  const paramsRef = useRef({ lengthPx, mass, gravity, damping, speed });
  paramsRef.current = { lengthPx, mass, gravity, damping, speed };

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const getLengthM = () => paramsRef.current.lengthPx / 100;
  const getPeriod = () => 2 * Math.PI * Math.sqrt(getLengthM() / paramsRef.current.gravity);

  const drawArrowHead = (ctx: CanvasRenderingContext2D, tx2: number, ty2: number, ang: number, headLen: number) => {
    ctx.beginPath();
    ctx.moveTo(tx2, ty2);
    ctx.lineTo(tx2 - headLen * Math.cos(ang - Math.PI / 6), ty2 - headLen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(tx2 - headLen * Math.cos(ang + Math.PI / 6), ty2 - headLen * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const renderCanvas = useCallback((theta: number, omega: number, dragging = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const isDark = document.documentElement.classList.contains('dark');

    const { lengthPx: L, mass: m, gravity: g } = paramsRef.current;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = isDark ? '#080c18' : '#f0f4f8';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    const pivotX = W / 2;
    const pivotY = 55;
    const bobX = pivotX + L * Math.sin(theta);
    const bobY = pivotY + L * Math.cos(theta);
    const bobR = Math.max(8, m * 0.7);

    // Ceiling mount
    ctx.fillStyle = isDark ? '#374151' : '#9CA3AF';
    ctx.fillRect(pivotX - 30, 0, 60, pivotY - 4);
    ctx.fillStyle = isDark ? '#4B5563' : '#6B7280';
    ctx.fillRect(pivotX - 35, pivotY - 12, 70, 10);

    // Equilibrium guide
    ctx.strokeStyle = isDark ? 'rgba(99,179,237,0.25)' : 'rgba(59,130,246,0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(pivotX, pivotY + L + bobR + 15); ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (trailRef.current.length > 1) {
      for (let i = 1; i < trailRef.current.length; i++) {
        const t0 = trailRef.current[i - 1], t1 = trailRef.current[i];
        const alpha = (i / trailRef.current.length) * 0.4;
        ctx.strokeStyle = isDark ? `rgba(239,68,68,${alpha})` : `rgba(220,38,38,${alpha})`;
        ctx.lineWidth = bobR * 0.4 * (i / trailRef.current.length);
        ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.stroke();
      }
    }

    // Angle arc
    ctx.strokeStyle = isDark ? '#A78BFA' : '#7C3AED';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (theta >= 0) ctx.arc(pivotX, pivotY, 44, Math.PI / 2, Math.PI / 2 + theta);
    else ctx.arc(pivotX, pivotY, 44, Math.PI / 2 + theta, Math.PI / 2);
    ctx.stroke();
    const angleDeg = (theta * 180) / Math.PI;
    ctx.fillStyle = isDark ? '#C4B5FD' : '#7C3AED';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    const midAngle = Math.PI / 2 + theta / 2;
    ctx.fillText(`${Math.abs(angleDeg).toFixed(1)}°`, pivotX + 52 * Math.cos(midAngle) - 12, pivotY + 52 * Math.sin(midAngle) + 4);

    // String
    const strGrad = ctx.createLinearGradient(pivotX, pivotY, bobX, bobY);
    strGrad.addColorStop(0, isDark ? '#9CA3AF' : '#4B5563');
    strGrad.addColorStop(1, isDark ? '#6B7280' : '#6B7280');
    ctx.strokeStyle = strGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

    // Velocity vector
    const vMag = Math.abs(omega) * (L / 100) * 30;
    const vDir = omega >= 0 ? 1 : -1;
    const tangentX = Math.cos(theta) * vDir;
    const tangentY = -Math.sin(theta) * vDir;
    if (vMag > 2) {
      const headLen = Math.min(10, vMag * 0.3);
      const tx2 = bobX + tangentX * vMag, ty2 = bobY + tangentY * vMag;
      const ang = Math.atan2(ty2 - bobY, tx2 - bobX);
      ctx.strokeStyle = '#10B981'; ctx.fillStyle = '#10B981'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bobX, bobY); ctx.lineTo(tx2, ty2); ctx.stroke();
      drawArrowHead(ctx, tx2, ty2, ang, headLen);
    }

    // Bob — glow ring when dragging/hovering
    if (dragging || isDraggingRef.current) {
      ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.8)' : 'rgba(124,58,237,0.8)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.arc(bobX, bobY, bobR + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (isHoveringBob) {
      ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bobX, bobY, bobR + 8, 0, Math.PI * 2); ctx.stroke();
    }

    const bobGrad = ctx.createRadialGradient(bobX - bobR * 0.3, bobY - bobR * 0.3, 1, bobX, bobY, bobR);
    bobGrad.addColorStop(0, '#FCA5A5');
    bobGrad.addColorStop(0.5, '#EF4444');
    bobGrad.addColorStop(1, '#991B1B');
    ctx.shadowBlur = dragging ? 30 : 20;
    ctx.shadowColor = dragging ? 'rgba(167,139,250,0.8)' : 'rgba(239,68,68,0.6)';
    ctx.fillStyle = bobGrad;
    ctx.beginPath(); ctx.arc(bobX, bobY, bobR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#7F1D1D'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(bobX - bobR * 0.3, bobY - bobR * 0.3, bobR * 0.28, 0, Math.PI * 2); ctx.fill();

    // Pivot dot
    ctx.fillStyle = isDark ? '#D1D5DB' : '#374151';
    ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isDark ? '#6B7280' : '#9CA3AF'; ctx.lineWidth = 1.5; ctx.stroke();

    // Energy bar
    const E = 0.5 * m * Math.pow(omega * (L / 100), 2) + m * g * (L / 100) * (1 - Math.cos(theta));
    const E0 = m * g * (L / 100) * (1 - Math.cos(angleRef.current || theta));
    const PE = m * g * (L / 100) * (1 - Math.cos(theta));
    const KE = E - PE;
    const barW = 100, barH = 8, barX = W - barW - 8, barY = H - 35;
    const maxE = Math.max(E0, 0.001);
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 3); ctx.fill();
    const keFrac = Math.min(Math.max(KE / maxE, 0), 1);
    ctx.fillStyle = '#10B981';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * keFrac, barH, 3); ctx.fill();
    const peFrac = Math.min(Math.max(PE / maxE, 0), 1);
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath(); ctx.roundRect(barX + barW * keFrac, barY, barW * peFrac, barH, 3); ctx.fill();
    ctx.font = '9px Segoe UI, sans-serif';
    ctx.fillStyle = isDark ? '#9CA3AF' : '#6B7280';
    ctx.fillText('KE', barX, barY - 2);
    ctx.fillText('PE', barX + 22, barY - 2);
    ctx.fillText('Energy', barX + barW - 32, barY - 2);

    // Drag hint (shown when stopped, no trail)
    if (!isRunningRef.current && trailRef.current.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(167,139,250,0.55)' : 'rgba(124,58,237,0.5)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag the bob to set angle', W / 2, H - 10);
      ctx.textAlign = 'left';
    }
  }, [isHoveringBob]);

  // Canvas setup + pointer events
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
      renderCanvas(angleRef.current, omegaRef.current);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);

    // Pointer events
    const getCanvasPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
    };
    const getPivot = () => {
      const W = canvas.width / (window.devicePixelRatio || 1);
      return { pivotX: W / 2, pivotY: 55 };
    };
    const getBobPos = () => {
      const { pivotX, pivotY } = getPivot();
      const L = paramsRef.current.lengthPx;
      return {
        bobX: pivotX + L * Math.sin(angleRef.current),
        bobY: pivotY + L * Math.cos(angleRef.current),
        bobR: Math.max(8, paramsRef.current.mass * 0.7),
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const { mx, my } = getCanvasPos(e);
      if (isDraggingRef.current) {
        const { pivotX, pivotY } = getPivot();
        const newAngle = Math.atan2(mx - pivotX, my - pivotY);
        const clampedAngle = Math.max(-Math.PI * 0.92, Math.min(Math.PI * 0.92, newAngle));
        angleRef.current = clampedAngle;
        omegaRef.current = 0;
        const deg = (clampedAngle * 180) / Math.PI;
        setDisplayAngle(deg);
        const L = paramsRef.current.lengthPx / 100;
        setDisplayEnergy(paramsRef.current.mass * paramsRef.current.gravity * L * (1 - Math.cos(clampedAngle)));
        renderCanvas(clampedAngle, 0, true);
        canvas.style.cursor = 'grabbing';
      } else {
        const { bobX, bobY, bobR } = getBobPos();
        const dist = Math.sqrt((mx - bobX) ** 2 + (my - bobY) ** 2);
        const near = dist < bobR + 14;
        canvas.style.cursor = near ? 'grab' : 'default';
        setIsHoveringBob(near);
        if (near) renderCanvas(angleRef.current, omegaRef.current);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isRunningRef.current && !isPausedRef.current) return;
      const { mx, my } = getCanvasPos(e);
      const { bobX, bobY, bobR } = getBobPos();
      const dist = Math.sqrt((mx - bobX) ** 2 + (my - bobY) ** 2);
      if (dist < bobR + 14) {
        isDraggingRef.current = true;
        setIsDragging(true);
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        // Pause if running
        if (isRunningRef.current && isPausedRef.current === false) {
          isActiveRef.current = false;
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        const finalDeg = Math.round((angleRef.current * 180) / Math.PI);
        setInitialAngle(finalDeg);
        renderCanvas(angleRef.current, 0);
        canvas.style.cursor = 'grab';
      }
    };

    const handlePointerLeave = () => {
      if (!isDraggingRef.current) {
        setIsHoveringBob(false);
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      obs.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [renderCanvas]);

  // Re-draw when params change while idle
  useEffect(() => {
    if (!isRunning && !isDraggingRef.current) {
      const thetaInit = (initialAngle * Math.PI) / 180;
      angleRef.current = thetaInit;
      omegaRef.current = 0;
      trailRef.current = [];
      setDisplayAngle(initialAngle);
      setDisplayOmega(0);
      setDisplayTime(0);
      const L = lengthPx / 100;
      setDisplayEnergy(mass * gravity * L * (1 - Math.cos(thetaInit)));
      renderCanvas(thetaInit, 0);
    }
  }, [lengthPx, mass, gravity, initialAngle, damping, isRunning, renderCanvas]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || isPaused) { isActiveRef.current = false; return; }
    isActiveRef.current = true;
    lastTimestampRef.current = 0;

    const animate = (ts: number) => {
      if (!isActiveRef.current) return;
      if (lastTimestampRef.current === 0) lastTimestampRef.current = ts;
      const frameDt = Math.min((ts - lastTimestampRef.current) / 1000, 0.05) * paramsRef.current.speed;
      lastTimestampRef.current = ts;

      const steps = 4;
      const dt = frameDt / steps;
      const { gravity: g, damping: damp, lengthPx: L } = paramsRef.current;
      const lenM = L / 100;
      for (let i = 0; i < steps; i++) {
        const alpha = (-g / lenM) * Math.sin(angleRef.current);
        omegaRef.current = (omegaRef.current + alpha * dt) * damp;
        angleRef.current += omegaRef.current * dt;
      }
      elapsedRef.current += frameDt;

      // Trail
      const canvas = canvasRef.current;
      if (canvas) {
        const W = canvas.width / (window.devicePixelRatio || 1);
        const bx = W / 2 + L * Math.sin(angleRef.current);
        const by = 55 + L * Math.cos(angleRef.current);
        trailRef.current.push({ x: bx, y: by, alpha: 1 });
        if (trailRef.current.length > 60) trailRef.current.shift();
      }

      const angleDeg = (angleRef.current * 180) / Math.PI;
      const E = 0.5 * paramsRef.current.mass * Math.pow(omegaRef.current * lenM, 2) +
        paramsRef.current.mass * g * lenM * (1 - Math.cos(angleRef.current));
      setDisplayAngle(angleDeg);
      setDisplayOmega(omegaRef.current);
      setDisplayEnergy(E);
      setDisplayTime(elapsedRef.current);
      renderCanvas(angleRef.current, omegaRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { isActiveRef.current = false; if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isRunning, isPaused, renderCanvas]);

  const handleStart = () => {
    const theta = (initialAngle * Math.PI) / 180;
    angleRef.current = theta;
    omegaRef.current = 0;
    elapsedRef.current = 0;
    trailRef.current = [];
    setDisplayTime(0);
    setIsPaused(false);
    setIsRunning(true);
  };
  const handlePause = () => setIsPaused(p => !p);
  const handleReset = () => {
    isActiveRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false); setIsPaused(false);
    const theta = (initialAngle * Math.PI) / 180;
    angleRef.current = theta; omegaRef.current = 0;
    elapsedRef.current = 0; trailRef.current = [];
    setDisplayAngle(initialAngle); setDisplayOmega(0); setDisplayTime(0);
    const L = lengthPx / 100;
    setDisplayEnergy(mass * gravity * L * (1 - Math.cos(theta)));
    renderCanvas(theta, 0);
  };

  const period = getPeriod();

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold mb-2 dark:text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
        Pendulum Simulator
        {isDragging && <span className="text-xs font-normal text-purple-500 dark:text-purple-400 ml-1 flex items-center gap-1"><MousePointer size={11} /> dragging…</span>}
      </h2>

      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        {/* Controls */}
        <div className="space-y-2 overflow-y-auto pr-1">
          {[
            { label: 'Length', value: lengthPx, min: 60, max: 280, step: 5, unit: 'px', set: setLengthPx },
            { label: 'Mass', value: mass, min: 3, max: 25, step: 1, unit: 'kg', set: setMass },
            { label: 'Gravity', value: gravity, min: 0.5, max: 25, step: 0.1, unit: 'm/s²', set: setGravity },
            { label: 'Init. Angle', value: initialAngle, min: 5, max: 170, step: 1, unit: '°', set: setInitialAngle },
            { label: 'Damping', value: damping, min: 0.980, max: 1.000, step: 0.001, unit: '', set: setDamping },
          ].map(({ label, value, min, max, step, unit, set }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <label className="flex justify-between text-xs font-medium mb-1 dark:text-gray-300">
                <span>{label}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{value.toFixed(step < 1 ? (step < 0.01 ? 3 : 1) : 0)}{unit}</span>
              </label>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5" disabled={isRunning && !isPaused} />
            </div>
          ))}

          {/* Speed control */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <label className="text-xs font-medium dark:text-gray-300 mb-1 block">Simulation Speed</label>
            <div className="flex gap-1">
              {[0.25, 0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-1 text-[10px] rounded font-medium transition-colors ${speed === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {!isRunning ? (
              <button onClick={handleStart} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded-lg transition-colors text-xs">
                <Play className="h-3.5 w-3.5" /> Start
              </button>
            ) : (
              <button onClick={handlePause} className={`flex-1 flex items-center justify-center gap-1.5 ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'} text-white font-medium py-1.5 rounded-lg transition-colors text-xs`}>
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
            )}
            <button onClick={handleReset} className="flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-1.5 px-3 rounded-lg transition-colors text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Data panel */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-2">
            <h3 className="font-semibold dark:text-white text-xs mb-1.5">Physics Data</h3>
            <div className="space-y-1">
              {[
                { label: 'Period', value: `${period.toFixed(3)} s` },
                { label: 'Frequency', value: `${(1 / period).toFixed(3)} Hz` },
                { label: 'Angle', value: `${displayAngle.toFixed(2)}°`, color: 'text-purple-600 dark:text-purple-400' },
                { label: 'ω (ang. vel.)', value: `${displayOmega.toFixed(3)} rad/s`, color: 'text-green-600 dark:text-green-400' },
                { label: 'Total Energy', value: `${displayEnergy.toFixed(3)} J`, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Time', value: `${displayTime.toFixed(2)} s` },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[10px] dark:text-gray-300">
                  <span>{label}</span>
                  <span className={`font-bold font-mono ${color || ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="md:col-span-2 flex flex-col overflow-hidden min-h-0">
          <canvas ref={canvasRef} className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm" style={{ minHeight: 0 }} />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] dark:text-gray-400 px-1">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Bob (drag to set angle)</span>
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-green-500 inline-block" />Velocity</span>
            <span className="flex items-center gap-1"><span className="w-5 h-0.5 bg-purple-500 inline-block" />Angle arc</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm inline-block" />KE <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block ml-1" />PE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
