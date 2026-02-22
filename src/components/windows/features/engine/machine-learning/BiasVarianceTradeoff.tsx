import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface DataPoint {
  x: number;
  y: number;
}

function trueFunction(x: number): number {
  return Math.sin(2 * Math.PI * x) * 0.8;
}

function generateTrainingData(n: number, noise: number, seed?: number): DataPoint[] {
  const points: DataPoint[] = [];
  const rng = seed !== undefined ? seededRandom(seed) : Math.random;
  for (let i = 0; i < n; i++) {
    const x = rng();
    const y = trueFunction(x) + (rng() - 0.5) * 2 * noise;
    points.push({ x, y });
  }
  return points.sort((a, b) => a.x - b.x);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function fitPolynomial(data: DataPoint[], degree: number): number[] {
  const n = data.length;
  const d = degree + 1;
  // Build Vandermonde matrix and solve via normal equations
  const XtX: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  const Xty: number[] = Array(d).fill(0);

  for (const { x, y } of data) {
    const powers: number[] = [];
    let p = 1;
    for (let j = 0; j < d; j++) {
      powers.push(p);
      p *= x;
    }
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        XtX[i][j] += powers[i] * powers[j];
      }
      Xty[i] += powers[i] * y;
    }
  }

  // Add small ridge term for stability
  for (let i = 0; i < d; i++) {
    XtX[i][i] += 1e-8;
  }

  // Gaussian elimination
  const aug: number[][] = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < d; col++) {
    let maxRow = col;
    for (let row = col + 1; row < d; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) continue;
    const pivot = aug[col][col];
    for (let j = col; j <= d; j++) aug[col][j] /= pivot;
    for (let row = 0; row < d; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j <= d; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  return aug.map((row) => row[d]);
}

function evaluatePolynomial(coeffs: number[], x: number): number {
  let result = 0;
  let p = 1;
  for (const c of coeffs) {
    result += c * p;
    p *= x;
  }
  return Math.max(-3, Math.min(3, result));
}

function computeMSE(data: DataPoint[], coeffs: number[]): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (const { x, y } of data) {
    const pred = evaluatePolynomial(coeffs, x);
    sum += (y - pred) ** 2;
  }
  return sum / data.length;
}

