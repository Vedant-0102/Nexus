import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PieChart, Info } from 'lucide-react';

type DistributionType = 'normal' | 'binomial' | 'poisson';

// --- Math helpers ---

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function binomialCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < Math.min(k, n - k); i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

function normalPDF(x: number, mean: number, stdDev: number): number {
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
}

function binomialPMF(k: number, n: number, p: number): number {
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function poissonPMF(k: number, lambda: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// --- Axis drawing helper ---

function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number },
  xTicks: { value: number; label: string }[],
  yTicks: { value: number; label: string }[],
  xRange: [number, number],
  yRange: [number, number],
  isDark: boolean,
) {
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const axisColor = isDark ? '#6b7280' : '#9ca3af';
  const gridColor = isDark ? '#1f2937' : '#e5e7eb';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  // Grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  for (const tick of yTicks) {
    const frac = (tick.value - yRange[0]) / (yRange[1] - yRange[0]);
    const y = padding.top + plotH - frac * plotH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
  }
  for (const tick of xTicks) {
    const frac = (tick.value - xRange[0]) / (xRange[1] - xRange[0]);
    const x = padding.left + frac * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotH);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Axes
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotH);
  ctx.lineTo(padding.left + plotW, padding.top + plotH);
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotH);
  ctx.stroke();

  // Tick labels
  ctx.fillStyle = labelColor;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const tick of xTicks) {
    const frac = (tick.value - xRange[0]) / (xRange[1] - xRange[0]);
    const x = padding.left + frac * plotW;
    ctx.fillText(tick.label, x, padding.top + plotH + 6);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const tick of yTicks) {
    const frac = (tick.value - yRange[0]) / (yRange[1] - yRange[0]);
    const y = padding.top + plotH - frac * plotH;
    ctx.fillText(tick.label, padding.left - 6, y);
  }
}

// --- The component ---

