import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'area' | 'radar';
type ColorTheme = 'default' | 'warm' | 'cool' | 'pastel' | 'dark';

interface ParsedData {
  headers: string[];
  rows: string[][];
  numericCols: number[];
}

/* ------------------------------------------------------------------ */
/*  Color palettes                                                     */
/* ------------------------------------------------------------------ */

const PALETTES: Record<ColorTheme, string[]> = {
  default: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
  warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#dc2626', '#ea580c', '#d97706', '#ca8a04'],
  cool: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1', '#2563eb', '#0891b2', '#7c3aed', '#4f46e5'],
  pastel: ['#93c5fd', '#fca5a5', '#86efac', '#fde68a', '#c4b5fd', '#fbcfe8', '#a5f3fc', '#fdba74'],
  dark: ['#1e40af', '#991b1b', '#065f46', '#92400e', '#5b21b6', '#9d174d', '#155e75', '#9a3412'],
};

/* ------------------------------------------------------------------ */
/*  CSV Parsing                                                        */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): ParsedData {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [], numericCols: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));

  // Determine numeric columns
  const numericCols: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    const allNumeric = rows.length > 0 && rows.every(r => r[c] !== undefined && r[c] !== '' && !isNaN(Number(r[c])));
    if (allNumeric) numericCols.push(c);
  }

  return { headers, rows, numericCols };
}

const SAMPLE_CSV = `Month,Sales,Profit,Customers,Satisfaction
Jan,4200,1200,320,4.2
Feb,3800,980,290,4.0
Mar,5100,1850,410,4.5
Apr,4700,1400,375,4.3
May,5500,2100,450,4.6
Jun,6200,2800,520,4.8
Jul,5900,2400,490,4.7
Aug,6800,3100,580,4.9
Sep,6100,2600,510,4.6
Oct,5400,1900,430,4.4
Nov,4900,1500,380,4.3
Dec,7200,3500,620,4.9`;

/* ------------------------------------------------------------------ */
/*  Canvas drawing                                                     */
/* ------------------------------------------------------------------ */

