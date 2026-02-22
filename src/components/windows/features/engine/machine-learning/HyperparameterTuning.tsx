import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

type SearchMethod = 'grid' | 'random' | 'bayesian';

interface ParamPoint {
  maxDepth: number;
  learningRate: number;
  accuracy: number;
  order: number;
}

interface EvalResult {
  params: ParamPoint;
  bestSoFar: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// Simulated accuracy surface: a bumpy landscape with a clear peak
function accuracySurface(maxDepth: number, learningRate: number): number {
  // Normalize to [0, 1]
  const d = (maxDepth - 1) / 19; // 1-20 -> 0-1
  const lr = (learningRate - 0.001) / 0.999; // 0.001-1.0 -> 0-1

  // Create a realistic-looking surface with a peak around (8, 0.1)
  const optD = 0.35; // optimal depth ~8
  const optLR = 0.1; // optimal lr ~0.1

  const base = 0.5;
  const peak = 0.45 * Math.exp(-((d - optD) ** 2) / 0.08 - ((lr - optLR) ** 2) / 0.02);
  const secondary = 0.15 * Math.exp(-((d - 0.6) ** 2) / 0.05 - ((lr - 0.3) ** 2) / 0.04);
  const penalty = d > 0.7 ? (d - 0.7) * 0.3 : 0; // overfitting penalty
  const lrPenalty = lr > 0.5 ? (lr - 0.5) * 0.5 : 0; // high lr penalty

  return Math.max(0.3, Math.min(0.97, base + peak + secondary - penalty - lrPenalty));
}

function generateGridSearch(depthSteps: number, lrSteps: number): ParamPoint[] {
  const points: ParamPoint[] = [];
  let order = 0;
  for (let di = 0; di < depthSteps; di++) {
    for (let li = 0; li < lrSteps; li++) {
      const maxDepth = 1 + (di / (depthSteps - 1)) * 19;
      const learningRate = 0.001 + (li / (lrSteps - 1)) * 0.999;
      points.push({
        maxDepth: Math.round(maxDepth),
        learningRate: Math.round(learningRate * 1000) / 1000,
        accuracy: accuracySurface(maxDepth, learningRate),
        order: order++,
      });
    }
  }
  return points;
}

function generateRandomSearch(n: number, seed: number): ParamPoint[] {
  const rng = seededRandom(seed);
  const points: ParamPoint[] = [];
  for (let i = 0; i < n; i++) {
    const maxDepth = Math.round(1 + rng() * 19);
    const learningRate = Math.round((0.001 + rng() * 0.999) * 1000) / 1000;
    points.push({
      maxDepth,
      learningRate,
      accuracy: accuracySurface(maxDepth, learningRate),
      order: i,
    });
  }
  return points;
}

function generateBayesianSearch(n: number, seed: number): ParamPoint[] {
  const rng = seededRandom(seed);
  const points: ParamPoint[] = [];

  // Start with a few random points
  for (let i = 0; i < Math.min(5, n); i++) {
    const maxDepth = Math.round(1 + rng() * 19);
    const learningRate = Math.round((0.001 + rng() * 0.999) * 1000) / 1000;
    points.push({
      maxDepth,
      learningRate,
      accuracy: accuracySurface(maxDepth, learningRate),
      order: i,
    });
  }

  // Simulate Bayesian optimization: sample near best points with decreasing exploration
  for (let i = points.length; i < n; i++) {
    const best = points.reduce((b, p) => (p.accuracy > b.accuracy ? p : b), points[0]);
    const exploration = Math.max(0.05, 0.5 * Math.exp(-i / 10));

    let maxDepth: number, learningRate: number;
    if (rng() < exploration) {
      // Explore
      maxDepth = Math.round(1 + rng() * 19);
      learningRate = Math.round((0.001 + rng() * 0.999) * 1000) / 1000;
    } else {
      // Exploit - sample near best
      maxDepth = Math.round(Math.max(1, Math.min(20, best.maxDepth + (rng() - 0.5) * 6)));
      learningRate = Math.round(Math.max(0.001, Math.min(1, best.learningRate + (rng() - 0.5) * 0.15)) * 1000) / 1000;
    }

    points.push({
      maxDepth,
      learningRate,
      accuracy: accuracySurface(maxDepth, learningRate),
      order: i,
    });
  }

  return points;
}

function drawSurfaceHeatmap(
  canvas: HTMLCanvasElement,
  evaluatedPoints: ParamPoint[],
  currentStep: number,
  method: SearchMethod
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 25, right: 60, bottom: 35, left: 50 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Draw background accuracy surface
  const resolution = 40;
  const cellW = pw / resolution;
  const cellH = ph / resolution;
  for (let di = 0; di < resolution; di++) {
    for (let li = 0; li < resolution; li++) {
      const maxDepth = 1 + (di / (resolution - 1)) * 19;
      const learningRate = 0.001 + (li / (resolution - 1)) * 0.999;
      const acc = accuracySurface(maxDepth, learningRate);
      const intensity = (acc - 0.3) / 0.67; // normalize to [0, 1]
      const r = Math.floor(intensity < 0.5 ? 0 : (intensity - 0.5) * 2 * 255);
      const g = Math.floor(intensity < 0.5 ? intensity * 2 * 180 : 180 - (intensity - 0.5) * 2 * 80);
      const b = Math.floor(intensity < 0.5 ? 100 + intensity * 100 : 200 - intensity * 200);
      ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.fillRect(pad.left + di * cellW, pad.top + (resolution - 1 - li) * cellH, cellW + 0.5, cellH + 0.5);
    }
  }

  // Map helpers
  const depthToX = (d: number) => pad.left + ((d - 1) / 19) * pw;
  const lrToY = (lr: number) => pad.top + (1 - (lr - 0.001) / 0.999) * ph;

  // Draw evaluated points up to current step
  const shownPoints = evaluatedPoints.filter((p) => p.order <= currentStep);
  let bestPoint = shownPoints[0];

  for (const pt of shownPoints) {
    if (pt.accuracy > (bestPoint?.accuracy ?? 0)) bestPoint = pt;
    const x = depthToX(pt.maxDepth);
    const y = lrToY(pt.learningRate);

    // Point
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = pt === bestPoint ? '#fbbf24' : '#ffffff80';
    ctx.fill();
    ctx.strokeStyle = pt.order === currentStep ? '#fff' : '#00000060';
    ctx.lineWidth = pt.order === currentStep ? 2 : 0.5;
    ctx.stroke();
  }

  // Highlight best
  if (bestPoint) {
    const bx = depthToX(bestPoint.maxDepth);
    const by = lrToY(bestPoint.learningRate);
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbbf2440';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Grid lines
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const x = pad.left + (i / 4) * pw;
    const y = pad.top + (i / 4) * ph;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
  }

  // Axis labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const d = Math.round(1 + (i / 4) * 19);
    ctx.fillText(String(d), pad.left + (i / 4) * pw, pad.top + ph + 15);
  }
  ctx.fillText('max_depth', pad.left + pw / 2, pad.top + ph + 30);

  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const lr = (0.001 + (i / 4) * 0.999).toFixed(2);
    ctx.fillText(lr, pad.left - 5, pad.top + (1 - i / 4) * ph + 3);
  }
  ctx.save();
  ctx.translate(12, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('learning_rate', 0, 0);
  ctx.restore();

  // Color bar
  const cbX = w - pad.right + 15;
  const cbW = 12;
  const cbH = ph;
  for (let i = 0; i < cbH; i++) {
    const t = i / cbH;
    const intensity = 1 - t;
    const r = Math.floor(intensity < 0.5 ? 0 : (intensity - 0.5) * 2 * 255);
    const g = Math.floor(intensity < 0.5 ? intensity * 2 * 180 : 180 - (intensity - 0.5) * 2 * 80);
    const b = Math.floor(intensity < 0.5 ? 100 + intensity * 100 : 200 - intensity * 200);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(cbX, pad.top + i, cbW, 1);
  }
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(cbX, pad.top, cbW, cbH);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '8px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('0.97', cbX + cbW + 3, pad.top + 5);
  ctx.fillText('0.65', cbX + cbW + 3, pad.top + cbH / 2);
  ctx.fillText('0.30', cbX + cbW + 3, pad.top + cbH);

  // Title
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'left';
  const methodLabels: Record<SearchMethod, string> = {
    grid: 'Grid Search',
    random: 'Random Search',
    bayesian: 'Bayesian Optimization',
  };
  ctx.fillText(`${methodLabels[method]} - Accuracy Surface`, pad.left, 15);
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText(`${shownPoints.length} / ${evaluatedPoints.length} evaluated`, w - pad.right, 15);
}

