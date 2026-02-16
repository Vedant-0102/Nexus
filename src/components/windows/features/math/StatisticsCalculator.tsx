import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  sorted: number[];
}

export const StatisticsCalculator = () => {
  const [dataSet, setDataSet] = useState('2, 4, 4, 4, 5, 5, 7, 9');
  const [population, setPopulation] = useState(false);
  const [statsResult, setStatsResult] = useState<StatsResult | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getQuartile = (sorted: number[], q: number): number => {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  const getMode = (numbers: number[]): number[] => {
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    for (const n of numbers) {
      freq[n] = (freq[n] || 0) + 1;
      if (freq[n] > maxFreq) maxFreq = freq[n];
    }
    if (maxFreq === 1) return [];
    return Object.entries(freq)
      .filter(([, count]) => count === maxFreq)
      .map(([val]) => parseFloat(val));
  };

  const calculateStats = () => {
    setError('');
    const numbers = dataSet
      .split(/[,\s]+/)
      .map(n => parseFloat(n.trim()))
      .filter(n => !isNaN(n));

    if (numbers.length === 0) {
      setError('Please enter valid numbers separated by commas.');
      setStatsResult(null);
      return;
    }

    if (numbers.length < 2) {
      setError('Enter at least 2 data points.');
      setStatsResult(null);
      return;
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);

    const median = numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)];

    const n = numbers.length;
    const divisor = population ? n : n - 1;
    const variance = numbers.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / divisor;
    const stdDev = Math.sqrt(variance);

    const q1 = getQuartile(sorted, 0.25);
    const q3 = getQuartile(sorted, 0.75);

    const skewness = n >= 3
      ? (n / ((n - 1) * (n - 2))) * numbers.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0)
      : 0;

    setStatsResult({
      count: n,
      sum,
      mean,
      median,
      mode: getMode(numbers),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      range: sorted[sorted.length - 1] - sorted[0],
      variance,
      stdDev,
      q1,
      q3,
      iqr: q3 - q1,
      skewness,
      sorted,
    });
  };

  useEffect(() => {
    if (!statsResult || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const { sorted, min, max, q1, median, q3 } = statsResult;

    // Histogram
    const bucketCount = Math.min(Math.max(Math.ceil(Math.sqrt(sorted.length)), 4), 15);
    const range = max - min || 1;
    const bucketWidth = range / bucketCount;
    const buckets = new Array(bucketCount).fill(0);
    for (const v of sorted) {
      let idx = Math.floor((v - min) / bucketWidth);
      if (idx >= bucketCount) idx = bucketCount - 1;
      buckets[idx]++;
    }
    const maxBucket = Math.max(...buckets, 1);

    const pad = { top: 20, right: 15, bottom: 55, left: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = (H / 2) - pad.top - 10;
    const barW = chartW / bucketCount;

    // Histogram bars
    for (let i = 0; i < bucketCount; i++) {
      const barH = (buckets[i] / maxBucket) * chartH;
      const x = pad.left + i * barW;
      const y = pad.top + chartH - barH;
      ctx.fillStyle = '#818cf8';
      ctx.fillRect(x + 1, y, barW - 2, barH);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(x + 1, y, barW - 2, 2);
    }

    // Histogram labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= bucketCount; i++) {
      const val = min + i * bucketWidth;
      const x = pad.left + i * barW;
      ctx.fillText(val.toFixed(1), x, pad.top + chartH + 12);
    }

    // Box plot
    const boxY = H / 2 + 20;
    const boxH = 30;
    const mapX = (v: number) => pad.left + ((v - min) / range) * chartW;

    // Whiskers
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    const minX = mapX(min);
    const maxX = mapX(max);
    const q1X = mapX(q1);
    const q3X = mapX(q3);
    const medX = mapX(median);

    // Whisker lines
    ctx.beginPath();
    ctx.moveTo(minX, boxY + boxH / 2);
    ctx.lineTo(q1X, boxY + boxH / 2);
    ctx.moveTo(q3X, boxY + boxH / 2);
    ctx.lineTo(maxX, boxY + boxH / 2);
    ctx.stroke();

    // Min/Max caps
    ctx.beginPath();
    ctx.moveTo(minX, boxY + 5);
    ctx.lineTo(minX, boxY + boxH - 5);
    ctx.moveTo(maxX, boxY + 5);
    ctx.lineTo(maxX, boxY + boxH - 5);
    ctx.stroke();

    // IQR box
    ctx.fillStyle = '#c7d2fe';
    ctx.fillRect(q1X, boxY, q3X - q1X, boxH);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(q1X, boxY, q3X - q1X, boxH);

    // Median line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(medX, boxY);
    ctx.lineTo(medX, boxY + boxH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Min ${min.toFixed(1)}`, minX, boxY + boxH + 14);
    ctx.fillText(`Q1 ${q1.toFixed(1)}`, q1X, boxY + boxH + 14);
    ctx.fillStyle = '#dc2626';
    ctx.fillText(`Med ${median.toFixed(1)}`, medX, boxY - 5);
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Q3 ${q3.toFixed(1)}`, q3X, boxY + boxH + 14);
    ctx.fillText(`Max ${max.toFixed(1)}`, maxX, boxY + boxH + 14);
  }, [statsResult]);

  const presets = [
    { label: 'Grades', data: '72, 85, 90, 78, 95, 88, 76, 92, 83, 70, 88, 91, 85, 79, 94' },
    { label: 'Dice Rolls', data: '1, 3, 4, 2, 6, 5, 3, 4, 2, 6, 1, 5, 4, 3, 3, 2, 5, 6, 4, 1' },
    { label: 'Heights (cm)', data: '160, 165, 170, 155, 175, 180, 168, 172, 158, 163, 177, 169' },
    { label: 'Temperatures', data: '20.5, 22.1, 19.8, 23.4, 21.0, 18.5, 24.2, 20.9, 22.7, 19.3' },
  ];

  const fmt = (n: number) => {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <h1 className="text-2xl font-bold dark:text-white mb-4">Statistics Calculator</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-lg font-bold mb-3 dark:text-white">Data Input</h3>

          <div className="space-y-3">
            <div>
              <Label>Data Set (comma or space separated)</Label>
              <Input
                value={dataSet}
                onChange={(e) => setDataSet(e.target.value)}
                placeholder="1, 2, 3, 4, 5"
                onKeyDown={(e) => e.key === 'Enter' && calculateStats()}
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm dark:text-gray-300">
                <input
                  type="radio"
                  checked={!population}
                  onChange={() => setPopulation(false)}
                  className="accent-purple-500"
                />
                Sample
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm dark:text-gray-300">
                <input
                  type="radio"
                  checked={population}
                  onChange={() => setPopulation(true)}
                  className="accent-purple-500"
                />
                Population
              </label>
            </div>

            <Button onClick={calculateStats} className="w-full">
              Calculate Statistics
            </Button>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Presets:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setDataSet(p.data)}
                    className="text-xs px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6 dark:bg-gray-800">
          <h3 className="text-lg font-bold mb-3 dark:text-white">Results</h3>
          {statsResult ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Count', value: statsResult.count, bg: 'bg-blue-50 dark:bg-blue-900/30' },
                  { label: 'Sum', value: fmt(statsResult.sum), bg: 'bg-green-50 dark:bg-green-900/30' },
                  { label: 'Mean', value: fmt(statsResult.mean), bg: 'bg-purple-50 dark:bg-purple-900/30' },
                  { label: 'Median', value: fmt(statsResult.median), bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
                  { label: 'Mode', value: statsResult.mode.length > 0 ? statsResult.mode.map(fmt).join(', ') : 'None', bg: 'bg-pink-50 dark:bg-pink-900/30' },
                  { label: 'Range', value: fmt(statsResult.range), bg: 'bg-orange-50 dark:bg-orange-900/30' },
                  { label: 'Q1', value: fmt(statsResult.q1), bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
                  { label: 'Q3', value: fmt(statsResult.q3), bg: 'bg-teal-50 dark:bg-teal-900/30' },
                  { label: 'IQR', value: fmt(statsResult.iqr), bg: 'bg-lime-50 dark:bg-lime-900/30' },
                  { label: `Variance (${population ? 'Pop' : 'Sample'})`, value: fmt(statsResult.variance), bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                  { label: `Std Dev (${population ? 'Pop' : 'Sample'})`, value: fmt(statsResult.stdDev), bg: 'bg-red-50 dark:bg-red-900/30' },
                  { label: 'Skewness', value: fmt(statsResult.skewness), bg: 'bg-violet-50 dark:bg-violet-900/30' },
                ].map(({ label, value, bg }) => (
                  <div key={label} className={`p-2 ${bg} rounded`}>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
                    <p className="text-sm font-bold dark:text-white truncate">{value}</p>
                  </div>
                ))}
              </div>

              {/* Min/Max */}
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-red-50 dark:bg-red-900/30 rounded">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Min</p>
                  <p className="text-sm font-bold dark:text-white">{fmt(statsResult.min)}</p>
                </div>
                <div className="flex-1 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Max</p>
                  <p className="text-sm font-bold dark:text-white">{fmt(statsResult.max)}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-2">
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Enter data and click calculate</p>
          )}
        </Card>
      </div>
    </div>
  );
};
