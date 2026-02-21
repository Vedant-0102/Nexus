import React, { useState, useCallback, useRef, useEffect } from 'react';

type AlgoId = 'bubble' | 'insertion' | 'selection' | 'merge' | 'quick' | 'heap' | 'counting' | 'radix';

interface AlgoResult {
  name: string;
  id: AlgoId;
  timeMs: number;
  comparisons: number;
  swaps: number;
  bigO: string;
  color: string;
}

const ALGO_INFO: Record<AlgoId, { name: string; best: string; avg: string; worst: string; space: string; color: string }> = {
  'bubble': { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', color: '#ef4444' },
  'insertion': { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', color: '#f59e0b' },
  'selection': { name: 'Selection Sort', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', color: '#8b5cf6' },
  'merge': { name: 'Merge Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', color: '#3b82f6' },
  'quick': { name: 'Quick Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', color: '#22c55e' },
  'heap': { name: 'Heap Sort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', color: '#06b6d4' },
  'counting': { name: 'Counting Sort', best: 'O(n+k)', avg: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)', color: '#ec4899' },
  'radix': { name: 'Radix Sort', best: 'O(nk)', avg: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)', color: '#10b981' },
};

const SIZES = [100, 500, 1000, 5000, 10000, 50000];

function generateArray(size: number, type: 'random' | 'sorted' | 'reverse' | 'nearly-sorted'): number[] {
  const arr = Array.from({ length: size }, (_, i) => i + 1);
  if (type === 'sorted') return arr;
  if (type === 'reverse') return arr.reverse();
  if (type === 'nearly-sorted') {
    // Swap ~5% of elements
    const swaps = Math.floor(size * 0.05);
    for (let i = 0; i < swaps; i++) {
      const a = Math.floor(Math.random() * size);
      const b = Math.floor(Math.random() * size);
      [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    return arr;
  }
  // random (Fisher-Yates)
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sorting implementations that count operations
function bubbleSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      if (arr[j] > arr[j + 1]) { [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; swaps++; }
    }
  }
  return { comparisons, swaps };
}

function insertionSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) { comparisons++; arr[j + 1] = arr[j]; j--; swaps++; }
    comparisons++;
    arr[j + 1] = key;
  }
  return { comparisons, swaps };
}

function selectionSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) { comparisons++; if (arr[j] < arr[minIdx]) minIdx = j; }
    if (minIdx !== i) { [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]; swaps++; }
  }
  return { comparisons, swaps };
}

function mergeSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const sort = (a: number[], l: number, r: number) => {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    sort(a, l, m);
    sort(a, m + 1, r);
    const left = a.slice(l, m + 1), right = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      comparisons++;
      if (left[i] <= right[j]) { a[k++] = left[i++]; } else { a[k++] = right[j++]; swaps++; }
    }
    while (i < left.length) a[k++] = left[i++];
    while (j < right.length) a[k++] = right[j++];
  };
  sort(arr, 0, arr.length - 1);
  return { comparisons, swaps };
}

function quickSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const sort = (a: number[], lo: number, hi: number) => {
    if (lo >= hi) return;
    const pivot = a[hi];
    let i = lo;
    for (let j = lo; j < hi; j++) {
      comparisons++;
      if (a[j] < pivot) { [a[i], a[j]] = [a[j], a[i]]; i++; swaps++; }
    }
    [a[i], a[hi]] = [a[hi], a[i]]; swaps++;
    sort(a, lo, i - 1);
    sort(a, i + 1, hi);
  };
  sort(arr, 0, arr.length - 1);
  return { comparisons, swaps };
}

function heapSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0, swaps = 0;
  const n = arr.length;
  const heapify = (size: number, root: number) => {
    let largest = root;
    const l = 2 * root + 1, r = 2 * root + 2;
    if (l < size) { comparisons++; if (arr[l] > arr[largest]) largest = l; }
    if (r < size) { comparisons++; if (arr[r] > arr[largest]) largest = r; }
    if (largest !== root) { [arr[root], arr[largest]] = [arr[largest], arr[root]]; swaps++; heapify(size, largest); }
  };
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i);
  for (let i = n - 1; i > 0; i--) { [arr[0], arr[i]] = [arr[i], arr[0]]; swaps++; heapify(i, 0); }
  return { comparisons, swaps };
}

function countingSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0;
  const max = Math.max(...arr);
  const count = new Array(max + 1).fill(0);
  for (const v of arr) count[v]++;
  let idx = 0;
  for (let i = 0; i <= max; i++) { comparisons++; while (count[i]-- > 0) arr[idx++] = i; }
  return { comparisons, swaps: 0 };
}

function radixSort(arr: number[]): { comparisons: number; swaps: number } {
  let comparisons = 0;
  const max = Math.max(...arr);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = new Array(arr.length);
    const count = new Array(10).fill(0);
    for (const v of arr) count[Math.floor(v / exp) % 10]++;
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = arr.length - 1; i >= 0; i--) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[--count[digit]] = arr[i];
      comparisons++;
    }
    for (let i = 0; i < arr.length; i++) arr[i] = output[i];
  }
  return { comparisons, swaps: 0 };
}

const SORT_FNS: Record<AlgoId, (arr: number[]) => { comparisons: number; swaps: number }> = {
  bubble: bubbleSort, insertion: insertionSort, selection: selectionSort,
  merge: mergeSort, quick: quickSort, heap: heapSort,
  counting: countingSort, radix: radixSort,
};

export const BigOComparator: React.FC = () => {
  const [selectedAlgos, setSelectedAlgos] = useState<AlgoId[]>(['bubble', 'merge', 'quick', 'heap']);
  const [arraySize, setArraySize] = useState(1000);
  const [dataType, setDataType] = useState<'random' | 'sorted' | 'reverse' | 'nearly-sorted'>('random');
  const [results, setResults] = useState<AlgoResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const toggleAlgo = (id: AlgoId) => {
    setSelectedAlgos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    const results: AlgoResult[] = [];

    for (const algoId of selectedAlgos) {
      const arr = generateArray(arraySize, dataType);
      const start = performance.now();
      const { comparisons, swaps } = SORT_FNS[algoId]([...arr]);
      const timeMs = performance.now() - start;

      results.push({
        name: ALGO_INFO[algoId].name,
        id: algoId,
        timeMs,
        comparisons,
        swaps,
        bigO: ALGO_INFO[algoId].avg,
        color: ALGO_INFO[algoId].color,
      });
    }

    results.sort((a, b) => a.timeMs - b.timeMs);
    setResults(results);
    setIsRunning(false);
  }, [selectedAlgos, arraySize, dataType]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || results.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#080c18' : '#f8f9fc';
    ctx.fillRect(0, 0, w, h);

    const maxTime = Math.max(...results.map(r => r.timeMs), 0.001);
    const barW = Math.min(60, (w - 80) / results.length - 10);
    const chartH = h - 50;
    const startX = 60;

    // Y axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, 10);
    ctx.lineTo(startX, chartH + 10);
    ctx.lineTo(w - 10, chartH + 10);
    ctx.stroke();

    // Y axis labels
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (chartH * (4 - i)) / 4;
      const val = (maxTime * i) / 4;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1) + 'ms', startX - 5, y + 4);
      ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    // Bars
    results.forEach((r, i) => {
      const x = startX + 20 + i * (barW + 10);
      const barH = (r.timeMs / maxTime) * chartH;
      const y = chartH + 10 - barH;

      ctx.fillStyle = r.color;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(x, y, barW, barH);
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(r.timeMs.toFixed(2) + 'ms', x + barW / 2, y - 5);

      ctx.save();
      ctx.translate(x + barW / 2, chartH + 22);
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(r.name, 0, 0);
      ctx.restore();
    });
    };
    render();
    const obs = new ResizeObserver(render);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [results]);

  const runMultipleSizes = useCallback(async () => {
    setIsRunning(true);
    const multiResults: { size: number; results: AlgoResult[] }[] = [];

    for (const size of [100, 500, 1000, 5000]) {
      const sizeResults: AlgoResult[] = [];
      for (const algoId of selectedAlgos) {
        if (size > 5000 && (algoId === 'bubble' || algoId === 'insertion' || algoId === 'selection')) continue;
        const arr = generateArray(size, dataType);
        const start = performance.now();
        SORT_FNS[algoId]([...arr]);
        const timeMs = performance.now() - start;
        sizeResults.push({ name: ALGO_INFO[algoId].name, id: algoId, timeMs, comparisons: 0, swaps: 0, bigO: ALGO_INFO[algoId].avg, color: ALGO_INFO[algoId].color });
      }
      multiResults.push({ size, results: sizeResults });
    }

    // Show latest size results
    setResults(multiResults[multiResults.length - 1].results.sort((a, b) => a.timeMs - b.timeMs));
    setIsRunning(false);
  }, [selectedAlgos, dataType]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-rose-50 dark:from-gray-950 dark:to-rose-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={arraySize} onChange={e => setArraySize(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          {SIZES.map(s => <option key={s} value={s}>n = {s.toLocaleString()}</option>)}
        </select>

        <select value={dataType} onChange={e => setDataType(e.target.value as any)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="random">Random Data</option>
          <option value="sorted">Already Sorted</option>
          <option value="reverse">Reverse Sorted</option>
          <option value="nearly-sorted">Nearly Sorted</option>
        </select>

        <button onClick={runBenchmark} disabled={isRunning || selectedAlgos.length === 0}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
          {isRunning ? 'Running...' : '▶ Run Benchmark'}
        </button>
        <button onClick={runMultipleSizes} disabled={isRunning || selectedAlgos.length === 0}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          Multi-Size Test
        </button>
      </div>

      {/* Algorithm selection */}
      <div className="flex flex-wrap gap-1 mb-3">
        {(Object.keys(ALGO_INFO) as AlgoId[]).map(id => (
          <button key={id} onClick={() => toggleAlgo(id)}
            className={`px-2 py-1 text-xs rounded-full border transition-all ${
              selectedAlgos.includes(id)
                ? 'text-white border-transparent'
                : 'text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
            style={selectedAlgos.includes(id) ? { backgroundColor: ALGO_INFO[id].color } : {}}>
            {ALGO_INFO[id].name}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        {/* Chart */}
        <div className="flex-1 min-h-0">
          <canvas ref={canvasRef} className="w-full h-full rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700" />
        </div>

        {/* Results Table */}
        <div className="w-80 overflow-auto bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-1.5 text-left text-gray-600 dark:text-gray-400">Algorithm</th>
                <th className="p-1.5 text-right text-gray-600 dark:text-gray-400">Time</th>
                <th className="p-1.5 text-right text-gray-600 dark:text-gray-400">Comps</th>
                <th className="p-1.5 text-right text-gray-600 dark:text-gray-400">Big-O</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} className={`border-t border-gray-200 dark:border-gray-700 ${i === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                  <td className="p-1.5">
                    <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: r.color }} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{r.name}</span>
                    {i === 0 && <span className="ml-1 text-green-600 font-bold">🏆</span>}
                  </td>
                  <td className="p-1.5 text-right font-mono text-gray-600 dark:text-gray-400">{r.timeMs.toFixed(2)}ms</td>
                  <td className="p-1.5 text-right font-mono text-gray-600 dark:text-gray-400">{r.comparisons.toLocaleString()}</td>
                  <td className="p-1.5 text-right font-mono text-gray-500">{r.bigO}</td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400 italic">Run a benchmark to see results</td></tr>
              )}
            </tbody>
          </table>

          {/* Complexity Reference */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Complexity Reference</div>
            {(Object.keys(ALGO_INFO) as AlgoId[]).map(id => (
              <div key={id} className="text-[10px] text-gray-500 flex justify-between">
                <span>{ALGO_INFO[id].name}</span>
                <span className="font-mono">{ALGO_INFO[id].best} / {ALGO_INFO[id].avg} / {ALGO_INFO[id].worst}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
