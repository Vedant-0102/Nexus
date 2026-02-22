import React, { useState, useRef, useEffect, useCallback } from 'react';

type AlgoType = 'linear-reg' | 'decision-tree' | 'knn' | 'k-means' | 'neural-net';

interface Point { x: number; y: number; label: number }
interface Metrics { accuracy: number; loss: number; iteration: number }

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

interface AlgoConfig {
  name: string;
  params: ParamDef[];
}

const ALGO_CONFIGS: Record<AlgoType, AlgoConfig> = {
  'linear-reg': {
    name: 'Linear Regression',
    params: [
      { key: 'learningRate', label: 'Learning Rate', min: 0.001, max: 0.5, step: 0.001, default: 0.01 },
      { key: 'iterations', label: 'Max Iterations', min: 10, max: 500, step: 10, default: 100 },
    ],
  },
  'decision-tree': {
    name: 'Decision Tree',
    params: [
      { key: 'maxDepth', label: 'Max Depth', min: 1, max: 10, step: 1, default: 3 },
      { key: 'minSamplesSplit', label: 'Min Samples Split', min: 2, max: 20, step: 1, default: 5 },
    ],
  },
  'knn': {
    name: 'K-Nearest Neighbors',
    params: [
      { key: 'k', label: 'K (Neighbors)', min: 1, max: 20, step: 1, default: 5 },
      { key: 'distMetric', label: 'Distance Power (1=Manhattan, 2=Euclidean)', min: 1, max: 3, step: 0.5, default: 2 },
    ],
  },
  'k-means': {
    name: 'K-Means Clustering',
    params: [
      { key: 'k', label: 'K (Clusters)', min: 2, max: 8, step: 1, default: 3 },
      { key: 'iterations', label: 'Max Iterations', min: 1, max: 50, step: 1, default: 20 },
    ],
  },
  'neural-net': {
    name: 'Neural Network',
    params: [
      { key: 'learningRate', label: 'Learning Rate', min: 0.01, max: 2.0, step: 0.01, default: 0.5 },
      { key: 'hiddenSize', label: 'Hidden Layer Size', min: 2, max: 16, step: 1, default: 6 },
      { key: 'activation', label: 'Activation (0=Sigmoid, 1=Tanh, 2=ReLU)', min: 0, max: 2, step: 1, default: 0 },
    ],
  },
};

const COLORS_CL = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function generateClusteredData(numClasses: number): Point[] {
  const pts: Point[] = [];
  const centers = [
    { x: 0.3, y: 0.3 }, { x: 0.7, y: 0.7 }, { x: 0.3, y: 0.7 },
    { x: 0.7, y: 0.3 }, { x: 0.5, y: 0.5 },
  ];
  for (let c = 0; c < Math.min(numClasses, centers.length); c++) {
    for (let i = 0; i < 25; i++) {
      pts.push({
        x: centers[c].x + (Math.random() - 0.5) * 0.25,
        y: centers[c].y + (Math.random() - 0.5) * 0.25,
        label: c,
      });
    }
  }
  return pts;
}

function generateBinaryData(): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < 30; i++) {
    const x = Math.random();
    const y = Math.random();
    pts.push({ x, y, label: x + y > 1 ? 1 : 0 });
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.random();
    const y = Math.random();
    const noisy = (x + y + (Math.random() - 0.5) * 0.4) > 1 ? 1 : 0;
    pts.push({ x, y, label: noisy });
  }
  return pts;
}

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)); }
function tanhAct(x: number): number { return Math.tanh(x); }
function relu(x: number): number { return Math.max(0, x); }

