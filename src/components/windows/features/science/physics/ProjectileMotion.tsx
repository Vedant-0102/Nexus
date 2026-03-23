import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export const ProjectileMotion: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [velocity, setVelocity] = useState(30);
  const [angle, setAngle] = useState(45);
  const [gravity, setGravity] = useState(9.8);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [displayTime, setDisplayTime] = useState(0);

  const animationRef = useRef<number>();
  const elapsedRef = useRef(0);
  const lastTimestampRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Interaction refs
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isDraggingAngleRef = useRef(false);

  isRunningRef.current = isRunning;
  isPausedRef.current = isPaused;

  const paramsRef = useRef({ velocity, angle, gravity, speed });
  paramsRef.current = { velocity, angle, gravity, speed };

  const getPhysics = () => {
    const { velocity: v, angle: a, gravity: g } = paramsRef.current;
    const rad = (a * Math.PI) / 180;
    const vx = v * Math.cos(rad);
    const vy = v * Math.sin(rad);
    const maxHeight = (vy * vy) / (2 * g);
    const totalTime = (2 * vy) / g;
    const range = vx * totalTime;
    return { vx, vy, maxHeight, totalTime, range, rad };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 4) return;
    const headLen = Math.min(12, len * 0.4);
    const ang = Math.atan2(dy, dx);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI / 6), y2 - headLen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI / 6), y2 - headLen * Math.sin(ang + Math.PI / 6));
    ctx.closePath(); ctx.fill();
  };

  const renderCanvas = useCallback((elapsed: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const isDark = document.documentElement.classList.contains('dark');

    const { vx, vy, totalTime, maxHeight, range, rad } = getPhysics();
    const scaleX = (W - 80) / Math.max(range, 1);
    const scaleY = (H - 80) / Math.max(maxHeight, 1);
    const scale = Math.min(scaleX, scaleY, 15);
    const originX = 50;
    const originY = H - 40;

    // Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, originY);
    skyGrad.addColorStop(0, isDark ? '#07101f' : '#87CEEB');
    skyGrad.addColorStop(1, isDark ? '#0f2040' : '#C8E8FA');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, originY);

    const groundGrad = ctx.createLinearGradient(0, originY, 0, H);
    groundGrad.addColorStop(0, isDark ? '#2d4a1e' : '#5a9e3a');
    groundGrad.addColorStop(1, isDark ? '#1a2d12' : '#3a7a20');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, originY, W, H - originY);

    ctx.strokeStyle = isDark ? '#4a6a30' : '#2d6a10';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 50) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, originY); ctx.stroke();
    }
    for (let gy = originY; gy > 0; gy -= 50) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Full trajectory (dashed preview)
    ctx.strokeStyle = isDark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    for (let t = 0; t <= totalTime; t += totalTime / 200) {
      const px = originX + vx * t * scale;
      const py = originY - (vy * t - 0.5 * paramsRef.current.gravity * t * t) * scale;
      t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Motion trail
    if (trailRef.current.length > 1) {
      for (let i = 1; i < trailRef.current.length; i++) {
        const alpha = (i / trailRef.current.length) * 0.5;
        ctx.strokeStyle = `rgba(239,68,68,${alpha})`;
        ctx.lineWidth = 3 * (i / trailRef.current.length);
        ctx.beginPath();
        ctx.moveTo(trailRef.current[i - 1].x, trailRef.current[i - 1].y);
        ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        ctx.stroke();
      }
    }

    const t = Math.min(elapsed, totalTime);
    const px = originX + vx * t * scale;
    const py = originY - (vy * t - 0.5 * paramsRef.current.gravity * t * t) * scale;

    // Max height dotted line
    if (elapsed > 0 && maxHeight > 0.5) {
      const markerY = originY - maxHeight * scale;
      ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.6)' : 'rgba(217,119,6,0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(originX, markerY); ctx.lineTo(W - 10, markerY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#FCD34D' : '#B45309';
      ctx.font = '10px Segoe UI, sans-serif';
      ctx.fillText(`${maxHeight.toFixed(1)}m`, W - 60, markerY - 3);
    }

    // Velocity vector
    const curVx = vx;
    const curVy = vy - paramsRef.current.gravity * t;
    const vScale = 3.5;
    ctx.strokeStyle = '#10B981'; ctx.fillStyle = '#10B981'; ctx.lineWidth = 2.5;
    drawArrow(ctx, px, py, px + curVx * vScale, py - curVy * vScale);

    ctx.strokeStyle = isDark ? 'rgba(251,191,36,0.8)' : 'rgba(217,119,6,0.9)';
    ctx.fillStyle = isDark ? 'rgba(251,191,36,0.8)' : 'rgba(217,119,6,0.9)';
    ctx.lineWidth = 1.5;
    drawArrow(ctx, px, py, px + curVx * vScale, py);

    ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.8)' : 'rgba(124,58,237,0.9)';
    ctx.fillStyle = isDark ? 'rgba(167,139,250,0.8)' : 'rgba(124,58,237,0.9)';
    ctx.lineWidth = 1.5;
    drawArrow(ctx, px, py, px, py - curVy * vScale);

    // Launch angle arc
    ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.9)' : '#7C3AED';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(originX, originY, 38, -rad, 0); ctx.stroke();
    ctx.fillStyle = isDark ? '#A78BFA' : '#7C3AED';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillText(`${paramsRef.current.angle}°`, originX + 44, originY - 14);

    // Aiming line when dragging
    if (isDraggingAngleRef.current) {
      const aimLen = 80;
      ctx.strokeStyle = isDark ? 'rgba(167,139,250,0.5)' : 'rgba(124,58,237,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + aimLen * Math.cos(rad), originY - aimLen * Math.sin(rad));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Projectile ball
    const ballGrad = ctx.createRadialGradient(px - 3, py - 3, 1, px, py, 11);
    ballGrad.addColorStop(0, '#FCA5A5');
    ballGrad.addColorStop(0.5, '#EF4444');
    ballGrad.addColorStop(1, '#991B1B');
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#EF4444';
    ctx.fillStyle = ballGrad;
    ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#7F1D1D'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(px - 3.5, py - 3.5, 4, 0, Math.PI * 2); ctx.fill();

    // Launch platform
    ctx.fillStyle = isDark ? '#374151' : '#6B7280';
    ctx.beginPath(); ctx.roundRect(originX - 15, originY - 6, 30, 8, 3); ctx.fill();

    // Drag hint when idle
    if (!isRunningRef.current && !isDraggingAngleRef.current && trailRef.current.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Click or drag canvas to set launch angle', W / 2, originY - 28);
      ctx.textAlign = 'left';
    }

    // Legend
    ctx.font = '11px Segoe UI, sans-serif';
    const legends = [
      { color: '#10B981', label: 'Velocity' },
      { color: isDark ? '#FCD34D' : '#B45309', label: 'Vx' },
      { color: isDark ? '#A78BFA' : '#7C3AED', label: 'Vy' },
    ];
    legends.forEach(({ color, label }, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(W - 90, 12 + i * 18, 12, 3);
      ctx.fillStyle = isDark ? '#D1D5DB' : '#374151';
      ctx.fillText(label, W - 72, 17 + i * 18);
    });
  }, []);

  // Init canvas
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
      renderCanvas(elapsedRef.current);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [renderCanvas]);

  // Pointer interaction — drag canvas to aim
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

    const computeAngle = (mx: number, my: number) => {
      const H = canvas.height / (window.devicePixelRatio || 1);
      const originX = 50;
      const originY = H - 40;
      const dx = mx - originX;
      const dy = -(my - originY);
      if (dx < 0) return null; // behind launch point
      const deg = Math.atan2(dy, dx) * 180 / Math.PI;
      return Math.max(1, Math.min(89, Math.round(deg)));
    };

    const applyAngle = (mx: number, my: number) => {
      const newAngle = computeAngle(mx, my);
      if (newAngle === null) return;
      paramsRef.current = { ...paramsRef.current, angle: newAngle };
      renderCanvas(0);
      setAngle(newAngle);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isRunningRef.current && !isPausedRef.current) return;
      const { mx, my } = getPos(e);
      if (computeAngle(mx, my) === null) return;
      isDraggingAngleRef.current = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'crosshair';
      applyAngle(mx, my);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isRunningRef.current) {
        canvas.style.cursor = 'crosshair';
      }
      if (isDraggingAngleRef.current) {
        const { mx, my } = getPos(e);
        applyAngle(mx, my);
      }
    };

    const onPointerUp = () => {
      if (isDraggingAngleRef.current) {
        isDraggingAngleRef.current = false;
        renderCanvas(0);
      }
    };

    const onPointerLeave = () => {
      if (!isRunningRef.current) canvas.style.cursor = 'default';
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [renderCanvas]);

  // Re-draw on param changes while idle
  useEffect(() => {
    if (!isRunning) {
      elapsedRef.current = 0;
      trailRef.current = [];
      setDisplayTime(0);
      renderCanvas(0);
    }
  }, [velocity, angle, gravity, isRunning, renderCanvas]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || isPaused) {
      isActiveRef.current = false;
      return;
    }
    isActiveRef.current = true;
    lastTimestampRef.current = 0;

    const { vx, vy, totalTime } = getPhysics();
    const originX = 50;

    const animate = (ts: number) => {
      if (!isActiveRef.current) return;
      if (lastTimestampRef.current === 0) lastTimestampRef.current = ts;
      const rawDt = Math.min((ts - lastTimestampRef.current) / 1000, 0.05);
      lastTimestampRef.current = ts;
      const dt = rawDt * paramsRef.current.speed;

      elapsedRef.current += dt;
      const t = elapsedRef.current;
      setDisplayTime(t);

      const canvas = canvasRef.current;
      if (canvas) {
        const H = canvas.height / (window.devicePixelRatio || 1);
        const { maxHeight, range } = getPhysics();
        const scaleX = (canvas.width / (window.devicePixelRatio || 1) - 80) / Math.max(range, 1);
        const scaleY = (H - 80) / Math.max(maxHeight, 1);
        const sc = Math.min(scaleX, scaleY, 15);
        const originY = H - 40;
        const px = originX + vx * t * sc;
        const py = originY - (vy * t - 0.5 * paramsRef.current.gravity * t * t) * sc;
        trailRef.current.push({ x: px, y: py });
        if (trailRef.current.length > 40) trailRef.current.shift();
      }

      renderCanvas(t);

      if (t >= totalTime) {
        isActiveRef.current = false;
        setIsRunning(false);
        return;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      isActiveRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, isPaused, renderCanvas]);

  const handleLaunch = () => {
    elapsedRef.current = 0;
    trailRef.current = [];
    setDisplayTime(0);
    setIsPaused(false);
    setIsRunning(true);
  };

  const handlePause = () => setIsPaused(p => !p);

  const handleReset = () => {
    isActiveRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    elapsedRef.current = 0;
    trailRef.current = [];
    setDisplayTime(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    renderCanvas(0);
  };

  const { maxHeight, totalTime, range } = getPhysics();

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold mb-2 dark:text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
        Projectile Motion Simulator
      </h2>

      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        <div className="space-y-2 overflow-y-auto pr-1">
          {[
            { label: 'Velocity', value: velocity, min: 10, max: 80, step: 1, unit: 'm/s', set: setVelocity },
            { label: 'Angle', value: angle, min: 1, max: 89, step: 1, unit: '°', set: setAngle },
            { label: 'Gravity', value: gravity, min: 0.5, max: 25, step: 0.1, unit: 'm/s²', set: setGravity },
          ].map(({ label, value, min, max, step, unit, set }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <label className="flex justify-between text-xs font-medium mb-1 dark:text-gray-300">
                <span>{label}</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value} {unit}</span>
              </label>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full accent-blue-500 h-1.5"
                disabled={isRunning && !isPaused} />
            </div>
          ))}

          {/* Speed control */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <label className="text-xs font-medium dark:text-gray-300 block mb-1.5">Speed</label>
            <div className="flex gap-1">
              {[0.25, 0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${speed === s ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {!isRunning ? (
              <button onClick={handleLaunch}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 rounded-lg transition-colors text-xs">
                <Play className="h-3.5 w-3.5" /> Launch
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

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-2">
            <h3 className="font-semibold dark:text-white text-xs mb-1.5">Physics Data</h3>
            <div className="space-y-1">
              {[
                { label: 'Max Height', value: `${maxHeight.toFixed(2)} m`, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Flight Time', value: `${totalTime.toFixed(2)} s`, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Range', value: `${range.toFixed(2)} m`, color: 'text-green-600 dark:text-green-400' },
                { label: 'Elapsed', value: `${displayTime.toFixed(2)} s`, color: 'text-purple-600 dark:text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-[10px] dark:text-gray-300">
                  <span>{label}</span>
                  <span className={`font-bold font-mono ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
            <h3 className="text-[10px] font-semibold dark:text-gray-300 mb-1">Equations</h3>
            <div className="text-[9px] font-mono dark:text-gray-400 space-y-0.5">
              <p>x = v·cos(θ)·t</p>
              <p>y = v·sin(θ)·t − ½gt²</p>
              <p>H = v²sin²(θ)/2g</p>
              <p>R = v²sin(2θ)/g</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col overflow-hidden min-h-0">
          <canvas ref={canvasRef}
            className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
            style={{ minHeight: 0 }} />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] dark:text-gray-400 px-1">
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-green-500 inline-block"></span>Total velocity</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-yellow-500 inline-block"></span>Horizontal (Vx)</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-purple-500 inline-block"></span>Vertical (Vy)</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-px border-t-2 border-dashed border-blue-400 inline-block"></span>Trajectory</span>
          </div>
        </div>
      </div>
    </div>
  );
};
