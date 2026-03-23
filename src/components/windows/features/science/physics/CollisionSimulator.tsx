import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface Ball {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
}

export const CollisionSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mass1, setMass1] = useState(5);
  const [vel1Init, setVel1Init] = useState(4);
  const [mass2, setMass2] = useState(5);
  const [vel2Init, setVel2Init] = useState(-3);
  const [elasticity, setElasticity] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const [hasCollided, setHasCollided] = useState(false);
  const [displayVel1, setDisplayVel1] = useState(vel1Init);
  const [displayVel2, setDisplayVel2] = useState(vel2Init);
  const [collisionFlash, setCollisionFlash] = useState(0);

  const ball1Ref = useRef<Ball>({ x: 0, y: 0, r: 0, vx: 0, vy: 0, trail: [] });
  const ball2Ref = useRef<Ball>({ x: 0, y: 0, r: 0, vx: 0, vy: 0, trail: [] });
  const hasCollidedRef = useRef(false);
  const collisionFlashRef = useRef(0);
  const isActiveRef = useRef(false);
  const animationRef = useRef<number>();
  const lastTimestampRef = useRef(0);

  // Interaction refs
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const draggingBallRef = useRef<0 | 1 | 2>(0); // 0=none, 1=ball1, 2=ball2
  const hoverBallRef = useRef<0 | 1 | 2>(0);

  isRunningRef.current = isRunning;
  isPausedRef.current = isPaused;

  const paramsRef = useRef({ mass1, vel1Init, mass2, vel2Init, elasticity, speed });
  paramsRef.current = { mass1, vel1Init, mass2, vel2Init, elasticity, speed };

  const initBalls = useCallback((): [Ball, Ball] => {
    const canvas = canvasRef.current;
    const W = canvas ? canvas.width / (window.devicePixelRatio || 1) : 600;
    const H = canvas ? canvas.height / (window.devicePixelRatio || 1) : 300;
    const { mass1: m1, vel1Init: v1, mass2: m2, vel2Init: v2 } = paramsRef.current;
    const r1 = 8 + m1 * 2.5;
    const r2 = 8 + m2 * 2.5;
    const groundY = H - 30;
    const b1: Ball = { x: W * 0.18, y: groundY - r1, r: r1, vx: v1, vy: 0, trail: [] };
    const b2: Ball = { x: W * 0.75, y: groundY - r2, r: r2, vx: v2, vy: 0, trail: [] };
    return [b1, b2];
  }, []);

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, vx: number, scale: number) => {
    if (Math.abs(vx) < 0.1) return;
    const toX = x1 + vx * scale;
    const dir = vx > 0 ? 1 : -1;
    const len = Math.abs(toX - x1);
    const headLen = Math.min(10, len * 0.35);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(toX, y1); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, y1);
    ctx.lineTo(toX - headLen * dir, y1 - headLen * 0.4);
    ctx.lineTo(toX - headLen * dir, y1 + headLen * 0.4);
    ctx.closePath(); ctx.fill();
  };

  const renderCanvas = useCallback((b1: Ball, b2: Ball) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width / (window.devicePixelRatio || 1);
    const H = canvas.height / (window.devicePixelRatio || 1);
    const isDark = document.documentElement.classList.contains('dark');
    const groundY = H - 30;

    ctx.clearRect(0, 0, W, H);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, isDark ? '#07101f' : '#e0eeff');
    skyGrad.addColorStop(1, isDark ? '#0f2040' : '#f0f8ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, groundY);

    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, isDark ? '#1a3a10' : '#5a9e3a');
    groundGrad.addColorStop(1, isDark ? '#0d2008' : '#2d6a10');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, groundY); ctx.stroke();
    }

    ctx.strokeStyle = isDark ? '#3a6a20' : '#2d6a10';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, groundY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(0, 0, 4, groundY);
    ctx.fillRect(W - 4, 0, 4, groundY);

    // Draw trails
    for (const [ball, color] of [[b1, '59,130,246'], [b2, '239,68,68']] as [Ball, string][]) {
      if (ball.trail.length > 1) {
        for (let i = 1; i < ball.trail.length; i++) {
          const alpha = (i / ball.trail.length) * 0.4;
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.lineWidth = ball.r * 0.6 * (i / ball.trail.length);
          ctx.beginPath();
          ctx.moveTo(ball.trail[i - 1].x, ball.trail[i - 1].y);
          ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
          ctx.stroke();
        }
      }
    }

    // Collision flash ring
    if (collisionFlashRef.current > 0) {
      const midX = (b1.x + b2.x) / 2;
      const midY = (b1.y + b2.y) / 2;
      const alpha = collisionFlashRef.current / 20;
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(251,191,36,${alpha * (1 - i * 0.3)})`;
        ctx.lineWidth = 3 - i;
        ctx.beginPath();
        ctx.arc(midX, midY, (b1.r + b2.r) * 0.6 + i * 12 + (20 - collisionFlashRef.current) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Hover/drag glow rings
    for (const [ball, idx, color] of [[b1, 1, '59,130,246'], [b2, 2, '239,68,68']] as [Ball, number, string][]) {
      if (hoverBallRef.current === idx || draggingBallRef.current === idx) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = `rgba(${color},0.5)`;
        ctx.strokeStyle = `rgba(${color},0.7)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r + 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw balls
    for (const [ball, fillTop, fillMid, fillBot, strokeC, shadowC] of [
      [b1, '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A', '#3B82F6'],
      [b2, '#FCA5A5', '#EF4444', '#DC2626', '#7F1D1D', '#EF4444'],
    ] as [Ball, string, string, string, string, string][]) {
      const bg = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, 1, ball.x, ball.y, ball.r);
      bg.addColorStop(0, fillTop);
      bg.addColorStop(0.5, fillMid);
      bg.addColorStop(1, fillBot);
      ctx.shadowBlur = draggingBallRef.current > 0 ? 28 : 18;
      ctx.shadowColor = `${shadowC}99`;
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = strokeC; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(ball.x - ball.r * 0.28, ball.y - ball.r * 0.28, ball.r * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${Math.min(12, ball.r * 0.7)}px Segoe UI, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${ball.r === b1.r ? paramsRef.current.mass1 : paramsRef.current.mass2}kg`, ball.x, ball.y + 4);
      ctx.textAlign = 'left';
    }

    // Velocity vectors
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#10B981'; ctx.fillStyle = '#10B981';
    drawArrow(ctx, b1.x + (b1.vx >= 0 ? b1.r : -b1.r), b1.y, b1.vx, 8);
    drawArrow(ctx, b2.x + (b2.vx >= 0 ? b2.r : -b2.r), b2.y, b2.vx, 8);

    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = isDark ? '#D1D5DB' : '#374151';
    ctx.fillText(`v=${b1.vx.toFixed(1)}`, b1.x - 15, b1.y - b1.r - 6);
    ctx.fillText(`v=${b2.vx.toFixed(1)}`, b2.x - 15, b2.y - b2.r - 6);

    // Drag hint when stopped
    if (!isRunningRef.current && draggingBallRef.current === 0 && b1.trail.length === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Drag balls to set starting positions', W / 2, groundY - Math.max(b1.r, b2.r) - 18);
      ctx.textAlign = 'left';
    }
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
      const [b1, b2] = initBalls();
      ball1Ref.current = b1;
      ball2Ref.current = b2;
      renderCanvas(b1, b2);
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [renderCanvas, initBalls]);

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

    const getBallHit = (mx: number, my: number): 0 | 1 | 2 => {
      const b1 = ball1Ref.current;
      const b2 = ball2Ref.current;
      if (Math.hypot(mx - b1.x, my - b1.y) <= b1.r + 8) return 1;
      if (Math.hypot(mx - b2.x, my - b2.y) <= b2.r + 8) return 2;
      return 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      const { mx } = getPos(e);
      const db = draggingBallRef.current;
      if (db > 0) {
        const canvas2 = canvasRef.current!;
        const W = canvas2.width / (window.devicePixelRatio || 1);
        const b1 = ball1Ref.current;
        const b2 = ball2Ref.current;
        if (db === 1) {
          b1.x = Math.max(b1.r + 4, Math.min(b2.x - b1.r - b2.r - 2, mx));
        } else {
          b2.x = Math.max(b1.x + b1.r + b2.r + 2, Math.min(W - 4 - b2.r, mx));
        }
        renderCanvas(b1, b2);
      } else {
        const { mx: mx2, my: my2 } = getPos(e);
        const wasHover = hoverBallRef.current;
        const nowHover = !isRunningRef.current ? getBallHit(mx2, my2) : 0;
        if (wasHover !== nowHover) {
          hoverBallRef.current = nowHover;
          canvas.style.cursor = nowHover > 0 ? 'grab' : 'default';
          renderCanvas(ball1Ref.current, ball2Ref.current);
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (isRunningRef.current && !isPausedRef.current) return;
      const { mx, my } = getPos(e);
      const hit = getBallHit(mx, my);
      if (hit > 0) {
        draggingBallRef.current = hit;
        hoverBallRef.current = 0;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        renderCanvas(ball1Ref.current, ball2Ref.current);
      }
    };

    const onPointerUp = () => {
      if (draggingBallRef.current > 0) {
        draggingBallRef.current = 0;
        canvas.style.cursor = 'grab';
        renderCanvas(ball1Ref.current, ball2Ref.current);
      }
    };

    const onPointerLeave = () => {
      if (draggingBallRef.current === 0) {
        hoverBallRef.current = 0;
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
    if (!isRunning) {
      const [b1, b2] = initBalls();
      ball1Ref.current = b1;
      ball2Ref.current = b2;
      hasCollidedRef.current = false;
      collisionFlashRef.current = 0;
      setHasCollided(false);
      setDisplayVel1(vel1Init);
      setDisplayVel2(vel2Init);
      renderCanvas(b1, b2);
    }
  }, [mass1, vel1Init, mass2, vel2Init, elasticity, isRunning, renderCanvas, initBalls]);

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

      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.width / (window.devicePixelRatio || 1);
      const H = canvas.height / (window.devicePixelRatio || 1);
      const groundY = H - 30;
      const pxSpeed = 60;

      const b1 = ball1Ref.current;
      const b2 = ball2Ref.current;
      const { mass1: m1, mass2: m2, elasticity: e } = paramsRef.current;

      const steps = 4;
      const dt = frameDt / steps;
      for (let s = 0; s < steps; s++) {
        b1.x += b1.vx * pxSpeed * dt;
        b2.x += b2.vx * pxSpeed * dt;

        if (b1.x - b1.r < 4) { b1.x = b1.r + 4; b1.vx = Math.abs(b1.vx) * 0.85; }
        if (b1.x + b1.r > W - 4) { b1.x = W - 4 - b1.r; b1.vx = -Math.abs(b1.vx) * 0.85; }
        if (b2.x - b2.r < 4) { b2.x = b2.r + 4; b2.vx = Math.abs(b2.vx) * 0.85; }
        if (b2.x + b2.r > W - 4) { b2.x = W - 4 - b2.r; b2.vx = -Math.abs(b2.vx) * 0.85; }

        const dx = b2.x - b1.x;
        const dist = Math.abs(dx);
        if (dist < b1.r + b2.r && !hasCollidedRef.current) {
          const overlap = (b1.r + b2.r - dist) / 2;
          b1.x -= overlap * Math.sign(dx);
          b2.x += overlap * Math.sign(dx);
          const v1f = ((m1 - e * m2) * b1.vx + (1 + e) * m2 * b2.vx) / (m1 + m2);
          const v2f = ((m2 - e * m1) * b2.vx + (1 + e) * m1 * b1.vx) / (m1 + m2);
          b1.vx = v1f;
          b2.vx = v2f;
          hasCollidedRef.current = true;
          collisionFlashRef.current = 20;
          setHasCollided(true);
          setDisplayVel1(v1f);
          setDisplayVel2(v2f);
        }
        if (hasCollidedRef.current && dist > b1.r + b2.r + 5) {
          hasCollidedRef.current = false;
        }
      }

      b1.y = groundY - b1.r;
      b2.y = groundY - b2.r;

      b1.trail.push({ x: b1.x, y: b1.y });
      if (b1.trail.length > 30) b1.trail.shift();
      b2.trail.push({ x: b2.x, y: b2.y });
      if (b2.trail.length > 30) b2.trail.shift();

      if (collisionFlashRef.current > 0) {
        collisionFlashRef.current--;
        setCollisionFlash(collisionFlashRef.current);
      }

      renderCanvas(b1, b2);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      isActiveRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, isPaused, renderCanvas]);

  const handleStart = () => {
    const [b1, b2] = initBalls();
    ball1Ref.current = b1;
    ball2Ref.current = b2;
    hasCollidedRef.current = false;
    collisionFlashRef.current = 0;
    setHasCollided(false);
    setDisplayVel1(vel1Init);
    setDisplayVel2(vel2Init);
    setIsPaused(false);
    setIsRunning(true);
  };

  const handlePause = () => setIsPaused(p => !p);

  const handleReset = () => {
    isActiveRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setIsPaused(false);
    const [b1, b2] = initBalls();
    ball1Ref.current = b1;
    ball2Ref.current = b2;
    hasCollidedRef.current = false;
    collisionFlashRef.current = 0;
    setHasCollided(false);
    setDisplayVel1(vel1Init);
    setDisplayVel2(vel2Init);
    renderCanvas(b1, b2);
  };

  const initMom = mass1 * vel1Init + mass2 * vel2Init;
  const initKE = 0.5 * mass1 * vel1Init ** 2 + 0.5 * mass2 * vel2Init ** 2;
  const currMom = mass1 * displayVel1 + mass2 * displayVel2;
  const currKE = 0.5 * mass1 * displayVel1 ** 2 + 0.5 * mass2 * displayVel2 ** 2;
  const keLoss = initKE - currKE;

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold mb-2 dark:text-white flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
        Collision Simulator
      </h2>

      <div className="flex-1 grid md:grid-cols-3 gap-3 overflow-hidden min-h-0">
        <div className="space-y-2 overflow-y-auto pr-1">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1.5">Ball 1 (Blue)</h3>
            {[
              { label: 'Mass', value: mass1, min: 1, max: 15, step: 0.5, set: setMass1, unit: 'kg' },
              { label: 'Velocity', value: vel1Init, min: -12, max: 12, step: 0.5, set: setVel1Init, unit: 'm/s' },
            ].map(({ label, value, min, max, step, set, unit }) => (
              <div key={label} className="mb-1">
                <label className="flex justify-between text-[10px] font-medium dark:text-gray-300 mb-0.5">
                  <span>{label}</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">{value.toFixed(1)} {unit}</span>
                </label>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-blue-500 h-1.5" disabled={isRunning && !isPaused} />
              </div>
            ))}
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-200 dark:border-red-800">
            <h3 className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1.5">Ball 2 (Red)</h3>
            {[
              { label: 'Mass', value: mass2, min: 1, max: 15, step: 0.5, set: setMass2, unit: 'kg' },
              { label: 'Velocity', value: vel2Init, min: -12, max: 12, step: 0.5, set: setVel2Init, unit: 'm/s' },
            ].map(({ label, value, min, max, step, set, unit }) => (
              <div key={label} className="mb-1">
                <label className="flex justify-between text-[10px] font-medium dark:text-gray-300 mb-0.5">
                  <span>{label}</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{value.toFixed(1)} {unit}</span>
                </label>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full accent-red-500 h-1.5" disabled={isRunning && !isPaused} />
              </div>
            ))}
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
            <h3 className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Collision Type</h3>
            <label className="flex justify-between text-[10px] font-medium dark:text-gray-300 mb-0.5">
              <span>Elasticity (e)</span>
              <span className="font-mono text-green-600 dark:text-green-400">{elasticity.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={1} step={0.05} value={elasticity}
              onChange={e => setElasticity(Number(e.target.value))}
              className="w-full accent-green-500 h-1.5" disabled={isRunning && !isPaused} />
            <p className="text-[9px] text-center mt-1 dark:text-gray-400 font-medium">
              {elasticity >= 0.99 ? 'Perfectly Elastic' : elasticity <= 0.01 ? 'Perfectly Inelastic' : `Partially Elastic (${(elasticity * 100).toFixed(0)}%)`}
            </p>
          </div>

          {/* Speed control */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <label className="text-xs font-medium dark:text-gray-300 block mb-1.5">Speed</label>
            <div className="flex gap-1">
              {[0.25, 0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${speed === s ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {!isRunning ? (
              <button onClick={handleStart}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium py-1.5 rounded-lg transition-colors text-xs">
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

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
            <h3 className="text-xs font-semibold dark:text-white mb-1.5 flex items-center gap-1.5">
              Conservation Laws
              {hasCollided && <span className="text-[9px] bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-1.5 py-0.5 rounded-full">Collision!</span>}
            </h3>
            <div className="space-y-1 text-[10px] dark:text-gray-300">
              <div>
                <div className="flex justify-between font-medium">
                  <span>Momentum</span>
                  <span className={Math.abs(currMom - initMom) < 0.01 ? 'text-green-600 dark:text-green-400' : ''}>
                    {Math.abs(currMom - initMom) < 0.01 ? '✓ Conserved' : `Δ=${(currMom - initMom).toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] dark:text-gray-400 mt-0.5">
                  <span>Initial: {initMom.toFixed(2)} kg·m/s</span>
                  <span>Current: {currMom.toFixed(2)} kg·m/s</span>
                </div>
              </div>
              <div className="pt-1 border-t border-purple-200 dark:border-purple-700">
                <div className="flex justify-between font-medium">
                  <span>Kinetic Energy</span>
                  <span>{keLoss.toFixed(2)} J lost</span>
                </div>
                <div className="flex justify-between text-[9px] dark:text-gray-400 mt-0.5">
                  <span>Initial: {initKE.toFixed(2)} J</span>
                  <span>Current: {currKE.toFixed(2)} J</span>
                </div>
                {initKE > 0 && (
                  <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (currKE / initKE) * 100).toFixed(1)}%` }} />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[9px] dark:text-gray-400 pt-0.5">
                <span>v₁ after: {displayVel1.toFixed(2)} m/s</span>
                <span>v₂ after: {displayVel2.toFixed(2)} m/s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col overflow-hidden min-h-0">
          <canvas ref={canvasRef}
            className="flex-1 w-full border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
            style={{ minHeight: 0 }} />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] dark:text-gray-400 px-1">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>Ball 1</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Ball 2</span>
            <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-green-500 inline-block"></span>Velocity vector</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border-2 border-yellow-400 inline-block"></span>Impact flash</span>
            <span className="text-[9px] dark:text-gray-500">Balls bounce off walls</span>
          </div>
        </div>
      </div>
    </div>
  );
};
