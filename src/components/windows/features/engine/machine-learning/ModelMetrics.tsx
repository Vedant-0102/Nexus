import React, { useState, useEffect, useRef, useCallback } from 'react';

type ClassLabel = number;

interface Sample {
  trueLabel: ClassLabel;
  score: number; // probability score for positive class (or per-class)
  predictedLabel: ClassLabel;
}

interface MetricsResult {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  specificity: number;
}

interface PerClassMetrics {
  label: number;
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

interface RocPoint {
  fpr: number;
  tpr: number;
  threshold: number;
}

interface PrPoint {
  recall: number;
  precision: number;
  threshold: number;
}

function generateRandomSamples(n: number, numClasses: number): Sample[] {
  const samples: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const trueLabel = Math.floor(Math.random() * numClasses);
    const score = Math.random();
    const noise = Math.random();
    let predictedLabel: number;
    if (numClasses === 2) {
      predictedLabel = score > 0.5 ? 1 : 0;
      if (noise < 0.2) predictedLabel = 1 - predictedLabel;
    } else {
      predictedLabel = noise < 0.65 ? trueLabel : Math.floor(Math.random() * numClasses);
    }
    samples.push({
      trueLabel,
      score: trueLabel === 1 ? 0.3 + Math.random() * 0.6 : Math.random() * 0.7,
      predictedLabel,
    });
  }
  return samples;
}

function computeBinaryMetrics(samples: Sample[], threshold: number): MetricsResult {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (const s of samples) {
    const pred = s.score >= threshold ? 1 : 0;
    if (s.trueLabel === 1 && pred === 1) tp++;
    else if (s.trueLabel === 0 && pred === 0) tn++;
    else if (s.trueLabel === 0 && pred === 1) fp++;
    else fn++;
  }
  const accuracy = (tp + tn) / (tp + tn + fp + fn) || 0;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const specificity = tn / (tn + fp) || 0;
  return { tp, tn, fp, fn, accuracy, precision, recall, f1, specificity };
}

function computeConfusionMatrix(samples: Sample[], numClasses: number, threshold: number): number[][] {
  const matrix: number[][] = Array.from({ length: numClasses }, () => Array(numClasses).fill(0));
  for (const s of samples) {
    const pred = numClasses === 2 ? (s.score >= threshold ? 1 : 0) : s.predictedLabel;
    matrix[s.trueLabel][pred]++;
  }
  return matrix;
}

function computePerClassMetrics(matrix: number[][], numClasses: number): PerClassMetrics[] {
  const results: PerClassMetrics[] = [];
  for (let c = 0; c < numClasses; c++) {
    const tp = matrix[c][c];
    let fp = 0, fn = 0, support = 0;
    for (let i = 0; i < numClasses; i++) {
      support += matrix[c][i];
      if (i !== c) {
        fp += matrix[i][c];
        fn += matrix[c][i];
      }
    }
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
    results.push({ label: c, precision, recall, f1, support });
  }
  return results;
}

function computeROC(samples: Sample[]): { points: RocPoint[]; auc: number } {
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
  const points: RocPoint[] = [];
  for (const t of thresholds) {
    let tp = 0, fp = 0, totalP = 0, totalN = 0;
    for (const s of samples) {
      if (s.trueLabel === 1) { totalP++; if (s.score >= t) tp++; }
      else { totalN++; if (s.score >= t) fp++; }
    }
    const tpr = totalP > 0 ? tp / totalP : 0;
    const fpr = totalN > 0 ? fp / totalN : 0;
    points.push({ fpr, tpr, threshold: t });
  }
  points.sort((a, b) => a.fpr - b.fpr || a.tpr - b.tpr);
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2;
  }
  return { points, auc: Math.max(0, Math.min(1, auc)) };
}

