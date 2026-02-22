import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DataPoint {
  x: number;
  y: number;
  label: number;
  set: 'train' | 'test' | 'val' | 'unassigned';
  fold?: number;
}

type SplitMode = 'random' | 'stratified';
type ViewMode = 'train-test' | 'train-val-test' | 'kfold';

const CLASS_COLORS: Record<number, { base: string; train: string; test: string; val: string }> = {
  0: { base: '#3b82f6', train: '#3b82f6', test: '#93c5fd', val: '#60a5fa' },
  1: { base: '#ef4444', train: '#ef4444', test: '#fca5a5', val: '#f87171' },
  2: { base: '#10b981', train: '#10b981', test: '#6ee7b7', val: '#34d399' },
};

const FOLD_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#a855f7'];

function generateData(numPoints: number, numClasses: number): DataPoint[] {
  const centers = [
    { x: 0.3, y: 0.3 },
    { x: 0.7, y: 0.7 },
    { x: 0.3, y: 0.7 },
  ];
  const pts: DataPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const cls = i % numClasses;
    const c = centers[cls];
    pts.push({
      x: c.x + (Math.random() - 0.5) * 0.35,
      y: c.y + (Math.random() - 0.5) * 0.35,
      label: cls,
      set: 'unassigned',
    });
  }
  return pts;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const TrainTestSplitVisualizer: React.FC = () => {
  const [numPoints, setNumPoints] = useState(80);
  const [numClasses, setNumClasses] = useState(2);
  const [trainRatio, setTrainRatio] = useState(0.7);
  const [valRatio, setValRatio] = useState(0.15);
  const [splitMode, setSplitMode] = useState<SplitMode>('random');
  const [viewMode, setViewMode] = useState<ViewMode>('train-test');
  const [kFolds, setKFolds] = useState(5);
  const [activeFold, setActiveFold] = useState(0);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animProgress, setAnimProgress] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Generate initial data
  useEffect(() => {
    setData(generateData(numPoints, numClasses));
  }, [numPoints, numClasses]);

  const performSplit = useCallback(() => {
    let newData = [...data].map(p => ({ ...p, set: 'unassigned' as const, fold: undefined }));

    if (viewMode === 'kfold') {
      // K-Fold cross validation
      if (splitMode === 'stratified') {
        // Stratified K-Fold
        const byClass: Record<number, number[]> = {};
        newData.forEach((p, i) => {
          if (!byClass[p.label]) byClass[p.label] = [];
          byClass[p.label].push(i);
        });
        Object.values(byClass).forEach(indices => {
          const shuffled = shuffleArray(indices);
          shuffled.forEach((idx, i) => {
            newData[idx].fold = i % kFolds;
          });
        });
      } else {
        const shuffledIndices = shuffleArray(Array.from({ length: newData.length }, (_, i) => i));
        shuffledIndices.forEach((idx, i) => {
          newData[idx].fold = i % kFolds;
        });
      }
      // Set active fold as test, rest as train
      newData = newData.map(p => ({
        ...p,
        set: p.fold === activeFold ? 'test' : 'train',
      }));
    } else {
      const testRatio = viewMode === 'train-val-test'
        ? 1 - trainRatio - valRatio
        : 1 - trainRatio;

      if (splitMode === 'stratified') {
        // Stratified split
        const byClass: Record<number, number[]> = {};
        newData.forEach((p, i) => {
          if (!byClass[p.label]) byClass[p.label] = [];
          byClass[p.label].push(i);
        });
        Object.values(byClass).forEach(indices => {
          const shuffled = shuffleArray(indices);
          const trainEnd = Math.round(shuffled.length * trainRatio);
          const valEnd = viewMode === 'train-val-test'
            ? Math.round(shuffled.length * (trainRatio + valRatio))
            : trainEnd;
          shuffled.forEach((idx, i) => {
            if (i < trainEnd) newData[idx].set = 'train';
            else if (viewMode === 'train-val-test' && i < valEnd) newData[idx].set = 'val';
            else newData[idx].set = 'test';
          });
        });
      } else {
        // Random split
        const shuffledIndices = shuffleArray(Array.from({ length: newData.length }, (_, i) => i));
        const trainEnd = Math.round(newData.length * trainRatio);
        const valEnd = viewMode === 'train-val-test'
          ? Math.round(newData.length * (trainRatio + valRatio))
          : trainEnd;
        shuffledIndices.forEach((idx, i) => {
          if (i < trainEnd) newData[idx].set = 'train';
          else if (viewMode === 'train-val-test' && i < valEnd) newData[idx].set = 'val';
          else newData[idx].set = 'test';
        });
      }
    }

    return newData;
  }, [data, trainRatio, valRatio, splitMode, viewMode, kFolds, activeFold]);

  const animateSplit = useCallback(() => {
    setIsAnimating(true);
    setAnimProgress(0);
    const newData = performSplit();
    const startTime = performance.now();
    const duration = 800;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out
      setAnimProgress(eased);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setData(newData);
        setIsAnimating(false);
        setAnimProgress(1);
      }
    };
    // Set data immediately for the animation to have target positions
    setData(newData);
    animRef.current = requestAnimationFrame(animate);
  }, [performSplit]);

  const resetData = () => {
    setData(generateData(numPoints, numClasses));
    setAnimProgress(1);
    setIsAnimating(false);
  };

  // Compute stats
  const trainCount = data.filter(p => p.set === 'train').length;
  const testCount = data.filter(p => p.set === 'test').length;
  const valCount = data.filter(p => p.set === 'val').length;
  const hasBeenSplit = data.some(p => p.set !== 'unassigned');

  const classBalance = useCallback((setFilter: string) => {
    const filtered = data.filter(p => p.set === setFilter);
    const counts: Record<number, number> = {};
    filtered.forEach(p => { counts[p.label] = (counts[p.label] || 0) + 1; });
    return counts;
  }, [data]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= w; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    for (let i = 0; i <= h; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }

    const pad = 25;
    const plotW = w - pad * 2;
    const plotH = h - pad * 2;

    if (viewMode === 'kfold' && hasBeenSplit) {
      // K-Fold visualization: draw fold sections
      const foldH = (plotH - 10) / kFolds;
      for (let f = 0; f < kFolds; f++) {
        const fy = pad + f * (foldH + 2);
        const isTestFold = f === activeFold;

        // Background rectangle
        ctx.fillStyle = isTestFold ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.08)';
        ctx.fillRect(pad, fy, plotW, foldH);
        ctx.strokeStyle = isTestFold ? '#ef4444' : '#1e40af';
        ctx.lineWidth = isTestFold ? 1.5 : 0.5;
        ctx.strokeRect(pad, fy, plotW, foldH);

        // Label
        ctx.fillStyle = isTestFold ? '#ef4444' : '#64748b';
        ctx.font = `${isTestFold ? 'bold ' : ''}9px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(isTestFold ? `Fold ${f + 1} (TEST)` : `Fold ${f + 1} (train)`, pad + 4, fy + 12);

        // Draw points in this fold
        const foldPoints = data.filter(p => p.fold === f);
        foldPoints.forEach((p, i) => {
          const px = pad + 60 + (i % 20) * ((plotW - 70) / 20);
          const py = fy + 18 + Math.floor(i / 20) * 10;
          if (py < fy + foldH - 2) {
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = isTestFold
              ? CLASS_COLORS[p.label]?.test || '#fca5a5'
              : CLASS_COLORS[p.label]?.train || '#3b82f6';
            ctx.globalAlpha = animProgress;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      }
    } else {
      // Regular train/test or train/val/test view
      data.forEach(p => {
        const px = pad + p.x * plotW;
        const py = pad + p.y * plotH;
        const r = p.set === 'unassigned' ? 4 : 5;

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);

        if (p.set === 'unassigned') {
          ctx.fillStyle = CLASS_COLORS[p.label]?.base || '#64748b';
          ctx.globalAlpha = 0.6;
        } else if (p.set === 'train') {
          ctx.fillStyle = CLASS_COLORS[p.label]?.train || '#3b82f6';
          ctx.globalAlpha = animProgress;
        } else if (p.set === 'test') {
          ctx.fillStyle = CLASS_COLORS[p.label]?.test || '#fca5a5';
          ctx.globalAlpha = animProgress;
        } else if (p.set === 'val') {
          ctx.fillStyle = CLASS_COLORS[p.label]?.val || '#60a5fa';
          ctx.globalAlpha = animProgress;
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.set === 'test') {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (p.set === 'val') {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // Legend
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(w - 120, 5, 115, viewMode === 'train-val-test' ? 52 : 38);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';

    if (viewMode === 'kfold') {
      ctx.beginPath(); ctx.arc(w - 110, 16, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Train fold', w - 102, 19);

      ctx.beginPath(); ctx.arc(w - 110, 30, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Test fold', w - 102, 33);
    } else {
      ctx.beginPath(); ctx.arc(w - 110, 16, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Train (${trainCount})`, w - 102, 19);

      ctx.beginPath(); ctx.arc(w - 110, 30, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#93c5fd'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`Test (${testCount})`, w - 102, 33);

      if (viewMode === 'train-val-test') {
        ctx.beginPath(); ctx.arc(w - 110, 44, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa'; ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(`Val (${valCount})`, w - 102, 47);
      }
    }
  }, [data, animProgress, viewMode, kFolds, activeFold, trainCount, testCount, valCount, hasBeenSplit]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const testRatio = viewMode === 'train-val-test'
    ? Math.max(0, 1 - trainRatio - valRatio)
    : 1 - trainRatio;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['train-test', 'train-val-test', 'kfold'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setData(prev => prev.map(p => ({ ...p, set: 'unassigned' as const, fold: undefined }))); }}
              className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {mode === 'train-test' ? 'Train/Test' : mode === 'train-val-test' ? 'Train/Val/Test' : 'K-Fold CV'}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['random', 'stratified'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setSplitMode(mode)}
              className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                splitMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {mode === 'random' ? 'Random' : 'Stratified'}
            </button>
          ))}
        </div>
        <button
          onClick={animateSplit}
          disabled={isAnimating}
          className="px-3 py-1 text-xs font-semibold bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
        >
          {isAnimating ? 'Splitting...' : 'Split'}
        </button>
        <button
          onClick={resetData}
          className="px-3 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Controls panel */}
        <div className="w-56 shrink-0 bg-white dark:bg-gray-800/80 rounded-xl p-3 border border-gray-200 dark:border-gray-700 overflow-auto space-y-4">
          {/* Data generation */}
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Data Generation</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-500 dark:text-gray-400">Points</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">{numPoints}</span>
                </div>
                <input type="range" min={20} max={200} step={10} value={numPoints}
                  onChange={e => setNumPoints(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-500" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-500 dark:text-gray-400">Classes</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400">{numClasses}</span>
                </div>
                <input type="range" min={2} max={3} step={1} value={numClasses}
                  onChange={e => setNumClasses(Number(e.target.value))}
                  className="w-full h-1.5 accent-cyan-500" />
              </div>
            </div>
          </div>

          {/* Split ratios */}
          {viewMode !== 'kfold' && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Split Ratio</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-500 dark:text-gray-400">Train</span>
                    <span className="font-mono text-blue-500">{(trainRatio * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0.1} max={0.9} step={0.05} value={trainRatio}
                    onChange={e => setTrainRatio(Number(e.target.value))}
                    className="w-full h-1.5 accent-blue-500" />
                </div>
                {viewMode === 'train-val-test' && (
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Validation</span>
                      <span className="font-mono text-amber-500">{(valRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min={0.05} max={0.4} step={0.05} value={valRatio}
                      onChange={e => setValRatio(Number(e.target.value))}
                      className="w-full h-1.5 accent-amber-500" />
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500 dark:text-gray-400">Test</span>
                  <span className="font-mono text-red-400">{(testRatio * 100).toFixed(0)}%</span>
                </div>
                {/* Visual ratio bar */}
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 transition-all" style={{ width: `${trainRatio * 100}%` }} />
                  {viewMode === 'train-val-test' && (
                    <div className="bg-amber-500 transition-all" style={{ width: `${valRatio * 100}%` }} />
                  )}
                  <div className="bg-red-400 flex-1" />
                </div>
                <div className="flex text-[8px] text-gray-400 gap-2">
                  <span className="text-blue-400">Train</span>
                  {viewMode === 'train-val-test' && <span className="text-amber-400">Val</span>}
                  <span className="text-red-400">Test</span>
                </div>
              </div>
            </div>
          )}

          {/* K-Fold controls */}
          {viewMode === 'kfold' && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">K-Fold Configuration</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-500 dark:text-gray-400">K (Folds)</span>
                    <span className="font-mono text-cyan-600 dark:text-cyan-400">{kFolds}</span>
                  </div>
                  <input type="range" min={2} max={10} step={1} value={kFolds}
                    onChange={e => setKFolds(Number(e.target.value))}
                    className="w-full h-1.5 accent-cyan-500" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-gray-500 dark:text-gray-400">Active Fold (test)</span>
                    <span className="font-mono text-red-400">{activeFold + 1}</span>
                  </div>
                  <input type="range" min={0} max={kFolds - 1} step={1} value={activeFold}
                    onChange={e => setActiveFold(Number(e.target.value))}
                    className="w-full h-1.5 accent-red-500" />
                </div>
                <div className="text-[9px] text-gray-400">
                  Each fold: ~{Math.round(numPoints / kFolds)} samples
                </div>
              </div>
            </div>
          )}

          {/* Set sizes */}
          {hasBeenSplit && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Set Sizes</h3>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300">Train</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-500">{trainCount} ({((trainCount / data.length) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-white" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300">Test</span>
                  </div>
                  <span className="text-[10px] font-mono text-red-400">{testCount} ({((testCount / data.length) * 100).toFixed(0)}%)</span>
                </div>
                {viewMode === 'train-val-test' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] text-gray-600 dark:text-gray-300">Val</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">{valCount} ({((valCount / data.length) * 100).toFixed(0)}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Class balance */}
          {hasBeenSplit && (
            <div>
              <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Class Balance</h3>
              <div className="space-y-2">
                {['train', 'test', ...(viewMode === 'train-val-test' ? ['val'] : [])].map(setName => {
                  const balance = classBalance(setName);
                  const total = Object.values(balance).reduce((s, v) => s + v, 0);
                  return (
                    <div key={setName}>
                      <div className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                        {setName}
                      </div>
                      <div className="h-2 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-700">
                        {Object.entries(balance).map(([cls, count]) => (
                          <div
                            key={cls}
                            className="h-full transition-all"
                            style={{
                              width: `${(count / total) * 100}%`,
                              backgroundColor: CLASS_COLORS[Number(cls)]?.base || '#64748b',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-0.5">
                        {Object.entries(balance).map(([cls, count]) => (
                          <span key={cls} className="text-[8px] text-gray-400">
                            C{cls}: {count} ({((count / total) * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-[9px] text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
            <p className="mb-1"><strong className="text-gray-500 dark:text-gray-300">Stratified:</strong> Maintains class proportions in each split</p>
            <p className="mb-1"><strong className="text-gray-500 dark:text-gray-300">Random:</strong> Splits without considering class distribution</p>
            <p><strong className="text-gray-500 dark:text-gray-300">K-Fold:</strong> Rotates test set through {kFolds} folds for robust evaluation</p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden border border-gray-700 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={450}
            height={400}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};