export const ParameterTuner: React.FC = () => {
  const [algo, setAlgo] = useState<AlgoType>('knn');
  const [params, setParams] = useState<Record<string, number>>({});
  const [dataPoints, setDataPoints] = useState<Point[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ accuracy: 0, loss: 0, iteration: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const weightsRef = useRef<number[]>([]);
  const centroidsRef = useRef<{ x: number; y: number }[]>([]);
  const nnWeightsRef = useRef<{ w1: number[][]; b1: number[]; w2: number[][]; b2: number[] } | null>(null);

  // Initialize params when algo changes
  useEffect(() => {
    const config = ALGO_CONFIGS[algo];
    const newParams: Record<string, number> = {};
    config.params.forEach(p => { newParams[p.key] = p.default; });
    setParams(newParams);
    setCurrentIteration(0);
    setIsPlaying(false);
    setMetrics({ accuracy: 0, loss: 0, iteration: 0 });
    weightsRef.current = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    centroidsRef.current = [];
    nnWeightsRef.current = null;
  }, [algo]);

  // Generate data when algo changes
  useEffect(() => {
    if (algo === 'k-means') {
      setDataPoints(generateClusteredData(params.k || 3));
    } else {
      setDataPoints(generateBinaryData());
    }
  }, [algo]);

  const resetData = useCallback(() => {
    if (algo === 'k-means') {
      setDataPoints(generateClusteredData(params.k || 3));
    } else {
      setDataPoints(generateBinaryData());
    }
    setCurrentIteration(0);
    setIsPlaying(false);
    setMetrics({ accuracy: 0, loss: 0, iteration: 0 });
    weightsRef.current = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
    centroidsRef.current = [];
    nnWeightsRef.current = null;
  }, [algo, params.k]);

  const initNNWeights = useCallback((hiddenSize: number) => {
    const w1: number[][] = [];
    const b1: number[] = [];
    for (let h = 0; h < hiddenSize; h++) {
      w1.push([Math.random() * 2 - 1, Math.random() * 2 - 1]);
      b1.push(Math.random() * 0.2 - 0.1);
    }
    const w2: number[][] = [[]];
    for (let h = 0; h < hiddenSize; h++) {
      w2[0].push(Math.random() * 2 - 1);
    }
    const b2 = [Math.random() * 0.2 - 0.1];
    nnWeightsRef.current = { w1, b1, w2, b2 };
  }, []);

  const classify = useCallback((px: number, py: number): number => {
    if (algo === 'knn') {
      const k = params.k || 5;
      const p = params.distMetric || 2;
      const distances = dataPoints.map(pt => ({
        dist: Math.pow(Math.pow(Math.abs(pt.x - px), p) + Math.pow(Math.abs(pt.y - py), p), 1 / p),
        label: pt.label,
      })).sort((a, b) => a.dist - b.dist);
      const kNearest = distances.slice(0, k);
      const counts: Record<number, number> = {};
      kNearest.forEach(n => { counts[n.label] = (counts[n.label] || 0) + 1; });
      return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
    }
    if (algo === 'linear-reg' || algo === 'decision-tree') {
      const w = weightsRef.current;
      const z = w[0] * px + w[1] * py + w[2];
      return z > 0 ? 1 : 0;
    }
    if (algo === 'k-means') {
      if (centroidsRef.current.length === 0) return 0;
      let minDist = Infinity, closest = 0;
      centroidsRef.current.forEach((c, ci) => {
        const d = Math.hypot(c.x - px, c.y - py);
        if (d < minDist) { minDist = d; closest = ci; }
      });
      return closest;
    }
    if (algo === 'neural-net') {
      const nn = nnWeightsRef.current;
      if (!nn) return 0;
      const actIdx = params.activation || 0;
      const actFn = actIdx === 0 ? sigmoid : actIdx === 1 ? tanhAct : relu;
      const hidden = nn.w1.map((w, i) => actFn(w[0] * px + w[1] * py + nn.b1[i]));
      const output = sigmoid(hidden.reduce((s, h, i) => s + h * nn.w2[0][i], 0) + nn.b2[0]);
      return output > 0.5 ? 1 : 0;
    }
    return 0;
  }, [algo, params, dataPoints]);

  const trainStep = useCallback(() => {
    if (algo === 'linear-reg') {
      const lr = params.learningRate || 0.01;
      const w = [...weightsRef.current];
      let totalLoss = 0;
      dataPoints.forEach(pt => {
        const z = w[0] * pt.x + w[1] * pt.y + w[2];
        const pred = sigmoid(z);
        const err = pred - pt.label;
        totalLoss += pt.label * Math.log(pred + 1e-8) + (1 - pt.label) * Math.log(1 - pred + 1e-8);
        w[0] -= lr * err * pt.x;
        w[1] -= lr * err * pt.y;
        w[2] -= lr * err;
      });
      weightsRef.current = w;
      return -totalLoss / dataPoints.length;
    }
    if (algo === 'decision-tree') {
      // Simulate decision boundary learning with gradient descent on a boundary
      const lr = 0.05;
      const w = [...weightsRef.current];
      let totalLoss = 0;
      dataPoints.forEach(pt => {
        const z = w[0] * pt.x + w[1] * pt.y + w[2];
        const pred = sigmoid(z);
        const err = pred - pt.label;
        totalLoss += pt.label * Math.log(pred + 1e-8) + (1 - pt.label) * Math.log(1 - pred + 1e-8);
        w[0] -= lr * err * pt.x;
        w[1] -= lr * err * pt.y;
        w[2] -= lr * err;
      });
      weightsRef.current = w;
      return -totalLoss / dataPoints.length;
    }
    if (algo === 'k-means') {
      const k = params.k || 3;
      if (centroidsRef.current.length === 0) {
        const shuffled = [...dataPoints].sort(() => Math.random() - 0.5);
        centroidsRef.current = shuffled.slice(0, k).map(p => ({ x: p.x, y: p.y }));
      }
      // Assign
      const assignments = dataPoints.map(pt => {
        let minDist = Infinity, closest = 0;
        centroidsRef.current.forEach((c, ci) => {
          const d = Math.hypot(pt.x - c.x, pt.y - c.y);
          if (d < minDist) { minDist = d; closest = ci; }
        });
        return closest;
      });
      // Update centroids
      let totalInertia = 0;
      centroidsRef.current = centroidsRef.current.map((c, ci) => {
        const clusterPts = dataPoints.filter((_, pi) => assignments[pi] === ci);
        if (clusterPts.length === 0) return c;
        const newC = {
          x: clusterPts.reduce((s, p) => s + p.x, 0) / clusterPts.length,
          y: clusterPts.reduce((s, p) => s + p.y, 0) / clusterPts.length,
        };
        clusterPts.forEach(p => { totalInertia += Math.hypot(p.x - newC.x, p.y - newC.y); });
        return newC;
      });
      // Update labels in data for visualization
      setDataPoints(prev => prev.map((p, i) => ({ ...p, label: assignments[i] })));
      return totalInertia / dataPoints.length;
    }
    if (algo === 'neural-net') {
      const lr = params.learningRate || 0.5;
      const hiddenSize = params.hiddenSize || 6;
      const actIdx = params.activation || 0;
      if (!nnWeightsRef.current) {
        initNNWeights(hiddenSize);
      }
      const nn = nnWeightsRef.current!;
      const actFn = actIdx === 0 ? sigmoid : actIdx === 1 ? tanhAct : relu;
      const actDeriv = actIdx === 0
        ? (x: number) => { const s = sigmoid(x); return s * (1 - s); }
        : actIdx === 1
        ? (x: number) => 1 - Math.tanh(x) ** 2
        : (x: number) => x > 0 ? 1 : 0;

      let totalLoss = 0;
      dataPoints.forEach(pt => {
        // Forward pass
        const zH = nn.w1.map((w, i) => w[0] * pt.x + w[1] * pt.y + nn.b1[i]);
        const aH = zH.map(z => actFn(z));
        const zO = aH.reduce((s, h, i) => s + h * nn.w2[0][i], 0) + nn.b2[0];
        const aO = sigmoid(zO);
        const err = aO - pt.label;
        totalLoss += -(pt.label * Math.log(aO + 1e-8) + (1 - pt.label) * Math.log(1 - aO + 1e-8));

        // Backward pass
        const dO = err;
        for (let i = 0; i < hiddenSize; i++) {
          const dH = dO * nn.w2[0][i] * actDeriv(zH[i]);
          nn.w1[i][0] -= lr * dH * pt.x;
          nn.w1[i][1] -= lr * dH * pt.y;
          nn.b1[i] -= lr * dH;
          nn.w2[0][i] -= lr * dO * aH[i];
        }
        nn.b2[0] -= lr * dO;
      });
      return totalLoss / dataPoints.length;
    }
    return 0;
  }, [algo, params, dataPoints, initNNWeights]);

  const computeAccuracy = useCallback(() => {
    if (algo === 'k-means') return 0;
    let correct = 0;
    dataPoints.forEach(pt => {
      const pred = classify(pt.x, pt.y);
      if (pred === pt.label) correct++;
    });
    return correct / Math.max(dataPoints.length, 1);
  }, [algo, dataPoints, classify]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw decision boundary by sampling grid
    const resolution = 4;
    for (let x = 0; x < w; x += resolution) {
      for (let y = 0; y < h; y += resolution) {
        const nx = x / w;
        const ny = y / h;
        const c = classify(nx, ny);
        const color = COLORS_CL[c % COLORS_CL.length];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.12;
        ctx.fillRect(x, y, resolution, resolution);
      }
    }
    ctx.globalAlpha = 1;

    // Draw data points
    dataPoints.forEach(pt => {
      const px = pt.x * w;
      const py = pt.y * h;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS_CL[pt.label % COLORS_CL.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw centroids for k-means
    if (algo === 'k-means' && centroidsRef.current.length > 0) {
      centroidsRef.current.forEach((c, ci) => {
        const px = c.x * w;
        const py = c.y * h;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS_CL[ci % COLORS_CL.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Draw X
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - 4, py - 4);
        ctx.lineTo(px + 4, py + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + 4, py - 4);
        ctx.lineTo(px - 4, py + 4);
        ctx.stroke();
      });
    }

    // Info overlay
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, 18);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.fillText(`Iteration: ${currentIteration}  |  Acc: ${(metrics.accuracy * 100).toFixed(1)}%  |  Loss: ${metrics.loss.toFixed(4)}`, 6, 13);
  }, [algo, dataPoints, classify, currentIteration, metrics]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const maxIter = params.iterations || 100;
    const intervalId = setInterval(() => {
      setCurrentIteration(prev => {
        if (prev >= maxIter) {
          setIsPlaying(false);
          return prev;
        }
        const loss = trainStep();
        const acc = computeAccuracy();
        setMetrics({ accuracy: acc, loss, iteration: prev + 1 });
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(intervalId);
  }, [isPlaying, params, trainStep, computeAccuracy]);

  // Redraw canvas when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleParamChange = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const algoConfig = ALGO_CONFIGS[algo];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={algo}
          onChange={e => setAlgo(e.target.value as AlgoType)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        >
          {Object.entries(ALGO_CONFIGS).map(([key, config]) => (
            <option key={key} value={key}>{config.name}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (!isPlaying && currentIteration === 0) {
              if (algo === 'neural-net') initNNWeights(params.hiddenSize || 6);
            }
            setIsPlaying(!isPlaying);
          }}
          className={`px-4 py-1.5 text-sm rounded-lg font-semibold transition-colors ${
            isPlaying
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={resetData}
          className="px-4 py-1.5 text-sm rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Parameters panel */}
        <div className="w-64 shrink-0 bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700 overflow-auto">
          <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-3 uppercase tracking-wider">Parameters</h3>
          <div className="space-y-4">
            {algoConfig.params.map(pd => (
              <div key={pd.key}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{pd.label}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{params[pd.key] ?? pd.default}</span>
                </div>
                <input
                  type="range"
                  min={pd.min}
                  max={pd.max}
                  step={pd.step}
                  value={params[pd.key] ?? pd.default}
                  onChange={e => handleParamChange(pd.key, Number(e.target.value))}
                  className="w-full h-1.5 accent-emerald-500"
                />
                <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                  <span>{pd.min}</span>
                  <span>{pd.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics */}
          <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wider">Metrics</h3>
            <div className="space-y-2">
              {algo !== 'k-means' && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">Accuracy</span>
                  <span className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {(metrics.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {algo === 'k-means' ? 'Inertia' : 'Loss'}
                </span>
                <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">
                  {metrics.loss.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-gray-500 dark:text-gray-400">Iteration</span>
                <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {metrics.iteration}
                </span>
              </div>
            </div>

            {/* Accuracy bar */}
            {algo !== 'k-means' && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.accuracy * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wider">Legend</h3>
            <div className="space-y-1">
              {algo === 'k-means' ? (
                Array.from({ length: params.k || 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_CL[i] }} />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Cluster {i + 1}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Class 0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Class 1</span>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: 'rgba(100,100,255,0.2)' }} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Decision region</span>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
            onClick={e => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              const y = (e.clientY - rect.top) / rect.height;
              const label = algo === 'k-means' ? 0 : (x + y > 1 ? 1 : 0);
              setDataPoints(prev => [...prev, { x, y, label }]);
            }}
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-2 text-[10px] text-gray-400 text-center">
        Click on the canvas to add data points. Adjust parameters and press Play to train.
      </div>
    </div>
  );
};