export const BiasVarianceTradeoff: React.FC = () => {
  const [complexity, setComplexity] = useState(3);
  const [noise, setNoise] = useState(0.3);
  const [numPoints, setNumPoints] = useState(25);
  const [showMultiple, setShowMultiple] = useState(false);
  const [numSets, setNumSets] = useState(8);

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const errorCanvasRef = useRef<HTMLCanvasElement>(null);

  const baseData = useMemo(() => generateTrainingData(numPoints, noise, 42), [numPoints, noise]);

  const multipleSets = useMemo(() => {
    const sets: DataPoint[][] = [];
    for (let i = 0; i < numSets; i++) {
      sets.push(generateTrainingData(numPoints, noise, 100 + i * 37));
    }
    return sets;
  }, [numPoints, noise, numSets]);

  const currentCoeffs = useMemo(() => fitPolynomial(baseData, complexity), [baseData, complexity]);

  // Compute bias and variance across complexities
  const errorDecomposition = useMemo(() => {
    const results: { degree: number; bias2: number; variance: number; irreducible: number; total: number }[] = [];
    const testPoints = Array.from({ length: 50 }, (_, i) => i / 49);
    const irreducibleError = noise * noise / 3; // approximate

    for (let deg = 1; deg <= 15; deg++) {
      const allCoeffs = multipleSets.map((data) => fitPolynomial(data, deg));
      let totalBias2 = 0;
      let totalVariance = 0;

      for (const tx of testPoints) {
        const trueY = trueFunction(tx);
        const predictions = allCoeffs.map((c) => evaluatePolynomial(c, tx));
        const meanPred = predictions.reduce((s, v) => s + v, 0) / predictions.length;
        const bias2 = (meanPred - trueY) ** 2;
        const variance = predictions.reduce((s, v) => s + (v - meanPred) ** 2, 0) / predictions.length;
        totalBias2 += bias2;
        totalVariance += variance;
      }

      totalBias2 /= testPoints.length;
      totalVariance /= testPoints.length;

      results.push({
        degree: deg,
        bias2: totalBias2,
        variance: totalVariance,
        irreducible: irreducibleError,
        total: totalBias2 + totalVariance + irreducibleError,
      });
    }
    return results;
  }, [multipleSets, noise]);

  const drawMainCanvas = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 25, right: 15, bottom: 35, left: 45 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = pad.left + (i / 10) * pw;
      const y = pad.top + (i / 10) * ph;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    const xToCanvas = (x: number) => pad.left + x * pw;
    const yToCanvas = (y: number) => pad.top + (1 - (y + 1.5) / 3) * ph;

    // True function
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = trueFunction(x);
      const cx = xToCanvas(x);
      const cy = yToCanvas(y);
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Multiple fitted models
    if (showMultiple) {
      const colors = ['#f4364480', '#f9731680', '#fbbf2480', '#a3e63580', '#2dd4bf80', '#38bdf880', '#a78bfa80', '#f472b680'];
      multipleSets.forEach((data, idx) => {
        const coeffs = fitPolynomial(data, complexity);
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const x = i / 200;
          const y = evaluatePolynomial(coeffs, x);
          const cx = xToCanvas(x);
          const cy = yToCanvas(y);
          if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      });
    }

    // Current fitted model
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = evaluatePolynomial(currentCoeffs, x);
      const cx = xToCanvas(x);
      const cy = yToCanvas(y);
      if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Training data points
    for (const { x, y } of baseData) {
      const cx = xToCanvas(x);
      const cy = yToCanvas(y);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i += 2) {
      ctx.fillText((i / 10).toFixed(1), pad.left + (i / 10) * pw, pad.top + ph + 15);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 6; i++) {
      const val = -1.5 + i * 0.5;
      ctx.fillText(val.toFixed(1), pad.left - 5, yToCanvas(val) + 3);
    }
    ctx.textAlign = 'center';
    ctx.fillText('x', pad.left + pw / 2, pad.top + ph + 30);
    ctx.save();
    ctx.translate(12, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y', 0, 0);
    ctx.restore();

    // Legend
    ctx.font = '10px system-ui';
    const legendY = pad.top + 8;
    const legendItems: [string, string, boolean][] = [
      ['True Function', '#6366f1', true],
      ['Fitted Model', '#10b981', false],
      ['Training Data', '#f59e0b', false],
    ];
    let lx = pad.left + 5;
    for (const [label, color, dashed] of legendItems) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([4, 2]);
      else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(lx, legendY); ctx.lineTo(lx + 16, legendY); ctx.stroke();
      ctx.setLineDash([]);
      if (label === 'Training Data') {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(lx + 8, legendY, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#d1d5db';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 20, legendY + 3);
      lx += ctx.measureText(label).width + 30;
    }

    // Title
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`Degree ${complexity} Polynomial Fit`, w - pad.right - 5, pad.top + 8);
  }, [baseData, currentCoeffs, complexity, showMultiple, multipleSets]);

  const drawErrorCanvas = useCallback(() => {
    const canvas = errorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 25, right: 15, bottom: 35, left: 45 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 15; i++) {
      const x = pad.left + (i / 15) * pw;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const y = pad.top + (i / 10) * ph;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
    }

    const maxError = Math.max(...errorDecomposition.map((e) => e.total), 0.5);
    const xToCanvas = (deg: number) => pad.left + ((deg - 1) / 14) * pw;
    const yToCanvas = (val: number) => pad.top + (1 - val / maxError) * ph;

    // Underfitting / Overfitting regions
    const optIdx = errorDecomposition.reduce((best, e, i) => (e.total < errorDecomposition[best].total ? i : best), 0);
    const optDeg = errorDecomposition[optIdx].degree;

    // Underfitting region
    ctx.fillStyle = 'rgba(239, 68, 68, 0.06)';
    ctx.fillRect(pad.left, pad.top, xToCanvas(optDeg) - pad.left, ph);

    // Overfitting region
    ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
    ctx.fillRect(xToCanvas(optDeg), pad.top, pad.left + pw - xToCanvas(optDeg), ph);

    // Optimal line
    ctx.strokeStyle = '#22c55e40';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xToCanvas(optDeg), pad.top);
    ctx.lineTo(xToCanvas(optDeg), pad.top + ph);
    ctx.stroke();
    ctx.setLineDash([]);

    // Region labels
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    if (optDeg > 2) {
      ctx.fillStyle = '#ef444480';
      ctx.fillText('Underfitting', (pad.left + xToCanvas(optDeg)) / 2, pad.top + ph - 8);
    }
    ctx.fillStyle = '#22c55e80';
    ctx.fillText('Optimal', xToCanvas(optDeg), pad.top + ph - 8);
    if (optDeg < 14) {
      ctx.fillStyle = '#f59e0b80';
      ctx.fillText('Overfitting', (xToCanvas(optDeg) + pad.left + pw) / 2, pad.top + ph - 8);
    }

    // Draw curves
    const curves: { key: keyof typeof errorDecomposition[0]; color: string; label: string }[] = [
      { key: 'bias2', color: '#ef4444', label: 'Bias\u00B2' },
      { key: 'variance', color: '#f59e0b', label: 'Variance' },
      { key: 'irreducible', color: '#6b7280', label: 'Irreducible' },
      { key: 'total', color: '#8b5cf6', label: 'Total Error' },
    ];

    for (const { key, color } of curves) {
      ctx.strokeStyle = color;
      ctx.lineWidth = key === 'total' ? 2.5 : 1.8;
      if (key === 'irreducible') ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      errorDecomposition.forEach((e, i) => {
        const x = xToCanvas(e.degree);
        const y = yToCanvas(e[key] as number);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Current complexity marker
    const currentErr = errorDecomposition[complexity - 1];
    if (currentErr) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(xToCanvas(complexity), yToCanvas(currentErr.total), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 15; i += 2) {
      ctx.fillText(String(i), xToCanvas(i), pad.top + ph + 15);
    }
    ctx.fillText('Model Complexity (Polynomial Degree)', pad.left + pw / 2, pad.top + ph + 30);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = (i / 5) * maxError;
      ctx.fillText(val.toFixed(2), pad.left - 5, yToCanvas(val) + 3);
    }

    ctx.save();
    ctx.translate(12, pad.top + ph / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Error', 0, 0);
    ctx.restore();

    // Legend
    let lx = pad.left + 5;
    const ly = pad.top + 8;
    ctx.font = '9px system-ui';
    for (const { label, color } of curves) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 14, ly); ctx.stroke();
      ctx.fillStyle = '#d1d5db';
      ctx.textAlign = 'left';
      ctx.fillText(label, lx + 17, ly + 3);
      lx += ctx.measureText(label).width + 27;
    }

    // Title
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('Bias-Variance Decomposition', w - pad.right - 5, pad.top + 8);
  }, [errorDecomposition, complexity]);

  useEffect(() => { drawMainCanvas(); }, [drawMainCanvas]);
  useEffect(() => { drawErrorCanvas(); }, [drawErrorCanvas]);

  const trainMSE = computeMSE(baseData, currentCoeffs);
  const testData = useMemo(() => generateTrainingData(100, noise, 999), [noise]);
  const testMSE = computeMSE(testData, currentCoeffs);
  const currentDecomp = errorDecomposition[complexity - 1];

  const getRegionLabel = (deg: number) => {
    const optIdx = errorDecomposition.reduce((best, e, i) => (e.total < errorDecomposition[best].total ? i : best), 0);
    const optDeg = errorDecomposition[optIdx].degree;
    if (deg < optDeg - 1) return { text: 'Underfitting', color: 'text-red-400' };
    if (deg > optDeg + 1) return { text: 'Overfitting', color: 'text-amber-400' };
    return { text: 'Near Optimal', color: 'text-green-400' };
  };

  const region = getRegionLabel(complexity);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-violet-50 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-2 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Complexity: <span className="text-indigo-400 font-bold">{complexity}</span>
          </label>
          <input
            type="range" min="1" max="15" step="1" value={complexity}
            onChange={(e) => setComplexity(Number(e.target.value))}
            className="w-32 accent-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Noise: {noise.toFixed(2)}
          </label>
          <input
            type="range" min="0.05" max="0.8" step="0.05" value={noise}
            onChange={(e) => setNoise(Number(e.target.value))}
            className="w-24 accent-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Points:</label>
          <select
            value={numPoints}
            onChange={(e) => setNumPoints(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            {[10, 15, 25, 40, 60].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
          <input
            type="checkbox" checked={showMultiple}
            onChange={(e) => setShowMultiple(e.target.checked)}
            className="accent-violet-500"
          />
          <span className="text-xs text-gray-400">Show {numSets} training sets</span>
        </label>
        {showMultiple && (
          <select
            value={numSets}
            onChange={(e) => setNumSets(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            {[4, 6, 8, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Bias{'\u00B2'}</div>
          <div className="text-sm font-bold text-red-400">{currentDecomp?.bias2.toFixed(4) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Variance</div>
          <div className="text-sm font-bold text-amber-400">{currentDecomp?.variance.toFixed(4) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Irreducible</div>
          <div className="text-sm font-bold text-gray-400">{currentDecomp?.irreducible.toFixed(4) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Total Error</div>
          <div className="text-sm font-bold text-violet-400">{currentDecomp?.total.toFixed(4) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Train MSE</div>
          <div className="text-sm font-bold text-blue-400">{trainMSE.toFixed(4)}</div>
        </div>
        <div className={`rounded-lg border p-1.5 bg-gradient-to-br ${region.text === 'Near Optimal' ? 'from-green-500/10 to-green-600/5 border-green-500/30' : region.text === 'Underfitting' ? 'from-red-500/10 to-red-600/5 border-red-500/30' : 'from-amber-500/10 to-amber-600/5 border-amber-500/30'}`}>
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Region</div>
          <div className={`text-sm font-bold ${region.color}`}>{region.text}</div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 min-h-0 grid grid-rows-2 gap-2">
        <div className="min-h-0">
          <canvas
            ref={mainCanvasRef}
            className="w-full h-full rounded-lg border border-gray-700"
          />
        </div>
        <div className="min-h-0">
          <canvas
            ref={errorCanvasRef}
            className="w-full h-full rounded-lg border border-gray-700"
          />
        </div>
      </div>
    </div>
  );
};
