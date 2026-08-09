import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, Info, Play } from 'lucide-react';

type Mode = 'derivative' | 'integral';
type RiemannMethod = 'left' | 'right' | 'midpoint' | 'trapezoid';

const X_RANGE = 5; // plot covers x ∈ [-5, 5]

const presets = [
  { name: 'x²', func: 'x*x' },
  { name: 'sin(x)', func: 'sin(x)' },
  { name: 'x³ − 3x', func: 'x*x*x - 3*x' },
  { name: 'e^(x/2)', func: 'exp(x/2)' },
];

const methodLabels: Record<RiemannMethod, string> = {
  left: 'Left', right: 'Right', midpoint: 'Midpoint', trapezoid: 'Trapezoid',
};

export const CalculusVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const draggingRef = useRef(false);
  const [mode, setMode] = useState<Mode>('derivative');
  const [func, setFunc] = useState('x*x');
  const [xPoint, setXPoint] = useState(1.5);
  const [hStep, setHStep] = useState(2);
  const [animatingH, setAnimatingH] = useState(false);
  const [showDerivCurve, setShowDerivCurve] = useState(true);
  const [intA, setIntA] = useState(-2);
  const [intB, setIntB] = useState(3);
  const [numRects, setNumRects] = useState(8);
  const [method, setMethod] = useState<RiemannMethod>('left');

  const evaluateFunction = (x: number): number => {
    try {
      const f = new Function('x', `
        const sin = Math.sin, cos = Math.cos, tan = Math.tan;
        const sqrt = Math.sqrt, exp = Math.exp, pow = Math.pow;
        const abs = Math.abs, log = Math.log, PI = Math.PI;
        return ${func};
      `);
      const y = f(x);
      return Number.isFinite(y) ? y : 0;
    } catch {
      return x * x;
    }
  };

  const derivative = (x: number): number => {
    const h = 1e-4;
    return (evaluateFunction(x + h) - evaluateFunction(x - h)) / (2 * h);
  };

  // High-resolution Simpson's rule as the "exact" reference value
  const exactIntegral = (a: number, b: number): number => {
    const n = 2000;
    const dx = (b - a) / n;
    let sum = evaluateFunction(a) + evaluateFunction(b);
    for (let i = 1; i < n; i++) sum += evaluateFunction(a + i * dx) * (i % 2 === 0 ? 2 : 4);
    return (sum * dx) / 3;
  };

  const riemannSum = (a: number, b: number, n: number, m: RiemannMethod): number => {
    const dx = (b - a) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const x = a + i * dx;
      if (m === 'left') sum += evaluateFunction(x) * dx;
      else if (m === 'right') sum += evaluateFunction(x + dx) * dx;
      else if (m === 'midpoint') sum += evaluateFunction(x + dx / 2) * dx;
      else sum += ((evaluateFunction(x) + evaluateFunction(x + dx)) / 2) * dx;
    }
    return sum;
  };

  // Animate h shrinking toward 0 to show secant → tangent
  useEffect(() => {
    if (!animatingH) return;
    let raf: number;
    const tick = () => {
      setHStep(prev => {
        const next = prev * 0.955;
        if (next <= 0.012) { setAnimatingH(false); return 0.01; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatingH]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const xFromPx = (px: number, w: number) => ((px / w) * 2 - 1) * X_RANGE;

    const onDown = (e: MouseEvent) => {
      if (mode !== 'derivative') return;
      draggingRef.current = true;
      const r = canvas.getBoundingClientRect();
      setXPoint(Math.max(-X_RANGE + 0.2, Math.min(X_RANGE - 0.2, xFromPx(e.clientX - r.left, r.width))));
    };
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || mode !== 'derivative') return;
      const r = canvas.getBoundingClientRect();
      setXPoint(Math.max(-X_RANGE + 0.2, Math.min(X_RANGE - 0.2, xFromPx(e.clientX - r.left, r.width))));
    };
    const onUp = () => { draggingRef.current = false; };
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.scale(dpr, dpr);
      const w = r.width, h = r.height;

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#0a0e1a' : '#f8f9fc';
      ctx.fillRect(0, 0, w, h);

      // Auto-fit the y scale to the function over the visible range
      let yMin = Infinity, yMax = -Infinity;
      for (let x = -X_RANGE; x <= X_RANGE; x += 0.05) {
        const y = evaluateFunction(x);
        yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
      }
      yMin = Math.max(yMin, -12); yMax = Math.min(yMax, 12);
      if (yMax - yMin < 2) { yMax += 1; yMin -= 1; }
      const pad = (yMax - yMin) * 0.15;
      yMin -= pad; yMax += pad;
      if (yMin > 0) yMin = -pad; // keep the x axis in view
      if (yMax < 0) yMax = pad;

      const xToPx = (x: number) => ((x + X_RANGE) / (2 * X_RANGE)) * w;
      const yToPx = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h;
      const axisY = yToPx(0), axisX = xToPx(0);

      // Grid
      ctx.strokeStyle = isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.10)';
      ctx.lineWidth = 1;
      for (let gx = Math.ceil(-X_RANGE); gx <= X_RANGE; gx++) {
        ctx.beginPath(); ctx.moveTo(xToPx(gx), 0); ctx.lineTo(xToPx(gx), h); ctx.stroke();
      }
      const yStep = Math.max(1, Math.round((yMax - yMin) / 10));
      for (let gy = Math.ceil(yMin); gy <= yMax; gy += yStep) {
        ctx.beginPath(); ctx.moveTo(0, yToPx(gy)); ctx.lineTo(w, yToPx(gy)); ctx.stroke();
      }

      // Axes with numeric labels
      ctx.strokeStyle = isDark ? 'rgba(150,150,200,0.5)' : 'rgba(80,90,130,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, axisY); ctx.lineTo(w, axisY); ctx.moveTo(axisX, 0); ctx.lineTo(axisX, h); ctx.stroke();
      ctx.fillStyle = isDark ? 'rgba(200,200,255,0.4)' : 'rgba(30,40,80,0.4)';
      ctx.font = '9px monospace'; ctx.textAlign = 'center';
      for (let gx = Math.ceil(-X_RANGE); gx <= X_RANGE; gx++) {
        if (gx !== 0) ctx.fillText(`${gx}`, xToPx(gx), Math.min(h - 4, axisY + 12));
      }

      if (mode === 'integral') {
        // Riemann shapes under the curve
        const dx = (intB - intA) / numRects;
        for (let i = 0; i < numRects; i++) {
          const x = intA + i * dx;
          if (method === 'trapezoid') {
            const y0 = evaluateFunction(x), y1 = evaluateFunction(x + dx);
            ctx.fillStyle = (y0 + y1) / 2 >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)';
            ctx.strokeStyle = (y0 + y1) / 2 >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)';
            ctx.beginPath();
            ctx.moveTo(xToPx(x), axisY);
            ctx.lineTo(xToPx(x), yToPx(y0));
            ctx.lineTo(xToPx(x + dx), yToPx(y1));
            ctx.lineTo(xToPx(x + dx), axisY);
            ctx.closePath(); ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
          } else {
            const sampleX = method === 'left' ? x : method === 'right' ? x + dx : x + dx / 2;
            const y = evaluateFunction(sampleX);
            ctx.fillStyle = y >= 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)';
            ctx.strokeStyle = y >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(248,113,113,0.7)';
            const px = xToPx(x), pw = xToPx(x + dx) - px;
            ctx.fillRect(px, axisY, pw, yToPx(y) - axisY);
            ctx.lineWidth = 1;
            ctx.strokeRect(px, axisY, pw, yToPx(y) - axisY);
            // Dot showing where the height sample was taken
            ctx.fillStyle = y >= 0 ? 'rgba(52,211,153,0.9)' : 'rgba(248,113,113,0.9)';
            ctx.beginPath(); ctx.arc(xToPx(sampleX), yToPx(y), 2, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Bounds markers
        ctx.strokeStyle = 'rgba(251,191,36,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        [intA, intB].forEach(bx => { ctx.beginPath(); ctx.moveTo(xToPx(bx), 0); ctx.lineTo(xToPx(bx), h); ctx.stroke(); });
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(251,191,36,0.9)'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`a = ${intA.toFixed(1)}`, xToPx(intA), 14);
        ctx.fillText(`b = ${intB.toFixed(1)}`, xToPx(intB), 14);
      }

      // The function itself
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= w; px += 1) {
        const y = evaluateFunction(xFromPx(px, w));
        const py = yToPx(y);
        if (py < -h || py > 2 * h) { started = false; continue; }
        started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        started = true;
      }
      ctx.stroke();

      if (mode === 'derivative') {
        // Full derivative curve, dashed — connects "slope here" to "height there"
        if (showDerivCurve) {
          ctx.strokeStyle = 'rgba(167,139,250,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
          ctx.beginPath();
          started = false;
          for (let px = 0; px <= w; px += 2) {
            const py = yToPx(derivative(xFromPx(px, w)));
            if (py < -h || py > 2 * h) { started = false; continue; }
            started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            started = true;
          }
          ctx.stroke(); ctx.setLineDash([]);
        }

        const x0 = xPoint, y0 = evaluateFunction(x0);
        const x1 = x0 + hStep, y1 = evaluateFunction(x1);
        const secSlope = (y1 - y0) / hStep;
        const tanSlope = derivative(x0);

        const drawLine = (slope: number, color: string, width: number, dash: number[]) => {
          ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
          ctx.beginPath();
          ctx.moveTo(xToPx(x0 - 2 * X_RANGE), yToPx(y0 - slope * 2 * X_RANGE));
          ctx.lineTo(xToPx(x0 + 2 * X_RANGE), yToPx(y0 + slope * 2 * X_RANGE));
          ctx.stroke(); ctx.setLineDash([]);
        };

        // Tangent (target) then secant (approximation)
        drawLine(tanSlope, 'rgba(248,113,113,0.5)', 1.5, [2, 3]);
        drawLine(secSlope, '#fb923c', 2, []);

        // Rise / run bracket for the secant
        ctx.strokeStyle = 'rgba(251,146,60,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xToPx(x0), yToPx(y0)); ctx.lineTo(xToPx(x1), yToPx(y0)); ctx.lineTo(xToPx(x1), yToPx(y1));
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(251,146,60,0.9)'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
        if (hStep > 0.3) {
          ctx.fillText(`h = ${hStep.toFixed(2)}`, (xToPx(x0) + xToPx(x1)) / 2, yToPx(y0) + (y1 >= y0 ? 12 : -5));
          ctx.fillText(`Δy`, xToPx(x1) + 12, (yToPx(y0) + yToPx(y1)) / 2);
        }

        // The two secant points and the anchor
        ctx.fillStyle = '#fb923c';
        ctx.beginPath(); ctx.arc(xToPx(x1), yToPx(y1), 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f87171';
        ctx.beginPath(); ctx.arc(xToPx(x0), yToPx(y0), 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = isDark ? '#fff' : '#1e293b'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(xToPx(x0), yToPx(y0), 5, 0, Math.PI * 2); ctx.stroke();

        // Matching dot on the derivative curve
        if (showDerivCurve) {
          ctx.fillStyle = '#a78bfa';
          ctx.beginPath(); ctx.arc(xToPx(x0), yToPx(tanSlope), 4, 0, Math.PI * 2); ctx.fill();
        }

        // Readout
        const lines = [
          `secant slope (f(x+h)−f(x))/h = ${secSlope.toFixed(3)}`,
          `tangent slope f'(${x0.toFixed(2)}) = ${tanSlope.toFixed(3)}`,
          `gap = ${Math.abs(secSlope - tanSlope).toFixed(4)} — shrink h to close it`,
        ];
        ctx.fillStyle = isDark ? 'rgba(20,25,50,0.75)' : 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(10, 10, 300, 52, 6); ctx.fill();
        ctx.font = '10px monospace'; ctx.textAlign = 'left';
        ctx.fillStyle = '#fb923c'; ctx.fillText(lines[0], 18, 26);
        ctx.fillStyle = '#f87171'; ctx.fillText(lines[1], 18, 40);
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.fillText(lines[2], 18, 54);
      } else {
        const approx = riemannSum(intA, intB, numRects, method);
        const exact = exactIntegral(intA, intB);
        const lines = [
          `${methodLabels[method]} sum, n=${numRects}: ${approx.toFixed(4)}`,
          `exact ∫f dx = ${exact.toFixed(4)}`,
          `error = ${Math.abs(approx - exact).toFixed(4)} — raise n to shrink it`,
        ];
        ctx.fillStyle = isDark ? 'rgba(20,25,50,0.75)' : 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(10, 10, 290, 52, 6); ctx.fill();
        ctx.font = '10px monospace'; ctx.textAlign = 'left';
        ctx.fillStyle = '#34d399'; ctx.fillText(lines[0], 18, 26);
        ctx.fillStyle = '#60a5fa'; ctx.fillText(lines[1], 18, 40);
        ctx.fillStyle = isDark ? 'rgba(200,200,255,0.6)' : 'rgba(30,40,80,0.6)'; ctx.fillText(lines[2], 18, 54);
      }
    };

    draw();
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => {
      obs.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [mode, func, xPoint, hStep, showDerivCurve, intA, intB, numRects, method]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-100 to-emerald-100 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" /> Calculus Visualizer
        </h2>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          {mode === 'derivative' ? 'Drag the red point on the graph · shrink h and watch the secant become the tangent' : 'The integral is the limit of Riemann sums as n → ∞'}
        </p>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 min-w-0 min-h-0 rounded-lg border border-gray-300 dark:border-gray-800 overflow-hidden">
          <canvas ref={canvasRef} className={`w-full h-full ${mode === 'derivative' ? 'cursor-crosshair' : ''}`} />
        </div>

        <div className="w-[220px] flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
          <div className="flex gap-1">
            {(['derivative', 'integral'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 px-2 py-1.5 rounded text-[10px] font-medium capitalize ${mode === m ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                {m}
              </button>
            ))}
          </div>

          <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Function f(x)</h4>
            <input type="text" value={func} onChange={e => setFunc(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 font-mono text-[11px] text-gray-800 dark:text-gray-200" />
            <div className="grid grid-cols-2 gap-1">
              {presets.map(p => (
                <button key={p.name} onClick={() => setFunc(p.func)} className={`px-1.5 py-1 text-[10px] rounded ${func === p.func ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {mode === 'derivative' ? (
            <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Point x</span><span>{xPoint.toFixed(2)}</span></label>
              <input type="range" min={-X_RANGE + 0.2} max={X_RANGE - 0.2} step={0.05} value={xPoint} onChange={e => setXPoint(+e.target.value)} className="w-full h-1 accent-red-500" />
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Step h</span><span>{hStep.toFixed(3)}</span></label>
              <input type="range" min={0.01} max={3} step={0.01} value={hStep} onChange={e => { setAnimatingH(false); setHStep(+e.target.value); }} className="w-full h-1 accent-orange-500" />
              <button onClick={() => { if (hStep < 0.05) setHStep(3); setAnimatingH(true); }} disabled={animatingH} className="w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-orange-600 disabled:bg-orange-800/50 text-white text-[10px] font-medium">
                <Play className="h-3 w-3" /> Animate h → 0
              </button>
              <label className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 cursor-pointer pt-1">
                <input type="checkbox" checked={showDerivCurve} onChange={e => setShowDerivCurve(e.target.checked)} className="accent-violet-500 w-3 h-3" />
                Show f'(x) curve
              </label>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 space-y-2">
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Lower bound a</span><span>{intA.toFixed(1)}</span></label>
              <input type="range" min={-X_RANGE} max={X_RANGE} step={0.1} value={intA} onChange={e => setIntA(Math.min(+e.target.value, intB - 0.2))} className="w-full h-1 accent-amber-500" />
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Upper bound b</span><span>{intB.toFixed(1)}</span></label>
              <input type="range" min={-X_RANGE} max={X_RANGE} step={0.1} value={intB} onChange={e => setIntB(Math.max(+e.target.value, intA + 0.2))} className="w-full h-1 accent-amber-500" />
              <label className="text-[9px] text-gray-500 dark:text-gray-400 flex justify-between"><span>Subdivisions n</span><span>{numRects}</span></label>
              <input type="range" min={1} max={100} step={1} value={numRects} onChange={e => setNumRects(+e.target.value)} className="w-full h-1 accent-emerald-500" />
              <div className="grid grid-cols-2 gap-1 pt-1">
                {(Object.keys(methodLabels) as RiemannMethod[]).map(m => (
                  <button key={m} onClick={() => setMethod(m)} className={`px-1.5 py-1 text-[10px] rounded ${method === m ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {methodLabels[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mb-1">
              <Info className="h-3 w-3" /> {mode === 'derivative' ? 'The Limit Definition' : 'Riemann Sums'}
            </h4>
            {mode === 'derivative' ? (
              <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-400">
                <p className="font-mono bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-1">f'(x) = lim (f(x+h) − f(x)) / h as h→0</p>
                <p>The orange <strong>secant</strong> connects two points a distance h apart. As h shrinks, its slope approaches the red <strong>tangent</strong> — that limit IS the derivative.</p>
                <p>The purple dashed curve plots that slope at every x: the derivative function f'(x).</p>
              </div>
            ) : (
              <div className="space-y-1 text-[9px] text-gray-600 dark:text-gray-400">
                <p className="font-mono bg-white/60 dark:bg-gray-800/60 rounded px-1.5 py-1">∫ f dx = lim Σ f(xᵢ)·Δx as n→∞</p>
                <p>Each shape approximates a slice of area. Compare methods: midpoint and trapezoid converge much faster than left/right — check the error readout.</p>
                <p>Area below the x-axis counts as <span className="text-red-400">negative</span> (red shapes).</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