function drawConvergence(
  canvas: HTMLCanvasElement,
  results: EvalResult[],
  currentStep: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 25, right: 15, bottom: 35, left: 50 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  if (results.length === 0) return;

  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (i / 5) * pw;
    const y = pad.top + (i / 5) * ph;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
  }

  const shown = results.filter((r) => r.params.order <= currentStep);
  if (shown.length === 0) return;

  const maxN = results.length;
  const minAcc = Math.min(...results.map((r) => r.params.accuracy)) - 0.02;
  const maxAcc = Math.max(...results.map((r) => r.bestSoFar)) + 0.02;
  const accRange = maxAcc - minAcc || 0.1;

  // Individual evaluations scatter
  ctx.fillStyle = '#ffffff30';
  for (const r of shown) {
    const x = pad.left + (r.params.order / (maxN - 1)) * pw;
    const y = pad.top + (1 - (r.params.accuracy - minAcc) / accRange) * ph;
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Best-so-far line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (const r of shown) {
    const x = pad.left + (r.params.order / (maxN - 1)) * pw;
    const y = pad.top + (1 - (r.bestSoFar - minAcc) / accRange) * ph;
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const v = Math.round((i / 5) * (maxN - 1));
    ctx.fillText(String(v), pad.left + (i / 5) * pw, pad.top + ph + 15);
  }
  ctx.fillText('Evaluation #', pad.left + pw / 2, pad.top + ph + 30);

  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const v = maxAcc - (i / 5) * accRange;
    ctx.fillText(v.toFixed(3), pad.left - 5, pad.top + (i / 5) * ph + 3);
  }
  ctx.save();
  ctx.translate(12, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Accuracy', 0, 0);
  ctx.restore();

  // Title
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Convergence: Best Score Over Evaluations', w / 2, 15);
}

