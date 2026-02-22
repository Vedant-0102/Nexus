import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface Feature {
  name: string;
  values: number[];
  enabled: boolean;
}

interface Dataset {
  features: Feature[];
  target: number[];
  targetName: string;
}

function generateHousingDataset(): Dataset {
  const n = 100;
  const rng = seededRandom(42);

  const sqft: number[] = [];
  const bedrooms: number[] = [];
  const age: number[] = [];
  const locationScore: number[] = [];
  const bathrooms: number[] = [];
  const garageSize: number[] = [];
  const lotSize: number[] = [];
  const target: number[] = [];

  for (let i = 0; i < n; i++) {
    const sf = 800 + rng() * 3200;
    const bed = Math.floor(1 + rng() * 5);
    const ag = Math.floor(rng() * 60);
    const loc = 1 + rng() * 9;
    const bath = Math.floor(1 + rng() * 3);
    const gar = Math.floor(rng() * 3);
    const lot = 2000 + rng() * 8000;

    sqft.push(sf);
    bedrooms.push(bed);
    age.push(ag);
    locationScore.push(loc);
    bathrooms.push(bath);
    garageSize.push(gar);
    lotSize.push(lot);

    // Price generated with known weights + noise
    const price =
      sf * 120 +
      bed * 15000 +
      (-ag * 1500) +
      loc * 25000 +
      bath * 10000 +
      gar * 8000 +
      lot * 5 +
      (rng() - 0.5) * 40000;
    target.push(price);
  }

  return {
    features: [
      { name: 'Sq Footage', values: sqft, enabled: true },
      { name: 'Bedrooms', values: bedrooms, enabled: true },
      { name: 'Age (years)', values: age, enabled: true },
      { name: 'Location Score', values: locationScore, enabled: true },
      { name: 'Bathrooms', values: bathrooms, enabled: true },
      { name: 'Garage Size', values: garageSize, enabled: true },
      { name: 'Lot Size', values: lotSize, enabled: true },
    ],
    target,
    targetName: 'Price ($)',
  };
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function std(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

function correlation(a: number[], b: number[]): number {
  const n = a.length;
  const mA = mean(a);
  const mB = mean(b);
  const sA = std(a);
  const sB = std(b);
  if (sA === 0 || sB === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += (a[i] - mA) * (b[i] - mB);
  }
  return sum / (n * sA * sB);
}

function normalize(arr: number[]): number[] {
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return arr.map(() => 0);
  return arr.map((v) => (v - m) / s);
}

function simpleLinearR2(features: Feature[], target: number[]): number {
  const enabledFeatures = features.filter((f) => f.enabled);
  if (enabledFeatures.length === 0) return 0;

  const n = target.length;
  const normTarget = normalize(target);
  const normFeatures = enabledFeatures.map((f) => normalize(f.values));

  // Simple prediction: weighted sum by correlations
  const corrs = normFeatures.map((nf) => correlation(nf, normTarget));
  const totalCorrAbs = corrs.reduce((s, c) => s + Math.abs(c), 0) || 1;
  const weights = corrs.map((c) => c / totalCorrAbs);

  const predictions: number[] = Array(n).fill(0);
  for (let j = 0; j < normFeatures.length; j++) {
    for (let i = 0; i < n; i++) {
      predictions[i] += weights[j] * normFeatures[j][i];
    }
  }

  const mPred = mean(predictions);
  const ssRes = predictions.reduce((s, p, i) => s + (normTarget[i] - p) ** 2, 0);
  const ssTot = normTarget.reduce((s, v) => s + (v - mean(normTarget)) ** 2, 0);
  return Math.max(0, 1 - ssRes / (ssTot || 1));
}

function permutationImportance(features: Feature[], target: number[]): number[] {
  const baseR2 = simpleLinearR2(features, target);
  const rng = seededRandom(123);
  return features.map((feat, idx) => {
    if (!feat.enabled) return 0;
    // Shuffle this feature's values
    const shuffled = [...feat.values];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const modFeatures = features.map((f, fi) =>
      fi === idx ? { ...f, values: shuffled } : f
    );
    const permR2 = simpleLinearR2(modFeatures, target);
    return Math.max(0, baseR2 - permR2);
  });
}

function drawBarChart(
  canvas: HTMLCanvasElement,
  names: string[],
  values: number[],
  colors: string[],
  title: string
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

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  const pad = { top: 25, right: 20, bottom: 10, left: 90 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;
  const barH = Math.min(22, (ph - (names.length - 1) * 3) / names.length);
  const maxVal = Math.max(...values, 0.01);

  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (i / 5) * pw;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ph); ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(((i / 5) * maxVal).toFixed(3), x, pad.top - 5);
  }

  // Bars
  const sorted = names.map((name, i) => ({ name, value: values[i], color: colors[i] }))
    .sort((a, b) => b.value - a.value);

  sorted.forEach(({ name, value, color }, i) => {
    const y = pad.top + i * (barH + 3);
    const barW = (value / maxVal) * pw;

    // Bar
    const gradient = ctx.createLinearGradient(pad.left, y, pad.left + barW, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color + '80');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(pad.left, y, barW, barH, 3);
    ctx.fill();

    // Label
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(name, pad.left - 5, y + barH / 2 + 3);

    // Value
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 9px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(value.toFixed(4), pad.left + barW + 4, y + barH / 2 + 3);
  });

  // Title
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(title, w / 2, 14);
}

function drawHeatmap(
  canvas: HTMLCanvasElement,
  matrix: number[][],
  labels: string[]
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

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, w, h);

  const n = labels.length;
  const pad = { top: 50, right: 15, bottom: 15, left: 80 };
  const cellW = (w - pad.left - pad.right) / n;
  const cellH = (h - pad.top - pad.bottom) / n;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const val = matrix[i][j];
      const x = pad.left + j * cellW;
      const y = pad.top + i * cellH;

      // Color: blue for negative, red for positive
      let r: number, g: number, b: number;
      if (val >= 0) {
        r = Math.floor(30 + val * 200);
        g = Math.floor(30 + val * 60);
        b = 30;
      } else {
        r = 30;
        g = Math.floor(30 + Math.abs(val) * 60);
        b = Math.floor(30 + Math.abs(val) * 200);
      }
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      // Value text
      ctx.fillStyle = Math.abs(val) > 0.5 ? '#fff' : '#9ca3af';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(2), x + cellW / 2, y + cellH / 2);
    }
  }

  // Column labels (top, rotated)
  ctx.fillStyle = '#d1d5db';
  ctx.font = '9px system-ui';
  labels.forEach((label, i) => {
    const x = pad.left + i * cellW + cellW / 2;
    ctx.save();
    ctx.translate(x, pad.top - 5);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = 'left';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Row labels (left)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  labels.forEach((label, i) => {
    const y = pad.top + i * cellH + cellH / 2;
    ctx.fillText(label, pad.left - 5, y);
  });

  // Title
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 11px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Feature Correlation Heatmap', w / 2, 5);

  // Color scale
  const scaleW = 80;
  const scaleH = 8;
  const scaleX = w - pad.right - scaleW;
  const scaleY = 8;
  const gradient = ctx.createLinearGradient(scaleX, scaleY, scaleX + scaleW, scaleY);
  gradient.addColorStop(0, 'rgb(30,30,230)');
  gradient.addColorStop(0.5, 'rgb(30,30,30)');
  gradient.addColorStop(1, 'rgb(230,30,30)');
  ctx.fillStyle = gradient;
  ctx.fillRect(scaleX, scaleY, scaleW, scaleH);
  ctx.fillStyle = '#9ca3af';
  ctx.font = '8px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('-1', scaleX, scaleY + scaleH + 8);
  ctx.textAlign = 'center';
  ctx.fillText('0', scaleX + scaleW / 2, scaleY + scaleH + 8);
  ctx.textAlign = 'right';
  ctx.fillText('+1', scaleX + scaleW, scaleY + scaleH + 8);
}

const featureColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4',
];