export const ProbabilityDistributions: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [distribution, setDistribution] = useState<DistributionType>('normal');
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [n, setN] = useState(10);
  const [p, setP] = useState(0.5);
  const [lambda, setLambda] = useState(3);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; label: string } | null>(null);

  const padding = { top: 30, right: 30, bottom: 40, left: 55 };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const isDark = document.documentElement.classList.contains('dark');

    // Background
    ctx.fillStyle = isDark ? '#111827' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (distribution === 'normal') {
      const xMin = mean - 4 * stdDev;
      const xMax = mean + 4 * stdDev;

      let maxY = 0;
      const points: { xVal: number; yVal: number }[] = [];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const xVal = xMin + (i / steps) * (xMax - xMin);
        const yVal = normalPDF(xVal, mean, stdDev);
        maxY = Math.max(maxY, yVal);
        points.push({ xVal, yVal });
      }
      const yAxisMax = maxY * 1.15;

      // Generate ticks
      const xTicks: { value: number; label: string }[] = [];
      const xStep = stdDev >= 1 ? 1 : 0.5;
      for (let v = Math.ceil(xMin / xStep) * xStep; v <= xMax; v += xStep) {
        xTicks.push({ value: (v - xMin) / (xMax - xMin), label: v.toFixed(v % 1 === 0 ? 0 : 1) });
      }
      const yTicks: { value: number; label: string }[] = [];
      const yStep = yAxisMax > 1 ? 0.2 : yAxisMax > 0.5 ? 0.1 : 0.05;
      for (let v = yStep; v < yAxisMax; v += yStep) {
        yTicks.push({ value: v / yAxisMax, label: v.toFixed(2) });
      }

      drawAxes(ctx, width, height, padding,
        xTicks.map(t => ({ ...t, value: t.value * (xMax - xMin) + xMin })),
        yTicks.map(t => ({ ...t, value: t.value * yAxisMax })),
        [xMin, xMax], [0, yAxisMax], isDark,
      );

      // Shade sigma regions
      const sigmaColors = [
        { from: mean - stdDev, to: mean + stdDev, color: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.12)', label: '68.27%' },
        { from: mean - 2 * stdDev, to: mean + 2 * stdDev, color: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.06)', label: '95.45%' },
      ];
      for (const region of sigmaColors.reverse()) {
        ctx.fillStyle = region.color;
        ctx.beginPath();
        const fromFrac = Math.max(0, (region.from - xMin) / (xMax - xMin));
        const toFrac = Math.min(1, (region.to - xMin) / (xMax - xMin));
        ctx.moveTo(padding.left + fromFrac * plotW, padding.top + plotH);
        for (let i = Math.floor(fromFrac * steps); i <= Math.ceil(toFrac * steps) && i <= steps; i++) {
          const pt = points[i];
          if (!pt) continue;
          const px = padding.left + ((pt.xVal - xMin) / (xMax - xMin)) * plotW;
          const py = padding.top + plotH - (pt.yVal / yAxisMax) * plotH;
          ctx.lineTo(px, py);
        }
        ctx.lineTo(padding.left + toFrac * plotW, padding.top + plotH);
        ctx.closePath();
        ctx.fill();
      }

      // Draw curve
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotH);
      gradient.addColorStop(0, isDark ? '#60a5fa' : '#2563eb');
      gradient.addColorStop(1, isDark ? '#3b82f6' : '#3b82f6');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        const px = padding.left + ((pt.xVal - xMin) / (xMax - xMin)) * plotW;
        const py = padding.top + plotH - (pt.yVal / yAxisMax) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Mean line
      const meanPx = padding.left + ((mean - xMin) / (xMax - xMin)) * plotW;
      ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(meanPx, padding.top);
      ctx.lineTo(meanPx, padding.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#f87171' : '#ef4444';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('μ', meanPx, padding.top - 8);

    } else if (distribution === 'binomial') {
      let maxY = 0;
      const values: number[] = [];
      for (let k = 0; k <= n; k++) {
        const v = binomialPMF(k, n, p);
        values.push(v);
        maxY = Math.max(maxY, v);
      }
      const yAxisMax = maxY * 1.15;

      const xTicks = [];
      const step = n <= 10 ? 1 : n <= 20 ? 2 : 5;
      for (let k = 0; k <= n; k += step) {
        xTicks.push({ value: k, label: k.toString() });
      }
      const yTicks: { value: number; label: string }[] = [];
      const yStep = yAxisMax > 0.5 ? 0.1 : yAxisMax > 0.2 ? 0.05 : 0.02;
      for (let v = yStep; v < yAxisMax; v += yStep) {
        yTicks.push({ value: v, label: v.toFixed(2) });
      }

      drawAxes(ctx, width, height, padding, xTicks, yTicks, [0, n], [0, yAxisMax], isDark);

      // Bars
      const barW = Math.max(2, (plotW / (n + 1)) * 0.7);
      for (let k = 0; k <= n; k++) {
        const v = values[k];
        const cx = padding.left + (k / n) * plotW;
        const barH = (v / yAxisMax) * plotH;

        const grad = ctx.createLinearGradient(cx - barW / 2, padding.top + plotH - barH, cx + barW / 2, padding.top + plotH);
        grad.addColorStop(0, isDark ? '#34d399' : '#059669');
        grad.addColorStop(1, isDark ? '#10b981' : '#10b981');
        ctx.fillStyle = grad;

        const barX = cx - barW / 2;
        const barY = padding.top + plotH - barH;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, [3, 3, 0, 0]);
        ctx.fill();
      }

      // Mean marker
      const meanVal = n * p;
      const meanPx = padding.left + (meanVal / n) * plotW;
      ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(meanPx, padding.top);
      ctx.lineTo(meanPx, padding.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#f87171' : '#ef4444';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`μ=${meanVal.toFixed(1)}`, meanPx, padding.top - 8);

    } else if (distribution === 'poisson') {
      const maxK = Math.max(10, Math.ceil(lambda * 3));
      let maxY = 0;
      const values: number[] = [];
      for (let k = 0; k <= maxK; k++) {
        const v = poissonPMF(k, lambda);
        values.push(v);
        maxY = Math.max(maxY, v);
      }
      const yAxisMax = maxY * 1.15;

      const xTicks = [];
      const step = maxK <= 10 ? 1 : maxK <= 20 ? 2 : 5;
      for (let k = 0; k <= maxK; k += step) {
        xTicks.push({ value: k, label: k.toString() });
      }
      const yTicks: { value: number; label: string }[] = [];
      const yStep = yAxisMax > 0.5 ? 0.1 : yAxisMax > 0.2 ? 0.05 : 0.02;
      for (let v = yStep; v < yAxisMax; v += yStep) {
        yTicks.push({ value: v, label: v.toFixed(2) });
      }

      drawAxes(ctx, width, height, padding, xTicks, yTicks, [0, maxK], [0, yAxisMax], isDark);

      // Bars
      const barW = Math.max(2, (plotW / (maxK + 1)) * 0.7);
      for (let k = 0; k <= maxK; k++) {
        const v = values[k];
        const cx = padding.left + (k / maxK) * plotW;
        const barH = (v / yAxisMax) * plotH;

        const grad = ctx.createLinearGradient(cx - barW / 2, padding.top + plotH - barH, cx + barW / 2, padding.top + plotH);
        grad.addColorStop(0, isDark ? '#fbbf24' : '#d97706');
        grad.addColorStop(1, isDark ? '#f59e0b' : '#f59e0b');
        ctx.fillStyle = grad;

        const barX = cx - barW / 2;
        const barY = padding.top + plotH - barH;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, [3, 3, 0, 0]);
        ctx.fill();
      }

      // Mean marker
      const meanPx = padding.left + (lambda / maxK) * plotW;
      ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(meanPx, padding.top);
      ctx.lineTo(meanPx, padding.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#f87171' : '#ef4444';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`λ=${lambda}`, meanPx, padding.top - 8);
    }

    // Title
    ctx.fillStyle = isDark ? '#e5e7eb' : '#374151';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    const titles: Record<DistributionType, string> = {
      normal: `Normal Distribution  N(${mean}, ${stdDev.toFixed(1)}²)`,
      binomial: `Binomial Distribution  B(${n}, ${p.toFixed(2)})`,
      poisson: `Poisson Distribution  Pois(${lambda})`,
    };
    ctx.fillText(titles[distribution], padding.left, 18);

    // Axis labels
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(distribution === 'normal' ? 'x' : 'k', padding.left + plotW / 2, height - 4);
    ctx.save();
    ctx.translate(12, padding.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(distribution === 'normal' ? 'f(x)' : 'P(X = k)', 0, 0);
    ctx.restore();
  }, [distribution, mean, stdDev, n, p, lambda]);

  useEffect(() => {
    draw();
    const obs = new ResizeObserver(() => draw());
    const canvas = canvasRef.current;
    if (canvas) obs.observe(canvas);
    return () => obs.disconnect();
  }, [draw]);

  // Hover handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const plotW = rect.width - padding.left - padding.right;
    const plotH = rect.height - padding.top - padding.bottom;

    if (mx < padding.left || mx > padding.left + plotW || my < padding.top || my > padding.top + plotH) {
      setHoverInfo(null);
      return;
    }

    const frac = (mx - padding.left) / plotW;

    if (distribution === 'normal') {
      const xMin = mean - 4 * stdDev;
      const xMax = mean + 4 * stdDev;
      const xVal = xMin + frac * (xMax - xMin);
      const yVal = normalPDF(xVal, mean, stdDev);
      setHoverInfo({ x: mx, y: my, label: `x = ${xVal.toFixed(2)}, f(x) = ${yVal.toFixed(4)}` });
    } else if (distribution === 'binomial') {
      const k = Math.round(frac * n);
      if (k >= 0 && k <= n) {
        const yVal = binomialPMF(k, n, p);
        setHoverInfo({ x: mx, y: my, label: `k = ${k}, P(X=${k}) = ${yVal.toFixed(4)}` });
      }
    } else if (distribution === 'poisson') {
      const maxK = Math.max(10, Math.ceil(lambda * 3));
      const k = Math.round(frac * maxK);
      if (k >= 0 && k <= maxK) {
        const yVal = poissonPMF(k, lambda);
        setHoverInfo({ x: mx, y: my, label: `k = ${k}, P(X=${k}) = ${yVal.toFixed(4)}` });
      }
    }
  }, [distribution, mean, stdDev, n, p, lambda]);

  const stats = (() => {
    if (distribution === 'normal') {
      return [
        { label: 'Mean (μ)', value: mean.toFixed(2) },
        { label: 'Std Dev (σ)', value: stdDev.toFixed(2) },
        { label: 'Variance (σ²)', value: (stdDev * stdDev).toFixed(2) },
        { label: 'P(μ-σ < X < μ+σ)', value: '68.27%' },
        { label: 'P(μ-2σ < X < μ+2σ)', value: '95.45%' },
      ];
    } else if (distribution === 'binomial') {
      return [
        { label: 'Mean (np)', value: (n * p).toFixed(2) },
        { label: 'Variance (np(1-p))', value: (n * p * (1 - p)).toFixed(2) },
        { label: 'Std Dev', value: Math.sqrt(n * p * (1 - p)).toFixed(2) },
        { label: 'Mode', value: Math.floor((n + 1) * p).toString() },
      ];
    } else {
      return [
        { label: 'Mean (λ)', value: lambda.toFixed(2) },
        { label: 'Variance (λ)', value: lambda.toFixed(2) },
        { label: 'Std Dev', value: Math.sqrt(lambda).toFixed(2) },
        { label: 'Mode', value: Math.floor(lambda).toString() },
      ];
    }
  })();

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <PieChart className="h-5 w-5 text-pink-600" />
          Probability Distributions
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Interactive statistical distribution visualizer
        </p>
      </div>

      <div className="flex-1 flex gap-4 px-5 pb-4 min-h-0 overflow-hidden">
        {/* Chart */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg relative overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverInfo(null)}
            />
            {hoverInfo && (
              <div
                className="absolute pointer-events-none bg-gray-900/90 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap"
                style={{ left: Math.min(hoverInfo.x + 12, (canvasRef.current?.getBoundingClientRect().width ?? 300) - 180), top: hoverInfo.y - 32 }}
              >
                {hoverInfo.label}
              </div>
            )}
          </div>

          {/* Statistics bar */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {stats.map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 shadow-sm">
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="w-72 flex flex-col gap-3 overflow-auto flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <h3 className="font-semibold text-sm mb-2 text-gray-700 dark:text-gray-300">Distribution Type</h3>
            <div className="grid grid-cols-3 gap-1">
              {(['normal', 'binomial', 'poisson'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDistribution(d)}
                  className={`px-2 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${
                    distribution === d
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {distribution === 'normal' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Mean (μ)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{mean.toFixed(1)}</span>
                </div>
                <input type="range" min="-5" max="5" step="0.1" value={mean}
                  onChange={e => setMean(Number(e.target.value))} className="w-full accent-pink-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Std Dev (σ)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{stdDev.toFixed(1)}</span>
                </div>
                <input type="range" min="0.1" max="3" step="0.1" value={stdDev}
                  onChange={e => setStdDev(Number(e.target.value))} className="w-full accent-pink-600" />
              </div>
            </div>
          )}

          {distribution === 'binomial' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Trials (n)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{n}</span>
                </div>
                <input type="range" min="1" max="30" value={n}
                  onChange={e => setN(Number(e.target.value))} className="w-full accent-green-600" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Probability (p)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{p.toFixed(2)}</span>
                </div>
                <input type="range" min="0.01" max="0.99" step="0.01" value={p}
                  onChange={e => setP(Number(e.target.value))} className="w-full accent-green-600" />
              </div>
            </div>
          )}

          {distribution === 'poisson' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Lambda (λ)</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{lambda.toFixed(1)}</span>
                </div>
                <input type="range" min="0.5" max="15" step="0.5" value={lambda}
                  onChange={e => setLambda(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
            </div>
          )}

          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800/30">
            <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-pink-800 dark:text-pink-300">
              <Info className="h-3.5 w-3.5" />
              About this distribution
            </h3>
            <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              {distribution === 'normal' && (
                <>
                  <li>Bell-shaped continuous distribution</li>
                  <li>68.27% within 1σ, 95.45% within 2σ</li>
                  <li>Mean = Median = Mode</li>
                  <li>Defined by μ (location) and σ (spread)</li>
                </>
              )}
              {distribution === 'binomial' && (
                <>
                  <li>Discrete: n independent trials, 2 outcomes</li>
                  <li>Mean = np, Variance = np(1-p)</li>
                  <li>Models coin flips, yes/no surveys</li>
                  <li>Approaches normal for large n</li>
                </>
              )}
              {distribution === 'poisson' && (
                <>
                  <li>Models # of events in fixed interval</li>
                  <li>Mean = Variance = λ</li>
                  <li>Examples: calls/hour, arrivals/minute</li>
                  <li>Approaches normal for large λ</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
