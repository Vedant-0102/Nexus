import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SurfaceType = 'bowl' | 'saddle' | 'local_minima';
type OptimizerName = 'SGD' | 'Momentum' | 'Adam';

interface TrailPoint { x: number; y: number; loss: number; gradMag: number }

interface OptimizerState {
  name: OptimizerName;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mx: number;
  my: number;
  sx: number;
  sy: number;
  t: number;
  trail: TrailPoint[];
  color: string;
  finished: boolean;
}

/* ------------------------------------------------------------------ */
/*  Loss surfaces                                                      */
/* ------------------------------------------------------------------ */

function lossFn(surface: SurfaceType, x: number, y: number): number {
  switch (surface) {
    case 'bowl':
      return 0.5 * (x * x + y * y);
    case 'saddle':
      return x * x - y * y + 0.1 * (x * x + y * y);
    case 'local_minima': {
      const f = 0.5 * (x * x + y * y) + 3 * Math.exp(-((x - 1.5) ** 2 + (y - 1.5) ** 2) / 0.3)
        - 1.5 * Math.exp(-((x + 0.5) ** 2 + (y + 0.5) ** 2) / 0.5);
      return f;
    }
  }
}

function gradient(surface: SurfaceType, x: number, y: number): [number, number] {
  const eps = 1e-5;
  const dfdx = (lossFn(surface, x + eps, y) - lossFn(surface, x - eps, y)) / (2 * eps);
  const dfdy = (lossFn(surface, x, y + eps) - lossFn(surface, x, y - eps)) / (2 * eps);
  return [dfdx, dfdy];
}

/* ------------------------------------------------------------------ */
/*  Optimizer step functions                                           */
/* ------------------------------------------------------------------ */

function stepOptimizer(opt: OptimizerState, surface: SurfaceType, lr: number): OptimizerState {
  const [gx, gy] = gradient(surface, opt.x, opt.y);
  const gradMag = Math.sqrt(gx * gx + gy * gy);
  const state = { ...opt };

  switch (opt.name) {
    case 'SGD': {
      state.x -= lr * gx;
      state.y -= lr * gy;
      break;
    }
    case 'Momentum': {
      const beta = 0.9;
      state.vx = beta * opt.vx + lr * gx;
      state.vy = beta * opt.vy + lr * gy;
      state.x -= state.vx;
      state.y -= state.vy;
      break;
    }
    case 'Adam': {
      const b1 = 0.9, b2 = 0.999, eps = 1e-8;
      state.t = opt.t + 1;
      state.mx = b1 * opt.mx + (1 - b1) * gx;
      state.my = b1 * opt.my + (1 - b1) * gy;
      state.sx = b2 * opt.sx + (1 - b2) * gx * gx;
      state.sy = b2 * opt.sy + (1 - b2) * gy * gy;
      const mxH = state.mx / (1 - Math.pow(b1, state.t));
      const myH = state.my / (1 - Math.pow(b1, state.t));
      const sxH = state.sx / (1 - Math.pow(b2, state.t));
      const syH = state.sy / (1 - Math.pow(b2, state.t));
      state.x -= lr * mxH / (Math.sqrt(sxH) + eps);
      state.y -= lr * myH / (Math.sqrt(syH) + eps);
      break;
    }
  }

  // Clamp
  state.x = Math.max(-3, Math.min(3, state.x));
  state.y = Math.max(-3, Math.min(3, state.y));

  const loss = lossFn(surface, state.x, state.y);
  state.trail = [...opt.trail, { x: state.x, y: state.y, loss, gradMag }];

  if (gradMag < 1e-4 || state.trail.length > 500) state.finished = true;

  return state;
}

/* ------------------------------------------------------------------ */
/*  Canvas drawing                                                     */
/* ------------------------------------------------------------------ */