export const HyperparameterTuning: React.FC = () => {
  const [method, setMethod] = useState<SearchMethod>('grid');
  const [gridSteps, setGridSteps] = useState(8);
  const [randomN, setRandomN] = useState(64);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'visualization' | 'education'>('visualization');
  const [speed, setSpeed] = useState(100);

  const surfaceRef = useRef<HTMLCanvasElement>(null);
  const convergenceRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  const evaluations = useMemo((): ParamPoint[] => {
    switch (method) {
      case 'grid': return generateGridSearch(gridSteps, gridSteps);
      case 'random': return generateRandomSearch(randomN, 42);
      case 'bayesian': return generateBayesianSearch(randomN, 42);
    }
  }, [method, gridSteps, randomN]);

  const evalResults = useMemo((): EvalResult[] => {
    let best = 0;
    return evaluations.map((p) => {
      best = Math.max(best, p.accuracy);
      return { params: p, bestSoFar: best };
    });
  }, [evaluations]);

  const bestPoint = useMemo(() => {
    const shown = evaluations.filter((p) => p.order <= currentStep);
    return shown.reduce((b, p) => (p.accuracy > b.accuracy ? p : b), shown[0] || evaluations[0]);
  }, [evaluations, currentStep]);

  const maxStep = evaluations.length - 1;

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [method, gridSteps, randomN]);

  useEffect(() => {
    if (isPlaying) {
      const step = () => {
        setCurrentStep((prev) => {
          if (prev >= maxStep) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      };
      const interval = setInterval(step, speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, maxStep, speed]);

  useEffect(() => {
    if (surfaceRef.current) {
      drawSurfaceHeatmap(surfaceRef.current, evaluations, currentStep, method);
    }
  }, [evaluations, currentStep, method]);

  useEffect(() => {
    if (convergenceRef.current) {
      drawConvergence(convergenceRef.current, evalResults, currentStep);
    }
  }, [evalResults, currentStep]);

  const methodDescriptions: Record<SearchMethod, { title: string; pros: string[]; cons: string[]; desc: string }> = {
    grid: {
      title: 'Grid Search',
      desc: 'Exhaustively evaluates all combinations from a predefined grid of hyperparameter values. Guarantees finding the best combination within the grid.',
      pros: ['Complete coverage of search space', 'Deterministic & reproducible', 'Easy to parallelize', 'Simple to implement'],
      cons: ['Exponential cost: O(n^d)', 'Wastes time on unimportant regions', 'Fixed resolution may miss optima between grid points', 'Curse of dimensionality'],
    },
    random: {
      title: 'Random Search',
      desc: 'Randomly samples hyperparameter combinations from the search space. Often finds good results faster than Grid Search, especially with many hyperparameters.',
      pros: ['Better coverage per evaluation', 'Handles high dimensions well', 'Easy to implement & parallelize', 'Any-time algorithm: more budget = better results'],
      cons: ['Non-deterministic without seed', 'No guarantee of finding optimum', 'May cluster in some regions', 'Does not learn from previous evaluations'],
    },
    bayesian: {
      title: 'Bayesian Optimization',
      desc: 'Uses a probabilistic surrogate model (like Gaussian Process) to guide the search. Balances exploration of unknown regions with exploitation of promising areas.',
      pros: ['Sample-efficient: fewer evaluations needed', 'Learns from past evaluations', 'Balances exploration vs exploitation', 'Well-suited for expensive objectives'],
      cons: ['More complex to implement', 'Surrogate model overhead', 'Hard to parallelize', 'May converge prematurely'],
    },
  };

  const currentMethodInfo = methodDescriptions[method];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      {/* Top controls */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        {/* Method selector */}
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['grid', 'random', 'bayesian'] as const).map((m) => {
            const labels: Record<SearchMethod, string> = { grid: 'Grid', random: 'Random', bayesian: 'Bayesian' };
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  method === m
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>

        {method === 'grid' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Grid size:</label>
            <select
              value={gridSteps}
              onChange={(e) => setGridSteps(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              {[4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>{n}x{n} ({n * n} evals)</option>
              ))}
            </select>
          </div>
        )}

        {(method === 'random' || method === 'bayesian') && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Evaluations:</label>
            <select
              value={randomN}
              onChange={(e) => setRandomN(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            >
              {[20, 40, 64, 100, 150].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        {/* Playback controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setCurrentStep(0)}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2 py-1 text-xs rounded font-medium ${
              isPlaying
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-cyan-600 text-white hover:bg-cyan-700'
            }`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setCurrentStep(maxStep)}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
          >
            Skip
          </button>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-gray-500">Speed:</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="px-1 py-0.5 text-[10px] rounded bg-gray-800 border border-gray-600 text-gray-200"
            >
              <option value={200}>Slow</option>
              <option value={100}>Normal</option>
              <option value={30}>Fast</option>
            </select>
          </div>
        </div>
      </div>

      {/* Step slider */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-gray-400">Step {currentStep + 1}/{maxStep + 1}</span>
        <input
          type="range"
          min="0"
          max={maxStep}
          value={currentStep}
          onChange={(e) => { setIsPlaying(false); setCurrentStep(Number(e.target.value)); }}
          className="flex-1 accent-cyan-500"
        />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Best Accuracy</div>
          <div className="text-sm font-bold text-cyan-400">{bestPoint?.accuracy.toFixed(4) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Best max_depth</div>
          <div className="text-sm font-bold text-amber-400">{bestPoint?.maxDepth ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Best learning_rate</div>
          <div className="text-sm font-bold text-violet-400">{bestPoint?.learningRate.toFixed(3) ?? '-'}</div>
        </div>
        <div className="rounded-lg border p-1.5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
          <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Total Evaluations</div>
          <div className="text-sm font-bold text-emerald-400">{evaluations.length}</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-2 w-fit">
        {(['visualization', 'education'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-cyan-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'visualization' ? 'Search Visualization' : 'Method Comparison'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'visualization' && (
          <div className="h-full grid grid-rows-2 gap-2">
            <div className="min-h-0">
              <canvas
                ref={surfaceRef}
                className="w-full h-full rounded-lg border border-gray-700"
              />
            </div>
            <div className="min-h-0">
              <canvas
                ref={convergenceRef}
                className="w-full h-full rounded-lg border border-gray-700"
              />
            </div>
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-3">
            {/* Current method description */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-200 mb-1">{currentMethodInfo.title}</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">{currentMethodInfo.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[10px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">Advantages</h4>
                  <ul className="space-y-0.5">
                    {currentMethodInfo.pros.map((p, i) => (
                      <li key={i} className="text-[10px] text-gray-400 flex gap-1.5">
                        <span className="text-emerald-400">{'\u2713'}</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-red-400 mb-1 uppercase tracking-wider">Disadvantages</h4>
                  <ul className="space-y-0.5">
                    {currentMethodInfo.cons.map((c, i) => (
                      <li key={i} className="text-[10px] text-gray-400 flex gap-1.5">
                        <span className="text-red-400">{'\u2717'}</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Side-by-side comparison */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-200 mb-2">Method Comparison</h3>
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-1.5 text-gray-400 font-medium">Criterion</th>
                    <th className="text-center py-1.5 text-gray-400 font-medium">Grid</th>
                    <th className="text-center py-1.5 text-gray-400 font-medium">Random</th>
                    <th className="text-center py-1.5 text-gray-400 font-medium">Bayesian</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Time Complexity', 'O(n^d)', 'O(n)', 'O(n)'],
                    ['Space Coverage', 'Uniform Grid', 'Uniform Random', 'Adaptive'],
                    ['Sample Efficiency', 'Low', 'Medium', 'High'],
                    ['Parallelizable', 'Yes', 'Yes', 'Limited'],
                    ['Learns from history', 'No', 'No', 'Yes'],
                    ['Best for # params', '1-3', '1-10', '1-20'],
                    ['Implementation', 'Simple', 'Simple', 'Complex'],
                  ].map(([criterion, grid, random, bayesian]) => (
                    <tr key={criterion} className="border-b border-gray-800/50">
                      <td className="py-1.5 text-gray-300 font-medium">{criterion}</td>
                      <td className="py-1.5 text-center text-gray-400">{grid}</td>
                      <td className="py-1.5 text-center text-gray-400">{random}</td>
                      <td className="py-1.5 text-center text-gray-400">{bayesian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Example: Tree hyperparameters */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-200 mb-2">Example: Decision Tree Hyperparameters</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-[10px] font-bold text-amber-400 mb-1">max_depth (1-20)</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Controls the maximum depth of the tree. Low values underfit (too simple), high values overfit (memorize noise).
                    Typically optimal around 5-10 for most datasets.
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-violet-400 mb-1">learning_rate (0.001-1.0)</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Scales the contribution of each tree in ensemble methods. Lower rates need more trees but generalize better.
                    Usually optimal around 0.05-0.2.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