export const FeatureImportanceVisualizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'importance' | 'permutation' | 'heatmap' | 'selection'>('importance');
  const [dataset] = useState<Dataset>(() => generateHousingDataset());
  const [featureToggles, setFeatureToggles] = useState<boolean[]>(() => dataset.features.map(() => true));

  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const permCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);

  const features = useMemo(() =>
    dataset.features.map((f, i) => ({ ...f, enabled: featureToggles[i] })),
    [dataset.features, featureToggles]
  );

  // Correlation-based importance
  const corrImportance = useMemo(() =>
    features.map((f) => Math.abs(correlation(f.values, dataset.target))),
    [features, dataset.target]
  );

  // Permutation importance
  const permImportance = useMemo(() =>
    permutationImportance(features, dataset.target),
    [features, dataset.target]
  );

  // Correlation matrix
  const corrMatrix = useMemo(() => {
    const allVals = [...features.map((f) => f.values), dataset.target];
    const n = allVals.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(correlation(allVals[i], allVals[j]));
      }
      matrix.push(row);
    }
    return matrix;
  }, [features, dataset.target]);

  const corrLabels = useMemo(() =>
    [...features.map((f) => f.name), dataset.targetName],
    [features, dataset.targetName]
  );

  // Model R2 with current selection
  const currentR2 = useMemo(() =>
    simpleLinearR2(features, dataset.target),
    [features, dataset.target]
  );

  // Draw canvases
  useEffect(() => {
    if (activeTab === 'importance' && barCanvasRef.current) {
      drawBarChart(
        barCanvasRef.current,
        features.map((f) => f.name),
        corrImportance,
        featureColors,
        'Correlation-Based Feature Importance'
      );
    }
  }, [activeTab, features, corrImportance]);

  useEffect(() => {
    if (activeTab === 'permutation' && permCanvasRef.current) {
      drawBarChart(
        permCanvasRef.current,
        features.map((f) => f.name),
        permImportance,
        featureColors,
        'Permutation Feature Importance'
      );
    }
  }, [activeTab, features, permImportance]);

  useEffect(() => {
    if (activeTab === 'heatmap' && heatmapCanvasRef.current) {
      drawHeatmap(heatmapCanvasRef.current, corrMatrix, corrLabels);
    }
  }, [activeTab, corrMatrix, corrLabels]);

  const toggleFeature = (idx: number) => {
    setFeatureToggles((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Engineering suggestions
  const suggestions = useMemo(() => {
    const suggs: string[] = [];
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const c = Math.abs(corrMatrix[i][j]);
        if (c > 0.7) {
          suggs.push(
            `"${features[i].name}" and "${features[j].name}" are highly correlated (${corrMatrix[i][j].toFixed(2)}). Consider combining them or removing one to reduce multicollinearity.`
          );
        }
      }
      if (Math.abs(corrImportance[i]) < 0.1) {
        suggs.push(
          `"${features[i].name}" has very low target correlation (${corrImportance[i].toFixed(3)}). Consider polynomial or interaction features to capture non-linear relationships.`
        );
      }
    }
    if (suggs.length === 0) {
      suggs.push('Features show reasonable independence and correlation with the target. The current feature set appears well-suited for linear modeling.');
    }
    return suggs;
  }, [features, corrMatrix, corrImportance]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-2 w-fit">
        {(['importance', 'permutation', 'heatmap', 'selection'] as const).map((tab) => {
          const labels: Record<string, string> = {
            importance: 'Correlation Importance',
            permutation: 'Permutation Importance',
            heatmap: 'Correlation Heatmap',
            selection: 'Feature Selection',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Feature toggles (always visible) */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {features.map((f, i) => (
          <button
            key={f.name}
            onClick={() => toggleFeature(i)}
            className={`px-2 py-0.5 text-[10px] rounded-full font-medium border transition-colors ${
              featureToggles[i]
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-gray-600 bg-gray-800 text-gray-500 line-through'
            }`}
          >
            {f.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Model R{'\u00B2'}:</span>
          <span className={`text-xs font-bold ${currentR2 > 0.7 ? 'text-emerald-400' : currentR2 > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
            {currentR2.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'importance' && (
          <div className="h-full flex flex-col">
            <canvas
              ref={barCanvasRef}
              className="w-full flex-1 rounded-lg border border-gray-700"
            />
            <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
              Correlation-based importance measures the absolute Pearson correlation between each feature and the target variable.
              Higher values indicate a stronger linear relationship.
            </div>
          </div>
        )}

        {activeTab === 'permutation' && (
          <div className="h-full flex flex-col">
            <canvas
              ref={permCanvasRef}
              className="w-full flex-1 rounded-lg border border-gray-700"
            />
            <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
              Permutation importance measures the drop in model performance (R{'\u00B2'}) when each feature's values are randomly shuffled.
              Higher values indicate the model relies more on that feature.
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="h-full flex flex-col">
            <canvas
              ref={heatmapCanvasRef}
              className="w-full flex-1 rounded-lg border border-gray-700"
              style={{ minHeight: 300 }}
            />
            <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
              The heatmap shows Pearson correlation coefficients between all pairs of features and the target.
              Red = positive correlation, Blue = negative correlation, Dark = no correlation.
            </div>
          </div>
        )}

        {activeTab === 'selection' && (
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-200 mb-2">Feature Impact Analysis</h3>
              <div className="space-y-1.5">
                {features.map((f, i) => {
                  const imp = corrImportance[i];
                  const perm = permImportance[i];
                  return (
                    <div key={f.name} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFeature(i)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] ${
                          featureToggles[i]
                            ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                            : 'bg-gray-700 border-gray-600 text-gray-500'
                        }`}
                      >
                        {featureToggles[i] ? '\u2713' : ''}
                      </button>
                      <span className="text-xs text-gray-300 w-24 flex-shrink-0">{f.name}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, imp * 100)}%`,
                              backgroundColor: featureColors[i],
                              opacity: featureToggles[i] ? 1 : 0.3,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 w-12 text-right">
                          corr: {imp.toFixed(3)}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 w-14 text-right">
                          perm: {perm.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <h3 className="text-xs font-bold text-gray-200 mb-2">Feature Engineering Suggestions</h3>
              <ul className="space-y-1.5">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-[10px] text-gray-400 leading-relaxed flex gap-1.5">
                    <span className="text-amber-400 flex-shrink-0">{'\u2022'}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
                <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Active Features</div>
                <div className="text-lg font-bold text-emerald-400">
                  {featureToggles.filter(Boolean).length} / {features.length}
                </div>
              </div>
              <div className="rounded-lg border p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
                <div className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Model R{'\u00B2'} Score</div>
                <div className={`text-lg font-bold ${currentR2 > 0.7 ? 'text-emerald-400' : currentR2 > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {currentR2.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