function computePR(samples: Sample[]): PrPoint[] {
  const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
  const points: PrPoint[] = [];
  for (const t of thresholds) {
    let tp = 0, fp = 0, fn = 0;
    for (const s of samples) {
      const pred = s.score >= t ? 1 : 0;
      if (s.trueLabel === 1 && pred === 1) tp++;
      else if (s.trueLabel === 0 && pred === 1) fp++;
      else if (s.trueLabel === 1 && pred === 0) fn++;
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    points.push({ recall, precision, threshold: t });
  }
  return points.sort((a, b) => a.recall - b.recall);
}

function drawROCCurve(canvas: HTMLCanvasElement, points: RocPoint[], auc: number, threshold: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 25, right: 15, bottom: 35, left: 40 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = pad.left + (i / 10) * pw;
    const y = pad.top + (i / 10) * ph;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
  }

  // Diagonal
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + ph);
  ctx.lineTo(pad.left + pw, pad.top);
  ctx.stroke();
  ctx.setLineDash([]);

  // ROC curve
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (const p of points) {
    const x = pad.left + p.fpr * pw;
    const y = pad.top + (1 - p.tpr) * ph;
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill under curve
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + ph);
  for (const p of points) {
    ctx.lineTo(pad.left + p.fpr * pw, pad.top + (1 - p.tpr) * ph);
  }
  ctx.lineTo(pad.left + pw, pad.top + ph);
  ctx.closePath();
  ctx.fill();

  // Current threshold point
  const threshPt = points.reduce((best, p) => Math.abs(p.threshold - threshold) < Math.abs(best.threshold - threshold) ? p : best, points[0]);
  const cx = pad.left + threshPt.fpr * pw;
  const cy = pad.top + (1 - threshPt.tpr) * ph;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 10; i += 2) {
    ctx.fillText((i / 10).toFixed(1), pad.left + (i / 10) * pw, pad.top + ph + 15);
    ctx.textAlign = 'right';
    ctx.fillText((1 - i / 10).toFixed(1), pad.left - 5, pad.top + (i / 10) * ph + 3);
    ctx.textAlign = 'center';
  }
  ctx.fillText('False Positive Rate', pad.left + pw / 2, pad.top + ph + 30);
  ctx.save();
  ctx.translate(12, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('True Positive Rate', 0, 0);
  ctx.restore();

  // Title
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`ROC Curve (AUC = ${auc.toFixed(3)})`, w / 2, 15);
}

function drawPRCurve(canvas: HTMLCanvasElement, points: PrPoint[], threshold: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = { top: 25, right: 15, bottom: 35, left: 40 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = pad.left + (i / 10) * pw;
    const y = pad.top + (i / 10) * ph;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pw, y); ctx.stroke();
  }

  // PR curve
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let first = true;
  for (const p of points) {
    const x = pad.left + p.recall * pw;
    const y = pad.top + (1 - p.precision) * ph;
    if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill under curve
  ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top + ph);
  for (const p of points) {
    ctx.lineTo(pad.left + p.recall * pw, pad.top + (1 - p.precision) * ph);
  }
  ctx.lineTo(pad.left + pw, pad.top + ph);
  ctx.closePath();
  ctx.fill();

  // Current threshold point
  const threshPt = points.reduce((best, p) => Math.abs(p.threshold - threshold) < Math.abs(best.threshold - threshold) ? p : best, points[0]);
  const cx = pad.left + threshPt.recall * pw;
  const cy = pad.top + (1 - threshPt.precision) * ph;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#9ca3af';
  ctx.font = '10px system-ui';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 10; i += 2) {
    ctx.fillText((i / 10).toFixed(1), pad.left + (i / 10) * pw, pad.top + ph + 15);
    ctx.textAlign = 'right';
    ctx.fillText((1 - i / 10).toFixed(1), pad.left - 5, pad.top + (i / 10) * ph + 3);
    ctx.textAlign = 'center';
  }
  ctx.fillText('Recall', pad.left + pw / 2, pad.top + ph + 30);
  ctx.save();
  ctx.translate(12, pad.top + ph / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Precision', 0, 0);
  ctx.restore();

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Precision-Recall Curve', w / 2, 15);
}

const metricColor = (val: number): string => {
  if (val >= 0.9) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40';
  if (val >= 0.7) return 'from-blue-500/20 to-blue-600/10 border-blue-500/40';
  if (val >= 0.5) return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40';
  return 'from-red-500/20 to-red-600/10 border-red-500/40';
};

