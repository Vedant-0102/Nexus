import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DatasetName = 'xor' | 'linear' | 'circular' | 'moons';
type AlgorithmName = 'Linear' | 'KNN' | 'Decision Tree' | 'K-Means';

interface Point { x: number; y: number; label: number }

interface AlgorithmResult {
  name: AlgorithmName;
  accuracy: number;
  trainingTime: number;          // ms (simulated)
  predictions: number[][];       // grid of predicted labels
}

/* ------------------------------------------------------------------ */
/*  Dataset generators                                                 */
/* ------------------------------------------------------------------ */

const rand = () => Math.random();
const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function generateDataset(name: DatasetName, n = 200): Point[] {
  const pts: Point[] = [];
  const half = Math.floor(n / 2);
  switch (name) {
    case 'xor':
      for (let i = 0; i < n; i++) {
        const x = rand() * 2 - 1;
        const y = rand() * 2 - 1;
        pts.push({ x, y, label: (x * y > 0) ? 1 : 0 });
      }
      break;
    case 'linear':
      for (let i = 0; i < n; i++) {
        const x = rand() * 2 - 1;
        const y = rand() * 2 - 1;
        pts.push({ x, y, label: (y > 0.5 * x + 0.1 * randn()) ? 1 : 0 });
      }
      break;
    case 'circular':
      for (let i = 0; i < half; i++) {
        const a = rand() * Math.PI * 2;
        const r = 0.3 + randn() * 0.08;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, label: 0 });
      }
      for (let i = 0; i < n - half; i++) {
        const a = rand() * Math.PI * 2;
        const r = 0.75 + randn() * 0.08;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, label: 1 });
      }
      break;
    case 'moons': {
      for (let i = 0; i < half; i++) {
        const a = Math.PI * (i / half);
        pts.push({ x: Math.cos(a) + randn() * 0.1, y: Math.sin(a) + randn() * 0.1, label: 0 });
      }
      for (let i = 0; i < n - half; i++) {
        const a = Math.PI * (i / (n - half));
        pts.push({ x: 1 - Math.cos(a) + randn() * 0.1, y: 0.5 - Math.sin(a) + randn() * 0.1, label: 1 });
      }
      break;
    }
  }
  return pts;
}

/* ------------------------------------------------------------------ */
/*  Simple ML algorithms (all operate on normalised [-1,1] space)      */
/* ------------------------------------------------------------------ */