function drawContourAndTrails(
  canvas: HTMLCanvasElement,
  surface: SurfaceType,
  optimizers: OptimizerState[],
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const range = 3; // [-3, 3]

  // Draw contour
  const resolution = 2;
  const values: number[][] = [];
  let minVal = Infinity, maxVal = -Infinity;

  for (let py = 0; py < H; py += resolution) {
    const row: number[] = [];
    for (let px = 0; px < W; px += resolution) {
      const x = (px / W) * 2 * range - range;
      const y = (py / H) * 2 * range - range;
      const v = lossFn(surface, x, y);
      row.push(v);
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
    values.push(row);
  }

  // Clamp range for coloring
  const clampMax = Math.min(maxVal, minVal + 10);

  for (let ri = 0; ri < values.length; ri++) {
    for (let ci = 0; ci < values[ri].length; ci++) {
      const v = values[ri][ci];
      const t = Math.max(0, Math.min(1, (v - minVal) / (clampMax - minVal)));
      // Dark blue -> cyan -> yellow -> red
      const r = Math.floor(30 + t * 180);
      const g = Math.floor(30 + (1 - Math.abs(t - 0.5) * 2) * 120);
      const b = Math.floor(180 - t * 160);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(ci * resolution, ri * resolution, resolution, resolution);
    }
  }

  // Draw contour lines
  const numContours = 15;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 0.5;
  for (let cl = 0; cl < numContours; cl++) {
    const threshold = minVal + (cl / numContours) * (clampMax - minVal);
    for (let ri = 0; ri < values.length - 1; ri++) {
      for (let ci = 0; ci < values[ri].length - 1; ci++) {
        const v = values[ri][ci];
        const vr = values[ri][ci + 1];
        const vb = values[ri + 1][ci];
        if ((v < threshold && vr >= threshold) || (v >= threshold && vr < threshold)) {
          ctx.beginPath();
          ctx.arc(ci * resolution, ri * resolution, 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        if ((v < threshold && vb >= threshold) || (v >= threshold && vb < threshold)) {
          ctx.beginPath();
          ctx.arc(ci * resolution, ri * resolution, 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  // Convert data-space to pixel-space
  const toPixel = (dx: number, dy: number): [number, number] => {
    return [((dx + range) / (2 * range)) * W, ((dy + range) / (2 * range)) * H];
  };

  // Draw trails and balls
  for (const opt of optimizers) {
    if (opt.trail.length < 2) continue;

    // Trail
    ctx.beginPath();
    const [sx, sy] = toPixel(opt.trail[0].x, opt.trail[0].y);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < opt.trail.length; i++) {
      const [px, py] = toPixel(opt.trail[i].x, opt.trail[i].y);
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current position (ball)
    const last = opt.trail[opt.trail.length - 1];
    const [bx, by] = toPixel(last.x, last.y);
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fillStyle = opt.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(opt.name, bx + 10, by + 4);
  }

  // Axes labels
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('x', W / 2, H - 4);
  ctx.save();
  ctx.translate(10, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('y', 0, 0);
  ctx.restore();
}

function drawLossChart(
  canvas: HTMLCanvasElement,
  optimizers: OptimizerState[],
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = 'rgba(15,23,42,0.6)';
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 8);
  ctx.fill();

  const pad = { l: 35, r: 10, t: 18, b: 20 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

  // Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Loss vs Iteration', pad.l, 12);

  // Find data range
  let maxIter = 1, maxLoss = 1;
  for (const opt of optimizers) {
    if (opt.trail.length > maxIter) maxIter = opt.trail.length;
    for (const p of opt.trail) {
      if (p.loss > maxLoss && p.loss < 50) maxLoss = p.loss;
    }
  }

  // Grid
  ctx.strokeStyle = 'rgba(100,116,139,0.2)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const gy = pad.t + (i / 4) * ph;
    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(pad.l + pw, gy);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '8px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((maxLoss * (1 - i / 4)).toFixed(1), pad.l - 4, gy + 3);
  }

  // X axis label
  ctx.fillStyle = '#64748b';
  ctx.font = '8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Iterations', pad.l + pw / 2, H - 3);

  // Plot lines
  for (const opt of optimizers) {
    if (opt.trail.length < 2) continue;
    ctx.beginPath();
    for (let i = 0; i < opt.trail.length; i++) {
      const px = pad.l + (i / Math.max(maxIter - 1, 1)) * pw;
      const py = pad.t + (1 - Math.min(opt.trail[i].loss, maxLoss) / maxLoss) * ph;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = opt.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ */
/*  Initial optimizer states                                           */
/* ------------------------------------------------------------------ */

const OPTIMIZER_COLORS: Record<OptimizerName, string> = {
  SGD: '#f59e0b',
  Momentum: '#10b981',
  Adam: '#ec4899',
};

function makeOptimizers(start: [number, number]): OptimizerState[] {
  return (['SGD', 'Momentum', 'Adam'] as OptimizerName[]).map(name => ({
    name,
    x: start[0],
    y: start[1],
    vx: 0, vy: 0,
    mx: 0, my: 0,
    sx: 0, sy: 0,
    t: 0,
    trail: [{ x: start[0], y: start[1], loss: 0, gradMag: 0 }],
    color: OPTIMIZER_COLORS[name],
    finished: false,
  }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SURFACE_OPTIONS: { value: SurfaceType; label: string }[] = [
  { value: 'bowl', label: 'Bowl (convex)' },
  { value: 'saddle', label: 'Saddle Point' },
  { value: 'local_minima', label: 'Local Minima' },
];

export const GradientDescentSimulator: React.FC = () => {
  const [surface, setSurface] = useState<SurfaceType>('bowl');
  const [lr, setLr] = useState(0.05);
  const [optimizers, setOptimizers] = useState<OptimizerState[]>(makeOptimizers([2.5, 2.5]));
  const [playing, setPlaying] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [iteration, setIteration] = useState(0);

  const contourRef = useRef<HTMLCanvasElement>(null);
  const lossRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const optimizersRef = useRef(optimizers);
  optimizersRef.current = optimizers;

  /* Reset on surface change */
  const reset = useCallback(() => {
    setOptimizers(makeOptimizers([2.5, 2.5]));
    setIteration(0);
    setPlaying(false);
  }, []);

  useEffect(() => { reset(); }, [surface, reset]);

  /* Rendering */
  const redraw = useCallback(() => {
    if (contourRef.current) drawContourAndTrails(contourRef.current, surface, optimizersRef.current);
    if (lossRef.current) drawLossChart(lossRef.current, optimizersRef.current);
  }, [surface]);

  useEffect(() => { redraw(); }, [optimizers, redraw]);

  /* Resize handler */
  useEffect(() => {
    const handleResize = () => {
      if (contourRef.current) {
        const p = contourRef.current.parentElement;
        if (p) {
          contourRef.current.width = p.clientWidth;
          contourRef.current.height = p.clientHeight;
        }
      }
      if (lossRef.current) {
        const p = lossRef.current.parentElement;
        if (p) {
          lossRef.current.width = p.clientWidth;
          lossRef.current.height = Math.max(100, p.clientHeight);
        }
      }
      redraw();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redraw]);

  /* Step forward */
  const doStep = useCallback(() => {
    setOptimizers(prev => {
      const next = prev.map(o => o.finished ? o : stepOptimizer(o, surface, lr));
      return next;
    });
    setIteration(i => i + 1);
  }, [surface, lr]);

  /* Animation loop */
  useEffect(() => {
    if (!playing) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      doStep();
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [playing, doStep]);

  const allFinished = optimizers.every(o => o.finished);
  const currentLosses = optimizers.map(o => o.trail.length > 0 ? o.trail[o.trail.length - 1] : null);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select value={surface} onChange={e => setSurface(e.target.value as SurfaceType)} className={selectClass}>
          {SURFACE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">LR: {lr.toFixed(3)}</label>
          <input
            type="range" min={0.001} max={1} step={0.001} value={lr}
            onChange={e => setLr(parseFloat(e.target.value))}
            className="w-24 accent-blue-500"
          />
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <button onClick={() => { setStepMode(false); setPlaying(!playing); }}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${!stepMode && playing ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => { setStepMode(true); setPlaying(false); doStep(); }}
            className="px-3 py-1 text-xs rounded-md font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
            Step
          </button>
        </div>

        <button onClick={reset}
          className="px-3 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
          Reset
        </button>

        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Iter: {iteration}</span>
      </div>

      {/* Status cards */}
      <div className="flex gap-2 mb-2">
        {optimizers.map((opt, i) => {
          const last = currentLosses[i];
          return (
            <div key={opt.name} className="flex-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color }} />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{opt.name}</span>
                {opt.finished && <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 rounded-full">done</span>}
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[10px] text-gray-500 dark:text-gray-400">
                <span>Loss: <strong className="text-gray-700 dark:text-gray-200">{last ? last.loss.toFixed(4) : '-'}</strong></span>
                <span>|grad|: <strong className="text-gray-700 dark:text-gray-200">{last ? last.gradMag.toFixed(4) : '-'}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {allFinished && (
        <div className="text-xs text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg py-1 mb-2 font-medium">
          All optimizers have converged or reached max iterations.
        </div>
      )}

      {/* Main canvases */}
      <div className="flex-1 min-h-0 flex gap-2">
        <div className="flex-[2] min-w-0 bg-gray-900 rounded-xl overflow-hidden">
          <canvas ref={contourRef} className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <canvas ref={lossRef} className="w-full h-full" />
          </div>
          {/* Legend */}
          <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
            <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Learning Rate Guide</h4>
            <div className="space-y-0.5 text-[10px] text-gray-600 dark:text-gray-300">
              <p><span className="text-red-400 font-medium">Too high (&gt;0.3):</span> Oscillation, may diverge</p>
              <p><span className="text-yellow-400 font-medium">Good (0.01-0.1):</span> Smooth convergence</p>
              <p><span className="text-blue-400 font-medium">Too low (&lt;0.005):</span> Very slow convergence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