const metricTextColor = (val: number): string => {
  if (val >= 0.9) return 'text-emerald-400';
  if (val >= 0.7) return 'text-blue-400';
  if (val >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
};

export const ModelMetrics: React.FC = () => {
  const [numSamples, setNumSamples] = useState(200);
  const [numClasses, setNumClasses] = useState(2);
  const [threshold, setThreshold] = useState(0.5);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'roc' | 'pr' | 'perclass'>('matrix');

  const rocCanvasRef = useRef<HTMLCanvasElement>(null);
  const prCanvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(() => {
    setSamples(generateRandomSamples(numSamples, numClasses));
  }, [numSamples, numClasses]);

  useEffect(() => { generate(); }, [generate]);

  const matrix = computeConfusionMatrix(samples, numClasses, threshold);
  const binaryMetrics = numClasses === 2 ? computeBinaryMetrics(samples, threshold) : null;
  const perClassMetrics = computePerClassMetrics(matrix, numClasses);
  const rocData = numClasses === 2 ? computeROC(samples) : null;
  const prData = numClasses === 2 ? computePR(samples) : null;

  const overallAccuracy = samples.length > 0
    ? samples.filter((s) => {
        const pred = numClasses === 2 ? (s.score >= threshold ? 1 : 0) : s.predictedLabel;
        return s.trueLabel === pred;
      }).length / samples.length
    : 0;

  useEffect(() => {
    if (activeTab === 'roc' && rocCanvasRef.current && rocData) {
      drawROCCurve(rocCanvasRef.current, rocData.points, rocData.auc, threshold);
    }
  }, [activeTab, rocData, threshold]);

  useEffect(() => {
    if (activeTab === 'pr' && prCanvasRef.current && prData) {
      drawPRCurve(prCanvasRef.current, prData, threshold);
    }
  }, [activeTab, prData, threshold]);

  const maxVal = Math.max(...matrix.flat(), 1);

  const classLabels = numClasses === 2 ? ['Negative (0)', 'Positive (1)'] : Array.from({ length: numClasses }, (_, i) => `Class ${i}`);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Samples:</label>
          <select
            value={numSamples}
            onChange={(e) => setNumSamples(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            {[50, 100, 200, 500, 1000].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Classes:</label>
          <select
            value={numClasses}
            onChange={(e) => setNumClasses(Number(e.target.value))}
            className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={generate}
          className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
        >
          Generate Data
        </button>
        {numClasses === 2 && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Threshold: {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-28 accent-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-2 w-fit">
        {(['matrix', 'roc', 'pr', 'perclass'] as const).map((tab) => {
          const labels: Record<string, string> = { matrix: 'Confusion Matrix', roc: 'ROC Curve', pr: 'PR Curve', perclass: 'Per-Class' };
          const disabled = (tab === 'roc' || tab === 'pr') && numClasses !== 2;
          return (
            <button
              key={tab}
              onClick={() => !disabled && setActiveTab(tab)}
              disabled={disabled}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : disabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Binary Metric Cards */}
      {numClasses === 2 && binaryMetrics && (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 mb-2">
          {[
            { label: 'TP', value: binaryMetrics.tp, isCount: true },
            { label: 'TN', value: binaryMetrics.tn, isCount: true },
            { label: 'FP', value: binaryMetrics.fp, isCount: true },
            { label: 'FN', value: binaryMetrics.fn, isCount: true },
            { label: 'Accuracy', value: binaryMetrics.accuracy },
            { label: 'Precision', value: binaryMetrics.precision },
            { label: 'Recall', value: binaryMetrics.recall },
            { label: 'F1-Score', value: binaryMetrics.f1 },
            { label: 'Specificity', value: binaryMetrics.specificity },
          ].map(({ label, value, isCount }) => (
            <div
              key={label}
              className={`rounded-lg border p-1.5 bg-gradient-to-br ${
                isCount ? 'from-gray-500/10 to-gray-600/5 border-gray-500/30' : metricColor(value as number)
              }`}
            >
              <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">{label}</div>
              <div className={`text-sm font-bold ${isCount ? 'text-gray-200' : metricTextColor(value as number)}`}>
                {isCount ? value : (value as number).toFixed(3)}
              </div>
            </div>
          ))}
        </div>
      )}

      {numClasses > 2 && (
        <div className="flex items-center gap-3 mb-2 px-1">
          <div className="rounded-lg border p-1.5 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border-indigo-500/40">
            <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider mr-2">Overall Accuracy</span>
            <span className={`text-sm font-bold ${metricTextColor(overallAccuracy)}`}>{overallAccuracy.toFixed(3)}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'matrix' && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-xs text-gray-400 mb-2 font-medium">
              Predicted {'\u2192'}
            </div>
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center justify-center" style={{ paddingTop: 24 }}>
                <div className="text-xs text-gray-400 font-medium writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  Actual {'\u2192'}
                </div>
              </div>
              <div>
                {/* Column headers */}
                <div className="flex" style={{ marginLeft: numClasses <= 3 ? 70 : 50 }}>
                  {classLabels.map((label, i) => (
                    <div
                      key={i}
                      className="text-[9px] text-gray-400 font-medium text-center"
                      style={{ width: numClasses <= 3 ? 64 : 44, marginRight: 2 }}
                    >
                      {numClasses <= 3 ? label : `C${i}`}
                    </div>
                  ))}
                </div>
                {/* Rows */}
                {matrix.map((row, i) => (
                  <div key={i} className="flex items-center gap-0.5 mb-0.5">
                    <div
                      className="text-[9px] text-gray-400 font-medium text-right pr-1"
                      style={{ width: numClasses <= 3 ? 68 : 48 }}
                    >
                      {numClasses <= 3 ? classLabels[i] : `C${i}`}
                    </div>
                    {row.map((val, j) => {
                      const intensity = maxVal > 0 ? val / maxVal : 0;
                      const isDiag = i === j;
                      const bg = isDiag
                        ? `rgba(34, 197, 94, ${0.15 + intensity * 0.6})`
                        : `rgba(239, 68, 68, ${0.1 + intensity * 0.5})`;
                      return (
                        <div
                          key={j}
                          className="flex items-center justify-center rounded-md font-bold text-xs border border-gray-700/50"
                          style={{
                            width: numClasses <= 3 ? 64 : 44,
                            height: numClasses <= 3 ? 44 : 34,
                            backgroundColor: bg,
                            color: isDiag ? '#4ade80' : '#f87171',
                          }}
                        >
                          {val}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {numClasses === 2 && (
              <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
                <span><span className="text-green-400 font-bold">Diagonal</span> = Correct predictions</span>
                <span><span className="text-red-400 font-bold">Off-diagonal</span> = Misclassifications</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roc' && numClasses === 2 && (
          <div className="h-full flex items-center justify-center">
            <canvas
              ref={rocCanvasRef}
              className="w-full max-w-lg rounded-lg border border-gray-700"
              style={{ height: 'min(100%, 400px)', maxHeight: 400 }}
            />
          </div>
        )}

        {activeTab === 'pr' && numClasses === 2 && (
          <div className="h-full flex items-center justify-center">
            <canvas
              ref={prCanvasRef}
              className="w-full max-w-lg rounded-lg border border-gray-700"
              style={{ height: 'min(100%, 400px)', maxHeight: 400 }}
            />
          </div>
        )}

        {activeTab === 'perclass' && (
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Class</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Precision</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Recall</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">F1-Score</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Support</th>
                </tr>
              </thead>
              <tbody>
                {perClassMetrics.map((m) => (
                  <tr key={m.label} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 px-3 text-gray-200 font-medium">{classLabels[m.label] || `Class ${m.label}`}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-mono font-bold ${metricTextColor(m.precision)}`}>{m.precision.toFixed(3)}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-mono font-bold ${metricTextColor(m.recall)}`}>{m.recall.toFixed(3)}</span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-mono font-bold ${metricTextColor(m.f1)}`}>{m.f1.toFixed(3)}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono">{m.support}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-600">
                  <td className="py-2 px-3 text-gray-200 font-bold">Macro Avg</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-indigo-400">
                    {(perClassMetrics.reduce((s, m) => s + m.precision, 0) / numClasses).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-indigo-400">
                    {(perClassMetrics.reduce((s, m) => s + m.recall, 0) / numClasses).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-indigo-400">
                    {(perClassMetrics.reduce((s, m) => s + m.f1, 0) / numClasses).toFixed(3)}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-300 font-mono">{samples.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
