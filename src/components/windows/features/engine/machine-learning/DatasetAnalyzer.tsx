import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical';
  count: number;
  missing: number;
  unique: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  q25?: number;
  q50?: number;
  q75?: number;
  valueCounts?: Record<string, number>;
}

type DatasetName = 'iris' | 'wine' | 'housing' | 'custom';

const SAMPLE_DATASETS: Record<Exclude<DatasetName, 'custom'>, string> = {
  iris: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
5.0,3.6,1.4,0.2,setosa
5.4,3.9,1.7,0.4,setosa
4.6,3.4,1.4,0.3,setosa
5.0,3.4,1.5,0.2,setosa
4.4,2.9,1.4,0.2,setosa
4.9,3.1,1.5,0.1,setosa
5.4,3.7,1.5,0.2,setosa
4.8,3.4,1.6,0.2,setosa
4.8,3.0,1.4,0.1,setosa
4.3,3.0,1.1,0.1,setosa
5.8,4.0,1.2,0.2,setosa
5.7,4.4,1.5,0.4,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
5.7,2.8,4.5,1.3,versicolor
6.3,3.3,4.7,1.6,versicolor
4.9,2.4,3.3,1.0,versicolor
6.6,2.9,4.6,1.3,versicolor
5.2,2.7,3.9,1.4,versicolor
5.0,2.0,3.5,1.0,versicolor
5.9,3.0,4.2,1.5,versicolor
6.0,2.2,4.0,1.0,versicolor
6.1,2.9,4.7,1.4,versicolor
5.6,2.9,3.6,1.3,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica
7.6,3.0,6.6,2.1,virginica
4.9,2.5,4.5,1.7,virginica
7.3,2.9,6.3,1.8,virginica
6.7,2.5,5.8,1.8,virginica
7.2,3.6,6.1,2.5,virginica
6.5,3.2,5.1,2.0,virginica
6.4,2.7,5.3,1.9,virginica
6.8,3.0,5.5,2.1,virginica
5.7,2.5,5.0,2.0,virginica
5.8,2.8,5.1,2.4,virginica`,
  wine: `alcohol,malic_acid,ash,alcalinity,magnesium,phenols,flavanoids,color_intensity,hue,proline,class
14.23,1.71,2.43,15.6,127,2.8,3.06,5.64,1.04,1065,A
13.2,1.78,2.14,11.2,100,2.65,2.76,2.44,1.14,1021,A
13.16,2.36,2.67,18.6,101,2.8,3.24,2.41,1.03,1220,A
14.37,1.95,2.5,16.8,113,3.85,3.49,3.3,0.86,1065,A
13.24,2.59,2.87,21.0,118,2.8,2.69,3.92,1.04,735,A
12.37,0.94,1.36,10.6,88,1.98,0.57,2.48,0.53,440,B
12.33,1.1,2.28,16.0,101,2.05,1.09,5.0,0.56,490,B
12.64,1.36,2.02,16.8,100,2.02,1.41,4.09,0.61,560,B
13.67,1.25,1.92,18.0,94,2.04,0.76,5.32,0.56,820,B
12.37,1.63,2.12,19.5,88,1.87,0.72,5.39,0.67,680,B
12.17,1.45,2.53,19.0,104,1.89,0.85,6.32,0.51,468,B
12.37,1.07,2.1,18.5,88,3.52,3.75,2.85,0.64,566,B
13.11,1.01,1.7,15.0,78,2.21,1.48,4.4,0.47,480,B
13.49,1.66,2.24,14.5,132,3.25,3.49,2.01,1.02,750,C
12.82,3.37,2.3,19.5,88,1.48,0.66,4.69,0.41,348,C
13.58,2.58,2.69,24.5,105,1.55,0.84,3.83,0.57,428,C
13.4,3.91,2.48,23.0,102,1.8,0.75,3.43,0.94,346,C
12.2,3.03,2.32,19.0,96,1.25,0.49,3.29,0.38,310,C
12.77,2.39,2.28,19.5,86,1.39,0.51,3.55,0.43,388,C
14.16,1.61,2.51,22.5,108,1.59,0.63,3.89,0.48,502,C`,
  housing: `rooms,age,distance,tax_rate,pupil_ratio,price,area
6.575,65.2,4.09,296,15.3,24.0,urban
6.421,78.9,4.97,296,17.8,21.6,urban
7.185,61.1,4.97,296,17.8,34.7,urban
6.998,45.8,6.06,296,17.8,33.4,suburban
7.147,54.2,6.06,296,17.8,36.2,suburban
6.43,58.7,6.06,296,17.8,28.7,suburban
6.012,66.6,5.56,311,15.2,22.9,urban
6.172,96.1,5.95,311,15.2,27.1,urban
5.631,100.0,6.08,311,15.2,16.5,rural
6.004,85.9,6.59,311,15.2,18.9,rural
6.377,94.3,6.34,311,15.2,15.0,rural
6.009,82.9,6.23,311,15.2,18.2,rural
5.889,39.0,5.45,311,15.2,20.4,suburban
5.949,61.8,2.12,226,17.6,19.9,urban
6.096,84.5,2.87,226,17.6,23.1,urban
5.834,56.5,2.78,226,17.6,17.5,suburban
5.935,69.1,2.97,226,17.6,20.2,suburban
5.99,76.7,2.87,226,17.6,18.2,urban
5.456,36.6,3.80,307,21.0,13.6,rural
5.727,69.5,3.47,307,21.0,19.6,rural`,
};

function parseCSV(csv: string): { headers: string[]; rows: string[][] } {
  const lines = csv.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
  return { headers, rows };
}

function isNumeric(val: string): boolean {
  if (val === '' || val === 'NA' || val === 'null' || val === 'NaN') return false;
  return !isNaN(Number(val));
}

function computeStats(headers: string[], rows: string[][]): ColumnStats[] {
  return headers.map((name, ci) => {
    const values = rows.map(r => r[ci] ?? '');
    const missing = values.filter(v => v === '' || v === 'NA' || v === 'null' || v === 'NaN').length;
    const nonMissing = values.filter(v => v !== '' && v !== 'NA' && v !== 'null' && v !== 'NaN');
    const numericVals = nonMissing.filter(isNumeric).map(Number);
    const isNum = numericVals.length > nonMissing.length * 0.7 && numericVals.length > 0;

    if (isNum) {
      const sorted = [...numericVals].sort((a, b) => a - b);
      const n = sorted.length;
      const mean = sorted.reduce((s, v) => s + v, 0) / n;
      const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
      const std = Math.sqrt(variance);
      const q = (p: number) => {
        const idx = p * (n - 1);
        const lo = Math.floor(idx);
        const hi = Math.ceil(idx);
        const frac = idx - lo;
        return sorted[lo] * (1 - frac) + (sorted[hi] ?? sorted[lo]) * frac;
      };
      return {
        name, type: 'numeric' as const, count: n, missing,
        unique: new Set(numericVals).size,
        mean, std, min: sorted[0], max: sorted[n - 1],
        q25: q(0.25), q50: q(0.5), q75: q(0.75),
      };
    } else {
      const counts: Record<string, number> = {};
      nonMissing.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      return {
        name, type: 'categorical' as const, count: nonMissing.length, missing,
        unique: Object.keys(counts).length, valueCounts: counts,
      };
    }
  });
}

export const DatasetAnalyzer: React.FC = () => {
  const [datasetName, setDatasetName] = useState<DatasetName>('iris');
  const [csvText, setCsvText] = useState(SAMPLE_DATASETS.iris);
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [selectedHistCol, setSelectedHistCol] = useState('');
  const [scatterX, setScatterX] = useState('');
  const [scatterY, setScatterY] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'stats' | 'histogram' | 'scatter' | 'missing'>('preview');
  const histCanvasRef = useRef<HTMLCanvasElement>(null);
  const scatterCanvasRef = useRef<HTMLCanvasElement>(null);

  // Parse CSV whenever text changes
  useEffect(() => {
    const { headers, rows } = parseCSV(csvText);
    setParsedData({ headers, rows });
    const stats = computeStats(headers, rows);
    setColumnStats(stats);
    const numericCols = stats.filter(s => s.type === 'numeric');
    if (numericCols.length > 0 && !selectedHistCol) {
      setSelectedHistCol(numericCols[0].name);
    }
    if (numericCols.length >= 2 && !scatterX) {
      setScatterX(numericCols[0].name);
      setScatterY(numericCols[1].name);
    }
  }, [csvText]);

  const numericColumns = useMemo(() => columnStats.filter(s => s.type === 'numeric'), [columnStats]);
  const categoricalColumns = useMemo(() => columnStats.filter(s => s.type === 'categorical'), [columnStats]);

  const loadSampleDataset = (name: Exclude<DatasetName, 'custom'>) => {
    setDatasetName(name);
    setCsvText(SAMPLE_DATASETS[name]);
    setSelectedHistCol('');
    setScatterX('');
    setScatterY('');
  };

  // Draw histogram
  const drawHistogram = useCallback(() => {
    const canvas = histCanvasRef.current;
    if (!canvas || !selectedHistCol) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const colIdx = parsedData.headers.indexOf(selectedHistCol);
    if (colIdx === -1) return;
    const values = parsedData.rows.map(r => r[colIdx]).filter(isNumeric).map(Number);
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const numBins = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(values.length))));
    const binWidth = range / numBins;
    const bins: number[] = new Array(numBins).fill(0);
    values.forEach(v => {
      let bi = Math.floor((v - min) / binWidth);
      if (bi >= numBins) bi = numBins - 1;
      bins[bi]++;
    });
    const maxBin = Math.max(...bins);
    const pad = { top: 25, bottom: 35, left: 45, right: 15 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const barW = plotW / numBins - 2;

    // Y-axis grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxBin * (1 - i / 4)).toString(), pad.left - 5, y + 3);
    }

    // Bars
    bins.forEach((count, i) => {
      const barH = (count / maxBin) * plotH;
      const x = pad.left + i * (plotW / numBins) + 1;
      const y = pad.top + plotH - barH;
      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#4f46e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barW, barH);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, barW, barH);

      // X labels
      if (i % Math.ceil(numBins / 8) === 0 || i === numBins - 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText((min + i * binWidth).toFixed(1), x + barW / 2, h - pad.bottom + 12);
      }
    });

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Distribution of ${selectedHistCol}`, w / 2, 15);

    // Stats annotation
    const stat = columnStats.find(s => s.name === selectedHistCol);
    if (stat && stat.mean !== undefined) {
      const meanX = pad.left + ((stat.mean - min) / range) * plotW;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(meanX, pad.top);
      ctx.lineTo(meanX, pad.top + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`mean=${stat.mean.toFixed(2)}`, meanX + 3, pad.top + 10);
    }
  }, [selectedHistCol, parsedData, columnStats]);

  // Draw scatter plot
  const drawScatter = useCallback(() => {
    const canvas = scatterCanvasRef.current;
    if (!canvas || !scatterX || !scatterY) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    const xi = parsedData.headers.indexOf(scatterX);
    const yi = parsedData.headers.indexOf(scatterY);
    if (xi === -1 || yi === -1) return;

    const points: { px: number; py: number; cat?: string }[] = [];
    const catCol = categoricalColumns.length > 0 ? categoricalColumns[0] : null;
    const catIdx = catCol ? parsedData.headers.indexOf(catCol.name) : -1;

    parsedData.rows.forEach(r => {
      const xv = Number(r[xi]);
      const yv = Number(r[yi]);
      if (!isNaN(xv) && !isNaN(yv)) {
        points.push({ px: xv, py: yv, cat: catIdx >= 0 ? r[catIdx] : undefined });
      }
    });

    if (points.length === 0) return;
    const xMin = Math.min(...points.map(p => p.px));
    const xMax = Math.max(...points.map(p => p.px));
    const yMin = Math.min(...points.map(p => p.py));
    const yMax = Math.max(...points.map(p => p.py));
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const pad = { top: 25, bottom: 35, left: 45, right: 15 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (plotW / 5) * i;
      const y = pad.top + (plotH / 5) * i;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
    }

    // Unique categories for coloring
    const categories = [...new Set(points.map(p => p.cat).filter(Boolean))] as string[];
    const catColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    // Points
    points.forEach(p => {
      const sx = pad.left + ((p.px - xMin) / xRange) * plotW;
      const sy = pad.top + plotH - ((p.py - yMin) / yRange) * plotH;
      const catIndex = p.cat ? categories.indexOf(p.cat) : 0;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = catColors[catIndex % catColors.length];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Compute correlation
    const meanX = points.reduce((s, p) => s + p.px, 0) / points.length;
    const meanY = points.reduce((s, p) => s + p.py, 0) / points.length;
    let cov = 0, varX = 0, varY = 0;
    points.forEach(p => {
      cov += (p.px - meanX) * (p.py - meanY);
      varX += (p.px - meanX) ** 2;
      varY += (p.py - meanY) ** 2;
    });
    const r = cov / (Math.sqrt(varX * varY) || 1);

    // Trend line
    const slope = cov / (varX || 1);
    const intercept = meanY - slope * meanX;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    const lx1 = xMin;
    const ly1 = slope * lx1 + intercept;
    const lx2 = xMax;
    const ly2 = slope * lx2 + intercept;
    ctx.moveTo(pad.left + ((lx1 - xMin) / xRange) * plotW, pad.top + plotH - ((ly1 - yMin) / yRange) * plotH);
    ctx.lineTo(pad.left + ((lx2 - xMin) / xRange) * plotW, pad.top + plotH - ((ly2 - yMin) / yRange) * plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axes labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(scatterX, w / 2, h - 5);
    ctx.save();
    ctx.translate(10, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(scatterY, 0, 0);
    ctx.restore();

    // Axis tick values
    for (let i = 0; i <= 4; i++) {
      const xv = xMin + (xRange / 4) * i;
      const yv = yMin + (yRange / 4) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(xv.toFixed(1), pad.left + (plotW / 4) * i, h - pad.bottom + 12);
      ctx.textAlign = 'right';
      ctx.fillText(yv.toFixed(1), pad.left - 4, pad.top + plotH - (plotH / 4) * i + 3);
    }

    // Title with correlation
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${scatterX} vs ${scatterY}  (r = ${r.toFixed(3)})`, w / 2, 15);

    // Legend
    if (categories.length > 0) {
      categories.forEach((cat, ci) => {
        const lx = w - pad.right - 60;
        const ly = pad.top + 10 + ci * 14;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = catColors[ci % catColors.length];
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(cat, lx + 8, ly + 3);
      });
    }
  }, [scatterX, scatterY, parsedData, categoricalColumns]);

  useEffect(() => { if (activeTab === 'histogram') drawHistogram(); }, [activeTab, drawHistogram]);
  useEffect(() => { if (activeTab === 'scatter') drawScatter(); }, [activeTab, drawScatter]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-violet-50 dark:from-gray-950 dark:to-violet-950 p-3 overflow-hidden">
      {/* Dataset selector */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Dataset:</span>
        {(['iris', 'wine', 'housing'] as const).map(name => (
          <button
            key={name}
            onClick={() => loadSampleDataset(name)}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
              datasetName === name
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-700'
            }`}
          >
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </button>
        ))}
        <button
          onClick={() => { setDatasetName('custom'); setCsvText(''); }}
          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
            datasetName === 'custom'
              ? 'bg-violet-600 text-white shadow-md'
              : 'bg-white/70 dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 hover:bg-violet-100 dark:hover:bg-gray-700'
          }`}
        >
          Custom CSV
        </button>
        <span className="text-[10px] text-gray-400 ml-auto">
          {parsedData.rows.length} rows x {parsedData.headers.length} cols
        </span>
      </div>

      {/* CSV input (collapsible) */}
      {datasetName === 'custom' && (
        <textarea
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setDatasetName('custom'); }}
          placeholder="Paste CSV data here (header row required)..."
          className="w-full h-24 mb-2 p-2 text-[11px] font-mono rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none"
        />
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-2 w-fit">
        {(['preview', 'stats', 'histogram', 'scatter', 'missing'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-[11px] rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-violet-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab === 'preview' ? 'Data Preview' : tab === 'stats' ? 'Statistics' : tab === 'histogram' ? 'Histogram' : tab === 'scatter' ? 'Scatter Plot' : 'Missing Values'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'preview' && (
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <th className="px-2 py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">#</th>
                  {parsedData.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1.5 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      {h}
                      <span className="ml-1 text-[9px] text-gray-400">
                        {columnStats[i]?.type === 'numeric' ? '(num)' : '(cat)'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.rows.slice(0, 20).map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-850'}>
                    <td className="px-2 py-1 text-gray-400 border-b border-gray-100 dark:border-gray-700">{ri + 1}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 whitespace-nowrap font-mono">
                        {cell || <span className="text-red-400 italic">null</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.rows.length > 20 && (
              <div className="text-center text-[10px] text-gray-400 py-2">
                Showing 20 of {parsedData.rows.length} rows
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-3">
            {/* Numeric stats */}
            {numericColumns.length > 0 && (
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Numeric Columns</span>
                </div>
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      {['Column', 'Count', 'Mean', 'Std', 'Min', 'Q25', 'Q50', 'Q75', 'Max'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-left font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {numericColumns.map((col, i) => (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50 dark:bg-gray-800/50'}>
                        <td className="px-2 py-1 font-semibold text-violet-600 dark:text-violet-400 border-b border-gray-100 dark:border-gray-700">{col.name}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.count}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.mean?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.std?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.min?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.q25?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.q50?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.q75?.toFixed(2)}</td>
                        <td className="px-2 py-1 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{col.max?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Categorical stats */}
            {categoricalColumns.length > 0 && (
              <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Categorical Columns</span>
                </div>
                <div className="p-3 space-y-3">
                  {categoricalColumns.map((col, i) => (
                    <div key={i}>
                      <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 mb-1">
                        {col.name} <span className="text-gray-400 font-normal">({col.unique} unique, {col.count} total)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(col.valueCounts || {}).sort((a, b) => b[1] - a[1]).map(([val, count]) => (
                          <div key={val} className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 rounded text-[10px]">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{val}</span>
                            <span className="text-violet-600 dark:text-violet-400 font-mono">{count}</span>
                            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(count / col.count) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'histogram' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">Column:</label>
              <select
                value={selectedHistCol}
                onChange={e => setSelectedHistCol(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              >
                {numericColumns.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-gray-900 rounded-xl p-2 border border-gray-700">
              <canvas ref={histCanvasRef} width={500} height={300} className="w-full rounded-lg" />
            </div>
            {/* Quick stats under histogram */}
            {(() => {
              const stat = columnStats.find(s => s.name === selectedHistCol);
              if (!stat || stat.type !== 'numeric') return null;
              return (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Mean', value: stat.mean?.toFixed(3) },
                    { label: 'Std Dev', value: stat.std?.toFixed(3) },
                    { label: 'Median', value: stat.q50?.toFixed(3) },
                    { label: 'Range', value: `${stat.min?.toFixed(1)} - ${stat.max?.toFixed(1)}` },
                  ].map(item => (
                    <div key={item.label} className="bg-white dark:bg-gray-800/80 rounded-lg p-2 border border-gray-200 dark:border-gray-700 text-center">
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</div>
                      <div className="text-sm font-mono font-semibold text-violet-600 dark:text-violet-400">{item.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'scatter' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">X:</label>
                <select
                  value={scatterX}
                  onChange={e => setScatterX(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  {numericColumns.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">Y:</label>
                <select
                  value={scatterY}
                  onChange={e => setScatterY(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  {numericColumns.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-2 border border-gray-700">
              <canvas ref={scatterCanvasRef} width={500} height={350} className="w-full rounded-lg" />
            </div>
          </div>
        )}

        {activeTab === 'missing' && (
          <div className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto">
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Missing Values Analysis</span>
            </div>
            <div className="p-3 space-y-2">
              {columnStats.map((col, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 w-28 truncate">{col.name}</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        col.missing === 0
                          ? 'bg-emerald-500'
                          : col.missing / (col.count + col.missing) > 0.5
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${((col.count) / (col.count + col.missing)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 w-20 text-right">
                    {col.missing} / {col.count + col.missing}
                    <span className={`ml-1 ${col.missing === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      ({((col.missing / (col.count + col.missing)) * 100).toFixed(1)}%)
                    </span>
                  </span>
                </div>
              ))}
              {columnStats.every(c => c.missing === 0) && (
                <div className="text-center text-xs text-emerald-500 py-4 font-medium">
                  No missing values detected in any column.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
