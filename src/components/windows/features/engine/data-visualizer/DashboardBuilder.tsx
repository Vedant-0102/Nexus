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

interface ChartSlot {
  id: string;
  chartType: ChartType;
  xCol: number;
  yCol: number;
  theme: ColorTheme;
  title: string;
  fullscreen: boolean;
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
  const numericCols: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    if (rows.length > 0 && rows.every(r => r[c] !== undefined && r[c] !== '' && !isNaN(Number(r[c])))) numericCols.push(c);
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
/*  Canvas drawing (self-contained per panel)                          */
/* ------------------------------------------------------------------ */

function drawChart(
  canvas: HTMLCanvasElement,
  data: ParsedData,
  chartType: ChartType,
  xCol: number,
  yCol: number,
  theme: ColorTheme,
  title: string,
) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, W, H);

  const colors = PALETTES[theme];

  if (data.rows.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = `${12 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('No data', W / 2, H / 2);
    return;
  }

  const pad = { l: 44 * dpr, r: 14 * dpr, t: 28 * dpr, b: 36 * dpr };
  const pw = W - pad.l - pad.r;
  const ph = H - pad.t - pad.b;

  const labels = data.rows.map(r => r[xCol] || '');
  const values = data.rows.map(r => parseFloat(r[yCol]) || 0);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(1, ...values) * 1.1;

  // Title
  if (title) {
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${11 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 16 * dpr);
  }

  const valToY = (v: number) => pad.t + (1 - (v - minVal) / (maxVal - minVal)) * ph;
  const idxToX = (i: number) => pad.l + (i + 0.5) / labels.length * pw;

  // Axes for non-pie/radar
  if (chartType !== 'pie' && chartType !== 'radar') {
    for (let i = 0; i <= 4; i++) {
      const val = minVal + (i / 4) * (maxVal - minVal);
      const y = valToY(val);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + pw, y);
      ctx.strokeStyle = 'rgba(100,116,139,0.15)';
      ctx.lineWidth = dpr;
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = `${8 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), pad.l - 4 * dpr, y + 3 * dpr);
    }
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ph);
    ctx.lineTo(pad.l + pw, pad.t + ph);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    const step = Math.max(1, Math.ceil(labels.length / 8));
    ctx.fillStyle = '#94a3b8';
    ctx.font = `${8 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    for (let i = 0; i < labels.length; i += step) {
      ctx.fillText(labels[i].substring(0, 6), idxToX(i), pad.t + ph + 14 * dpr);
    }
  }

  switch (chartType) {
    case 'bar': {
      const barW = Math.max(3 * dpr, (pw / labels.length) * 0.6);
      for (let i = 0; i < values.length; i++) {
        const x = idxToX(i) - barW / 2;
        const y = valToY(values[i]);
        const h = valToY(minVal) - y;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, [2 * dpr, 2 * dpr, 0, 0]);
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
      ctx.lineWidth = 2 * dpr;
      ctx.lineJoin = 'round';
      ctx.stroke();
      for (let i = 0; i < values.length; i++) {
        ctx.beginPath();
        ctx.arc(idxToX(i), valToY(values[i]), 3 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = colors[0];
        ctx.fill();
      }
      break;
    }
    case 'area': {
      ctx.beginPath();
      ctx.moveTo(idxToX(0), valToY(minVal));
      for (let i = 0; i < values.length; i++) ctx.lineTo(idxToX(i), valToY(values[i]));
      ctx.lineTo(idxToX(values.length - 1), valToY(minVal));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
      grad.addColorStop(0, colors[0] + '60');
      grad.addColorStop(1, colors[0] + '08');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < values.length; i++) {
        if (i === 0) ctx.moveTo(idxToX(i), valToY(values[i]));
        else ctx.lineTo(idxToX(i), valToY(values[i]));
      }
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
      break;
    }
    case 'scatter': {
      for (let i = 0; i < values.length; i++) {
        ctx.beginPath();
        ctx.arc(idxToX(i), valToY(values[i]), 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % colors.length] + 'cc';
        ctx.fill();
      }
      break;
    }
    case 'histogram': {
      const numBins = Math.min(10, Math.ceil(Math.sqrt(values.length)));
      const binMin = Math.min(...values), binMax = Math.max(...values);
      const binW = (binMax - binMin) / numBins || 1;
      const bins = new Array(numBins).fill(0);
      for (const v of values) bins[Math.min(numBins - 1, Math.floor((v - binMin) / binW))]++;
      const maxBin = Math.max(...bins, 1);
      const bw = pw / numBins;
      for (let i = 0; i < numBins; i++) {
        const h = (bins[i] / maxBin) * ph;
        ctx.fillStyle = colors[i % colors.length] + 'cc';
        ctx.fillRect(pad.l + i * bw + dpr, pad.t + ph - h, bw - 2 * dpr, h);
      }
      break;
    }
    case 'pie': {
      const cx = W / 2, cy = pad.t + ph / 2;
      const radius = Math.min(pw, ph) / 3;
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
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        if (slice > 0.15) {
          const mid = angle + slice / 2;
          ctx.fillStyle = '#cbd5e1';
          ctx.font = `${8 * dpr}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(labels[i].substring(0, 5), cx + Math.cos(mid) * (radius + 14 * dpr), cy + Math.sin(mid) * (radius + 14 * dpr));
        }
        angle += slice;
      }
      break;
    }
    case 'radar': {
      const cx = W / 2, cy = pad.t + ph / 2;
      const radius = Math.min(pw, ph) / 3;
      const n = values.length;
      if (n < 3) return;
      const maxR = Math.max(...values, 1);
      for (let ring = 1; ring <= 3; ring++) {
        const r = (ring / 3) * radius;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.strokeStyle = 'rgba(100,116,139,0.2)';
        ctx.lineWidth = dpr;
        ctx.stroke();
      }
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const a = (idx / n) * Math.PI * 2 - Math.PI / 2;
        const r = (values[idx] / maxR) * radius;
        if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.fillStyle = colors[0] + '40';
      ctx.fill();
      ctx.strokeStyle = colors[0];
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
      break;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

let _slotId = 0;
const makeSlot = (overrides?: Partial<ChartSlot>): ChartSlot => ({
  id: `slot_${++_slotId}`,
  chartType: 'bar',
  xCol: 0,
  yCol: 1,
  theme: 'default',
  title: '',
  fullscreen: false,
  ...overrides,
});

const CHART_LABELS: Record<ChartType, string> = {
  bar: 'Bar', line: 'Line', pie: 'Pie', scatter: 'Scatter', histogram: 'Hist', area: 'Area', radar: 'Radar',
};

export const DashboardBuilder: React.FC = () => {
  const [csvText, setCsvText] = useState('');
  const [data, setData] = useState<ParsedData>({ headers: [], rows: [], numericCols: [] });
  const [slots, setSlots] = useState<ChartSlot[]>([
    makeSlot({ chartType: 'bar', title: 'Chart 1', yCol: 1 }),
    makeSlot({ chartType: 'line', title: 'Chart 2', yCol: 2 }),
    makeSlot({ chartType: 'pie', title: 'Chart 3', yCol: 1 }),
    makeSlot({ chartType: 'area', title: 'Chart 4', yCol: 3 }),
  ]);
  const [dashTitle, setDashTitle] = useState('My Dashboard');
  const [dashDesc, setDashDesc] = useState('');
  const [gridCols, setGridCols] = useState(2);

  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /* Parse CSV */
  const handleParse = useCallback(() => {
    const parsed = parseCSV(csvText);
    setData(parsed);
    // Update slots to valid columns
    setSlots(prev => prev.map(s => ({
      ...s,
      xCol: Math.min(s.xCol, Math.max(0, parsed.headers.length - 1)),
      yCol: Math.min(s.yCol, Math.max(0, parsed.headers.length - 1)),
    })));
  }, [csvText]);

  const loadSample = () => {
    setCsvText(SAMPLE_CSV);
    const parsed = parseCSV(SAMPLE_CSV);
    setData(parsed);
    setSlots(prev => prev.map((s, i) => ({
      ...s,
      xCol: 0,
      yCol: Math.min(i + 1, parsed.headers.length - 1),
    })));
    setDashTitle('Monthly Sales Dashboard');
    setDashDesc('Overview of key business metrics');
  };

  /* Redraw all canvases */
  const redrawAll = useCallback(() => {
    for (const slot of slots) {
      const canvas = canvasRefs.current.get(slot.id);
      const container = containerRefs.current.get(slot.id);
      if (!canvas || !container) continue;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
      drawChart(canvas, data, slot.chartType, slot.xCol, slot.yCol, slot.theme, slot.title);
    }
  }, [slots, data]);

  useEffect(() => {
    // Small delay to allow layout
    const t = setTimeout(redrawAll, 50);
    return () => clearTimeout(t);
  }, [redrawAll]);

  useEffect(() => {
    window.addEventListener('resize', redrawAll);
    return () => window.removeEventListener('resize', redrawAll);
  }, [redrawAll]);

  /* Slot operations */
  const updateSlot = useCallback((id: string, updates: Partial<ChartSlot>) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  }, []);

  const addSlot = useCallback(() => {
    if (slots.length >= 9) return;
    setSlots(prev => [...prev, makeSlot({
      title: `Chart ${prev.length + 1}`,
      yCol: Math.min(prev.length + 1, Math.max(0, data.headers.length - 1)),
    })]);
  }, [slots.length, data.headers.length]);

  const swapSlots = useCallback((idx: number, dir: -1 | 1) => {
    setSlots(prev => {
      const next = [...prev];
      const ni = idx + dir;
      if (ni < 0 || ni >= next.length) return next;
      [next[idx], next[ni]] = [next[ni], next[idx]];
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback((id: string) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, fullscreen: !s.fullscreen } : { ...s, fullscreen: false }));
  }, []);

  /* Export all as combined image */
  const exportAll = useCallback(() => {
    const dpr = window.devicePixelRatio || 1;
    const totalW = 1200 * dpr;
    const chartH = 400 * dpr;
    const headerH = 60 * dpr;
    const cols = gridCols;
    const rowCount = Math.ceil(slots.length / cols);
    const totalH = headerH + rowCount * chartH;

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, totalW, totalH);

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `bold ${20 * dpr}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(dashTitle, totalW / 2, 36 * dpr);

    // Copy each chart canvas
    slots.forEach((slot, i) => {
      const canvas = canvasRefs.current.get(slot.id);
      if (!canvas) return;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const slotW = totalW / cols;
      const dx = col * slotW;
      const dy = headerH + row * chartH;
      ctx.drawImage(canvas, dx + 4 * dpr, dy + 4 * dpr, slotW - 8 * dpr, chartH - 8 * dpr);
    });

    const link = document.createElement('a');
    link.download = `dashboard_${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }, [slots, dashTitle, gridCols]);

  const fullscreenSlot = slots.find(s => s.fullscreen);

  const selectClass = 'px-2 py-1 text-xs rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-teal-50 dark:from-gray-950 dark:to-teal-950 p-3 overflow-hidden">
      {/* CSV input + dashboard config */}
      <div className="flex gap-2 mb-2 items-start">
        <textarea
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder="Paste CSV data (shared across all charts)..."
          className="flex-1 h-14 p-2 text-xs font-mono rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button onClick={handleParse}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            Parse
          </button>
          <button onClick={loadSample}
            className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
            Sample
          </button>
        </div>
      </div>

      {/* Dashboard header */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <input type="text" value={dashTitle} onChange={e => setDashTitle(e.target.value)}
          placeholder="Dashboard title" className={selectClass + ' w-48 font-semibold'} />
        <input type="text" value={dashDesc} onChange={e => setDashDesc(e.target.value)}
          placeholder="Description" className={selectClass + ' flex-1'} />
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Cols:</span>
          {[2, 3].map(n => (
            <button key={n} onClick={() => setGridCols(n)}
              className={`px-2 py-0.5 text-[10px] rounded ${gridCols === n ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {n}
            </button>
          ))}
        </div>
        <button onClick={addSlot} disabled={slots.length >= 9}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40">
          + Add Chart
        </button>
        <button onClick={exportAll} disabled={data.rows.length === 0}
          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 ml-auto">
          Export All
        </button>
      </div>

      {/* Fullscreen overlay */}
      {fullscreenSlot && (
        <div className="absolute inset-0 z-50 bg-gray-950/95 flex flex-col p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">{fullscreenSlot.title || 'Chart'}</span>
            <button onClick={() => toggleFullscreen(fullscreenSlot.id)}
              className="px-3 py-1 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-600">
              Exit Fullscreen
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-gray-900 rounded-xl overflow-hidden"
            ref={el => { if (el) containerRefs.current.set(fullscreenSlot.id + '_fs', el); }}>
            <canvas
              ref={el => {
                if (el) {
                  const dpr = window.devicePixelRatio || 1;
                  el.width = el.parentElement!.clientWidth * dpr;
                  el.height = el.parentElement!.clientHeight * dpr;
                  el.style.width = el.parentElement!.clientWidth + 'px';
                  el.style.height = el.parentElement!.clientHeight + 'px';
                  drawChart(el, data, fullscreenSlot.chartType, fullscreenSlot.xCol, fullscreenSlot.yCol, fullscreenSlot.theme, fullscreenSlot.title);
                }
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Chart grid */}
      <div className={`flex-1 min-h-0 overflow-auto grid gap-2 auto-rows-fr`}
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
        {slots.map((slot, idx) => (
          <div key={slot.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden min-h-[200px]">
            {/* Slot toolbar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <input type="text" value={slot.title} onChange={e => updateSlot(slot.id, { title: e.target.value })}
                className="w-20 text-[10px] font-semibold bg-transparent border-none text-gray-700 dark:text-gray-200 focus:outline-none" placeholder="Title" />
              <select value={slot.chartType} onChange={e => updateSlot(slot.id, { chartType: e.target.value as ChartType })}
                className="text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-700 dark:text-gray-200 focus:outline-none">
                {Object.entries(CHART_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {data.headers.length > 0 && (
                <>
                  <select value={slot.xCol} onChange={e => updateSlot(slot.id, { xCol: Number(e.target.value) })}
                    className="text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-700 dark:text-gray-200 focus:outline-none max-w-[60px]">
                    {data.headers.map((h, i) => <option key={i} value={i}>X:{h}</option>)}
                  </select>
                  <select value={slot.yCol} onChange={e => updateSlot(slot.id, { yCol: Number(e.target.value) })}
                    className="text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-700 dark:text-gray-200 focus:outline-none max-w-[60px]">
                    {data.headers.map((h, i) => <option key={i} value={i}>Y:{h}</option>)}
                  </select>
                </>
              )}
              <select value={slot.theme} onChange={e => updateSlot(slot.id, { theme: e.target.value as ColorTheme })}
                className="text-[10px] bg-transparent border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-700 dark:text-gray-200 focus:outline-none">
                {['default', 'warm', 'cool', 'pastel', 'dark'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="ml-auto flex items-center gap-0.5">
                <button onClick={() => swapSlots(idx, -1)} disabled={idx === 0}
                  className="px-1 py-0.5 text-[9px] bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 disabled:opacity-30">
                  &larr;
                </button>
                <button onClick={() => swapSlots(idx, 1)} disabled={idx === slots.length - 1}
                  className="px-1 py-0.5 text-[9px] bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 disabled:opacity-30">
                  &rarr;
                </button>
                <button onClick={() => toggleFullscreen(slot.id)}
                  className="px-1 py-0.5 text-[9px] bg-gray-200 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                  FS
                </button>
                <button onClick={() => removeSlot(slot.id)} disabled={slots.length <= 1}
                  className="px-1 py-0.5 text-[9px] bg-red-100 dark:bg-red-900/30 rounded text-red-500 disabled:opacity-30">
                  X
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 min-h-0 bg-gray-900"
              ref={el => { if (el) containerRefs.current.set(slot.id, el); }}>
              <canvas
                ref={el => { if (el) canvasRefs.current.set(slot.id, el); }}
                className="w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-500">
        <span>{data.rows.length} rows x {data.headers.length} cols | {slots.length} chart{slots.length !== 1 ? 's' : ''}</span>
        <span>{gridCols}-column layout</span>
      </div>
    </div>
  );
};