function drawChart(
  canvas: HTMLCanvasElement,
  data: ParsedData,
  chartType: ChartType,
  xCol: number,
  yCol: number,
  theme: ColorTheme,
  title: string,
  xLabel: string,
  yLabel: string,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, W, H);
  const colors = PALETTES[theme];

  if (data.rows.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = `${14 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('No data to display', W / 2, H / 2);
    return;
  }

  const pad = { l: 60 * dpr, r: 30 * dpr, t: 40 * dpr, b: 50 * dpr };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;

  // Parse values
  const labels = data.rows.map(r => r[xCol] || '');
  const values = data.rows.map(r => parseFloat(r[yCol]) || 0);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1, ...values) * 1.1;

  // Title
  if (title) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${13 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 20 * dpr);
  }

  // Helper: value to Y
  const valToY = (v: number) => pad.t + (1 - (v - minVal) / (maxVal - minVal)) * ph;
  // Helper: index to X
  const idxToX = (i: number) => pad.l + (i + 0.5) / labels.length * pw;

  // Axes and grid (not for pie/radar)
  if (chartType !== 'pie' && chartType !== 'radar') {
    // Y axis gridlines
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const val = minVal + (i / numGridLines) * (maxVal - minVal);
      const y = valToY(val);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + pw, y);
      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = dpr;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = `${9 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(val >= 100 ? 0 : 1), pad.l - 6 * dpr, y + 3 * dpr);
    }

    // Axes
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ph);
    ctx.lineTo(pad.l + pw, pad.t + ph);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // X labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${9 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const maxLabels = Math.min(labels.length, 20);
    const step = Math.ceil(labels.length / maxLabels);
    for (let i = 0; i < labels.length; i += step) {
      const x = idxToX(i);
      ctx.save();
      ctx.translate(x, pad.t + ph + 14 * dpr);
      ctx.rotate(-0.4);
      ctx.fillText(labels[i].substring(0, 10), 0, 0);
      ctx.restore();
    }

    // Axis labels
    if (xLabel) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${10 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, pad.l + pw / 2, H - 6 * dpr);
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(14 * dpr, pad.t + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#94a3b8';
      ctx.font = `${10 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }
  }

  // Draw the chart
  switch (chartType) {
    case 'bar': {
      const barW = Math.max(4 * dpr, (pw / labels.length) * 0.6);
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i) - barW / 2;
        const y = valToY(values[i]);
        const h = valToY(minVal) - y;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, [3 * dpr, 3 * dpr, 0, 0]);
        ctx.fill();
      }
      break;
    }
    case 'line': {
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i), y = valToY(values[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Points
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i), y = valToY(values[i]);
        ctx.beginPath();
        ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = colors[0];
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }
      break;
    }
    case 'area': {
      // Fill
      ctx.beginPath();
      ctx.moveTo(idxToX(0), valToY(minVal));
      for (let i = 0; i < values.length; i++) {
        ctx.lineTo(idxToX(i), valToY(values[i]));
      }
      ctx.lineTo(idxToX(values.length - 1), valToY(minVal));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
      grad.addColorStop(0, colors[0] + '80');
      grad.addColorStop(1, colors[0] + '08');
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i), y = valToY(values[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
      break;
    }
    case 'scatter': {
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i), y = valToY(values[i]);
        ctx.beginPath();
        ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % colors.length] + 'cc';
        ctx.fill();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }
      break;
    }
    case 'histogram': {
      // Create bins
      const numBins = Math.min(15, Math.ceil(Math.sqrt(values.length)));
      const binMin = Math.min(...values);
      const binMax = Math.max(...values);
      const binWidth = (binMax - binMin) / numBins || 1;
      const bins = new Array(numBins).fill(0);
      for (const v of values) {
        const idx = Math.min(numBins - 1, Math.floor((v - binMin) / binWidth));
        bins[idx]++;
      }
      const maxBin = Math.max(...bins, 1);
      const barW = pw / numBins;
      for (let i = 0; i < numBins; i++) {
        const x = pad.l + i * barW;
        const h = (bins[i] / maxBin) * ph;
        const y = pad.t + ph - h;
        ctx.fillStyle = colors[i % colors.length] + 'cc';
        ctx.fillRect(x + dpr, y, barW - 2 * dpr, h);
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = dpr;
        ctx.strokeRect(x + dpr, y, barW - 2 * dpr, h);
      }
      break;
    }
    case 'pie': {
      const cx = W / 2, cy = pad.t + ph / 2;
      const radius = Math.min(pw, ph) / 2.5;
      const total = values.reduce((a, b) => a + Math.abs(b), 0) || 1;
      let angle = -Math.PI / 2;
      for (let i = 0; i < values.length; i++) {
        const slice = (Math.abs(values[i]) / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // Label
        const midAngle = angle + slice / 2;
        const lx = cx + Math.cos(midAngle) * (radius + 18 * dpr);
        const ly = cy + Math.sin(midAngle) * (radius + 18 * dpr);
        ctx.fillStyle = '#cbd5e1';
        ctx.font = `${9 * dpr}px system-ui, sans-serif`;
        ctx.textAlign = Math.cos(midAngle) > 0 ? 'left' : 'right';
        ctx.fillText(`${labels[i]} (${((Math.abs(values[i]) / total) * 100).toFixed(1)}%)`, lx, ly);

        angle += slice;
      }
      break;
    }
    case 'radar': {
      const cx = W / 2, cy = pad.t + ph / 2;
      const radius = Math.min(pw, ph) / 3;
      const n = values.length;
      if (n < 3) {
        ctx.fillStyle = '#64748b';
        ctx.font = `${12 * dpr}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Radar chart needs at least 3 data points', W / 2, H / 2);
        return;
      }
      const maxR = Math.max(...values, 1);

      // Grid
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * radius;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(100,116,139,0.2)';
        ctx.lineWidth = dpr;
        ctx.stroke();
      }

      // Spokes + labels
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * radius;
        const py = cy + Math.sin(a) * radius;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.strokeStyle = 'rgba(100,116,139,0.2)';
        ctx.stroke();

        const lx = cx + Math.cos(a) * (radius + 16 * dpr);
        const ly = cy + Math.sin(a) * (radius + 16 * dpr);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${9 * dpr}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(labels[i].substring(0, 8), lx, ly);
      }

      // Data polygon
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const a = (idx / n) * Math.PI * 2 - Math.PI / 2;
        const r = (values[idx] / maxR) * radius;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.fillStyle = colors[0] + '40';
      ctx.fill();
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // Data points
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const r = (values[i] / maxR) * radius;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        ctx.beginPath();
        ctx.arc(px, py, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = colors[0];
        ctx.fill();
      }
      break;
    }
  }

  // Legend (bottom-right)
  if (chartType !== 'pie' && chartType !== 'radar') {
    const legendX = pad.l + pw - 10 * dpr;
    const legendY = pad.t + 8 * dpr;
    ctx.fillStyle = 'rgba(15,23,42,0.7)';
    ctx.beginPath();
    ctx.roundRect(legendX - 80 * dpr, legendY - 4 * dpr, 88 * dpr, 18 * dpr, 4 * dpr);
    ctx.fill();
    ctx.fillStyle = colors[0];
    ctx.fillRect(legendX - 74 * dpr, legendY, 10 * dpr, 8 * dpr);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `${9 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(data.headers[yCol] || 'Y', legendX - 60 * dpr, legendY + 8 * dpr);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'line', label: 'Line' },
  { value: 'pie', label: 'Pie' },
  { value: 'scatter', label: 'Scatter' },
  { value: 'histogram', label: 'Histogram' },
  { value: 'area', label: 'Area' },
  { value: 'radar', label: 'Radar' },
];

const THEMES: { value: ColorTheme; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'dark', label: 'Dark' },
];

export const DataVisualizer: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [data, setData] = useState<ParsedData>({ headers: [], rows: [], numericCols: [] });
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xCol, setXCol] = useState(0);
  const [yCol, setYCol] = useState(1);
  const [theme, setTheme] = useState<ColorTheme>('default');
  const [chartTitle, setChartTitle] = useState('');
  const [xAxisLabel, setXAxisLabel] = useState('');
  const [yAxisLabel, setYAxisLabel] = useState('');
  const [showTable, setShowTable] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Parse CSV whenever text changes */
  const handleParse = useCallback(() => {
    const parsed = parseCSV(csvText);
    setData(parsed);
    if (parsed.headers.length > 0) setXCol(0);
    if (parsed.headers.length > 1) setYCol(parsed.numericCols.length > 0 ? parsed.numericCols[0] : 1);
  }, [csvText]);

  /* Redraw canvas */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = container.clientWidth + 'px';
    canvas.style.height = container.clientHeight + 'px';
    drawChart(canvas, data, chartType, xCol, yCol, theme, chartTitle, xAxisLabel, yAxisLabel);
  }, [data, chartType, xCol, yCol, theme, chartTitle, xAxisLabel, yAxisLabel]);

  useEffect(() => { redraw(); }, [redraw]);

  useEffect(() => {
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [redraw]);

  /* Export as PNG */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `chart_${chartType}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const loadSample = () => {
    setCsvText(SAMPLE_CSV);
    const parsed = parseCSV(SAMPLE_CSV);
    setData(parsed);
    setXCol(0);
    setYCol(parsed.numericCols.length > 0 ? parsed.numericCols[0] : 1);
    setChartTitle('Monthly Sales Report');
    setXAxisLabel('Month');
    setYAxisLabel('Sales');
  };

  const selectClass = 'px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-gray-950 dark:to-cyan-950 p-3 overflow-hidden">
      {/* Toolbar row 1: CSV input */}
      <div className="flex gap-2 mb-2 items-start">
        <div className="flex-1 min-w-0">
          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste CSV data here (header row + data rows, comma-separated)..."
            className="w-full h-16 p-2 text-xs font-mono rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={handleParse}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap">
            Parse CSV
          </button>
          <button onClick={loadSample}
            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 whitespace-nowrap">
            Sample Data
          </button>
        </div>
      </div>

      {/* Toolbar row 2: Chart config */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {CHART_TYPES.map(ct => (
            <button key={ct.value} onClick={() => setChartType(ct.value)}
              className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${chartType === ct.value ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {ct.label}
            </button>
          ))}
        </div>

        {data.headers.length > 0 && (
          <>
            <select value={xCol} onChange={e => setXCol(Number(e.target.value))} className={selectClass}>
              {data.headers.map((h, i) => <option key={i} value={i}>X: {h}</option>)}
            </select>
            <select value={yCol} onChange={e => setYCol(Number(e.target.value))} className={selectClass}>
              {data.headers.map((h, i) => <option key={i} value={i}>Y: {h}</option>)}
            </select>
          </>
        )}

        <select value={theme} onChange={e => setTheme(e.target.value as ColorTheme)} className={selectClass}>
          {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <button onClick={() => setShowTable(!showTable)}
          className={`px-2 py-1 text-[10px] rounded-lg font-medium ${showTable ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          Table
        </button>

        <button onClick={exportPNG} disabled={data.rows.length === 0}
          className="px-2 py-1 text-[10px] rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 ml-auto">
          Export PNG
        </button>
      </div>

      {/* Labels row */}
      <div className="flex gap-2 mb-2">
        <input type="text" value={chartTitle} onChange={e => setChartTitle(e.target.value)}
          placeholder="Chart title" className={selectClass + ' flex-1'} />
        <input type="text" value={xAxisLabel} onChange={e => setXAxisLabel(e.target.value)}
          placeholder="X axis label" className={selectClass + ' w-28'} />
        <input type="text" value={yAxisLabel} onChange={e => setYAxisLabel(e.target.value)}
          placeholder="Y axis label" className={selectClass + ' w-28'} />
      </div>

      {/* Main area */}
      <div className="flex-1 min-h-0 flex gap-2 overflow-hidden">
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 min-w-0 bg-gray-900 rounded-xl overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Table view */}
        {showTable && data.rows.length > 0 && (
          <div className="w-56 flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-auto">
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr>
                  {data.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1.5 text-left font-bold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 truncate max-w-[60px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 text-gray-700 dark:text-gray-300 truncate max-w-[60px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500">
        <span>{data.rows.length} rows x {data.headers.length} columns</span>
        <span>{chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart | {theme} theme</span>
      </div>
    </div>
  );
};