function euclidean(a: Point, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// --- Linear classifier (logistic-like, 200 iters SGD) ---
function trainLinear(data: Point[]): (x: number, y: number) => number {
  let w1 = randn() * 0.1, w2 = randn() * 0.1, b = 0;
  const lr = 0.5;
  for (let ep = 0; ep < 200; ep++) {
    for (const p of data) {
      const z = w1 * p.x + w2 * p.y + b;
      const pred = 1 / (1 + Math.exp(-z));
      const err = pred - p.label;
      w1 -= lr * err * p.x;
      w2 -= lr * err * p.y;
      b -= lr * err;
    }
  }
  return (x, y) => (1 / (1 + Math.exp(-(w1 * x + w2 * y + b)))) > 0.5 ? 1 : 0;
}

// --- KNN (k=5) ---
function trainKNN(data: Point[]): (x: number, y: number) => number {
  const k = 5;
  return (x, y) => {
    const dists = data.map(p => ({ d: euclidean(p, { x, y }), l: p.label }));
    dists.sort((a, b) => a.d - b.d);
    const votes = dists.slice(0, k).reduce((s, d) => s + d.l, 0);
    return votes > k / 2 ? 1 : 0;
  };
}

// --- Decision Tree (simple axis-aligned splits, depth 5) ---
function trainDecisionTree(data: Point[]): (x: number, y: number) => number {
  interface Node { feature?: 'x' | 'y'; threshold?: number; left?: Node; right?: Node; label?: number }

  function build(pts: Point[], depth: number): Node {
    if (pts.length === 0) return { label: 0 };
    const ones = pts.filter(p => p.label === 1).length;
    if (depth === 0 || ones === 0 || ones === pts.length) {
      return { label: ones > pts.length / 2 ? 1 : 0 };
    }
    let bestGini = Infinity, bestF: 'x' | 'y' = 'x', bestT = 0;
    for (const f of ['x', 'y'] as const) {
      const vals = pts.map(p => p[f]).sort((a, b) => a - b);
      for (let i = 0; i < vals.length - 1; i += Math.max(1, Math.floor(vals.length / 20))) {
        const t = (vals[i] + vals[i + 1]) / 2;
        const left = pts.filter(p => p[f] <= t);
        const right = pts.filter(p => p[f] > t);
        if (left.length === 0 || right.length === 0) continue;
        const gl = 1 - (left.filter(p => p.label === 1).length / left.length) ** 2 - (left.filter(p => p.label === 0).length / left.length) ** 2;
        const gr = 1 - (right.filter(p => p.label === 1).length / right.length) ** 2 - (right.filter(p => p.label === 0).length / right.length) ** 2;
        const g = (left.length * gl + right.length * gr) / pts.length;
        if (g < bestGini) { bestGini = g; bestF = f; bestT = t; }
      }
    }
    if (bestGini === Infinity) return { label: ones > pts.length / 2 ? 1 : 0 };
    return {
      feature: bestF, threshold: bestT,
      left: build(pts.filter(p => p[bestF] <= bestT), depth - 1),
      right: build(pts.filter(p => p[bestF] > bestT), depth - 1),
    };
  }

  const tree = build(data, 5);

  function predict(node: Node, x: number, y: number): number {
    if (node.label !== undefined && !node.feature) return node.label;
    const val = node.feature === 'x' ? x : y;
    return predict(val <= node.threshold! ? node.left! : node.right!, x, y);
  }

  return (x, y) => predict(tree, x, y);
}

// --- K-Means (k=2, assigned to nearest cluster -> label by majority) ---
function trainKMeans(data: Point[]): (x: number, y: number) => number {
  let c0 = { x: -0.5 + randn() * 0.1, y: -0.5 + randn() * 0.1 };
  let c1 = { x: 0.5 + randn() * 0.1, y: 0.5 + randn() * 0.1 };
  for (let iter = 0; iter < 20; iter++) {
    const g0: Point[] = [], g1: Point[] = [];
    for (const p of data) {
      if (euclidean(p, c0) < euclidean(p, c1)) g0.push(p); else g1.push(p);
    }
    if (g0.length) { c0 = { x: g0.reduce((s, p) => s + p.x, 0) / g0.length, y: g0.reduce((s, p) => s + p.y, 0) / g0.length }; }
    if (g1.length) { c1 = { x: g1.reduce((s, p) => s + p.x, 0) / g1.length, y: g1.reduce((s, p) => s + p.y, 0) / g1.length }; }
  }
  // Map cluster to majority true label
  const g0 = data.filter(p => euclidean(p, c0) < euclidean(p, c1));
  const g1 = data.filter(p => euclidean(p, c0) >= euclidean(p, c1));
  const m0 = g0.filter(p => p.label === 1).length > g0.length / 2 ? 1 : 0;
  const m1 = g1.filter(p => p.label === 1).length > g1.length / 2 ? 1 : 0;
  return (x, y) => euclidean({ x, y, label: 0 }, c0) < euclidean({ x, y, label: 0 }, c1) ? m0 : m1;
}

/* ------------------------------------------------------------------ */
/*  Run an algorithm: train + evaluate on grid                         */
/* ------------------------------------------------------------------ */

const GRID = 40;

function runAlgorithm(name: AlgorithmName, data: Point[]): AlgorithmResult {
  const t0 = performance.now();
  let predict: (x: number, y: number) => number;
  switch (name) {
    case 'Linear': predict = trainLinear(data); break;
    case 'KNN': predict = trainKNN(data); break;
    case 'Decision Tree': predict = trainDecisionTree(data); break;
    case 'K-Means': predict = trainKMeans(data); break;
  }
  const t1 = performance.now();
  // Compute grid predictions
  const preds: number[][] = [];
  const minX = -1.5, maxX = 1.5, minY = -1.5, maxY = 1.5;
  for (let gy = 0; gy < GRID; gy++) {
    const row: number[] = [];
    for (let gx = 0; gx < GRID; gx++) {
      const x = minX + (gx / (GRID - 1)) * (maxX - minX);
      const y = minY + (gy / (GRID - 1)) * (maxY - minY);
      row.push(predict(x, y));
    }
    preds.push(row);
  }
  // Accuracy
  let correct = 0;
  for (const p of data) {
    if (predict(p.x, p.y) === p.label) correct++;
  }
  return { name, accuracy: correct / data.length, trainingTime: Math.max(1, t1 - t0), predictions: preds };
}

/* ------------------------------------------------------------------ */
/*  Draw decision boundary canvas                                      */
/* ------------------------------------------------------------------ */

function drawBoundaryCanvas(
  canvas: HTMLCanvasElement,
  data: Point[],
  predictions: number[][],
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Decision regions
  const cellW = W / GRID, cellH = H / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const label = predictions[gy][gx];
      ctx.fillStyle = label === 1 ? 'rgba(59,130,246,0.18)' : 'rgba(239,68,68,0.18)';
      ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
    }
  }

  // Points
  const minX = -1.5, maxX = 1.5, minY = -1.5, maxY = 1.5;
  for (const p of data) {
    const px = ((p.x - minX) / (maxX - minX)) * W;
    const py = ((p.y - minY) / (maxY - minY)) * H;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = p.label === 1 ? '#3b82f6' : '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------ */
/*  Recommendation logic                                               */
/* ------------------------------------------------------------------ */

function recommend(dataset: DatasetName, results: AlgorithmResult[]): string {
  const best = [...results].sort((a, b) => b.accuracy - a.accuracy)[0];

  const tips: Record<DatasetName, string> = {
    xor: 'Non-linear data like XOR needs flexible models. Decision Tree and KNN handle this well; linear models struggle.',
    linear: 'Linearly separable data is ideal for simple models. Linear classifier is sufficient and most interpretable.',
    circular: 'Concentric circles require non-linear boundaries. KNN and Decision Tree adapt well; K-Means struggles with manifold shapes.',
    moons: 'Interleaving moon shapes need non-linear learners. KNN excels here; Decision Tree can overfit on the boundaries.',
  };

  return `Best: ${best.name} (${(best.accuracy * 100).toFixed(1)}%). ${tips[dataset]}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const ALGORITHMS: AlgorithmName[] = ['Linear', 'KNN', 'Decision Tree', 'K-Means'];
const DATASETS: { value: DatasetName; label: string }[] = [
  { value: 'xor', label: 'XOR Pattern' },
  { value: 'linear', label: 'Linear Separable' },
  { value: 'circular', label: 'Concentric Circles' },
  { value: 'moons', label: 'Moons' },
];

export const ModelComparison: React.FC = () => {
  const [dataset, setDataset] = useState<DatasetName>('xor');
  const [data, setData] = useState<Point[]>([]);
  const [results, setResults] = useState<AlgorithmResult[]>([]);
  const [running, setRunning] = useState(false);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null, null]);

  /* Generate data on dataset change */
  useEffect(() => {
    setData(generateDataset(dataset, 200));
    setResults([]);
  }, [dataset]);

  /* Draw canvases when results change */
  useEffect(() => {
    results.forEach((r, i) => {
      const c = canvasRefs.current[i];
      if (c) drawBoundaryCanvas(c, data, r.predictions);
    });
  }, [results, data]);

  const handleRun = useCallback(() => {
    setRunning(true);
    requestAnimationFrame(() => {
      const res = ALGORITHMS.map(a => runAlgorithm(a, data));
      setResults(res);
      setRunning(false);
    });
  }, [data]);

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={dataset} onChange={e => setDataset(e.target.value as DatasetName)} className={selectClass}>
          {DATASETS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
        <button
          onClick={handleRun}
          disabled={running || data.length === 0}
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 transition-colors"
        >
          {running ? 'Running...' : 'Run All Algorithms'}
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{data.length} data points</span>
      </div>

      {/* Results Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {results.map((r, i) => (
                <div key={r.name} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{r.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.accuracy >= 0.85 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : r.accuracy >= 0.65 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                      {(r.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <canvas
                    ref={el => { canvasRefs.current[i] = el; }}
                    width={200}
                    height={200}
                    className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 mb-1"
                  />
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Train time: {r.trainingTime.toFixed(1)} ms</span>
                </div>
              ))}
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 mb-3 overflow-auto">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Comparison Table</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-1 pr-4">Algorithm</th>
                    <th className="pb-1 pr-4">Accuracy</th>
                    <th className="pb-1 pr-4">Train Time</th>
                    <th className="pb-1">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {[...results].sort((a, b) => b.accuracy - a.accuracy).map((r, idx) => (
                    <tr key={r.name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-1.5 pr-4 font-medium text-gray-700 dark:text-gray-200">{r.name}</td>
                      <td className="py-1.5 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.accuracy * 100}%` }} />
                          </div>
                          <span className="text-gray-600 dark:text-gray-300">{(r.accuracy * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-1.5 pr-4 text-gray-600 dark:text-gray-300">{r.trainingTime.toFixed(1)} ms</td>
                      <td className="py-1.5">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                          {idx + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">Recommendation</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{recommend(dataset, results)}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm font-medium mb-1">Select a dataset and click &quot;Run All Algorithms&quot;</p>
              <p className="text-xs">Compare Linear, KNN, Decision Tree, and K-Means side by side</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
