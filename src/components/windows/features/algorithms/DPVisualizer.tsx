import React, { useState, useCallback, useEffect, useRef } from 'react';

type DPProblem = 'knapsack' | 'lcs' | 'coin-change';

interface KnapsackItem { weight: number; value: number; }

const KNAPSACK_PRESETS: { label: string; items: KnapsackItem[]; capacity: number }[] = [
  { label: 'Small (4 items, cap 7)', items: [{ weight: 1, value: 1 }, { weight: 3, value: 4 }, { weight: 4, value: 5 }, { weight: 5, value: 7 }], capacity: 7 },
  { label: 'Medium (5 items, cap 10)', items: [{ weight: 2, value: 3 }, { weight: 3, value: 4 }, { weight: 4, value: 5 }, { weight: 5, value: 8 }, { weight: 9, value: 10 }], capacity: 10 },
];

const LCS_PRESETS = [
  { label: 'Short', a: 'ABCBDAB', b: 'BDCAB' },
  { label: 'Medium', a: 'AGGTAB', b: 'GXTXAYB' },
];

const COIN_PRESETS = [
  { label: 'Standard (11)', coins: [1, 5, 6, 9], amount: 11 },
  { label: 'Classic (30)', coins: [1, 5, 10, 25], amount: 30 },
];

interface CellState {
  row: number;
  col: number;
  value: number;
  highlighted: boolean;
  inSolution: boolean;
}

export const DPVisualizer: React.FC = () => {
  const [problem, setProblem] = useState<DPProblem>('knapsack');
  const [preset, setPreset] = useState(0);
  const [speed, setSpeed] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [step, setStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [description, setDescription] = useState('');
  const [rowHeaders, setRowHeaders] = useState<string[]>([]);
  const [colHeaders, setColHeaders] = useState<string[]>([]);
  const isPlayingRef = useRef(false);
  const stepsRef = useRef<{ grid: CellState[][]; desc: string }[]>([]);

  const generateSteps = useCallback(() => {
    const allSteps: { grid: CellState[][]; desc: string }[] = [];

    if (problem === 'knapsack') {
      const p = KNAPSACK_PRESETS[preset] || KNAPSACK_PRESETS[0];
      const n = p.items.length;
      const W = p.capacity;
      const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

      setRowHeaders(['0', ...p.items.map((it, i) => `Item${i + 1}(w=${it.weight},v=${it.value})`)]);
      setColHeaders(Array.from({ length: W + 1 }, (_, i) => String(i)));

      const toGrid = (hi: number, hj: number, sol: Set<string>): CellState[][] =>
        dp.map((row, i) => row.map((v, j) => ({
          row: i, col: j, value: v,
          highlighted: i === hi && j === hj,
          inSolution: sol.has(`${i}-${j}`),
        })));

      allSteps.push({ grid: toGrid(-1, -1, new Set()), desc: 'Initialize DP table. dp[i][w] = max value with first i items and capacity w.' });

      for (let i = 1; i <= n; i++) {
        for (let w = 1; w <= W; w++) {
          if (p.items[i - 1].weight <= w) {
            dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - p.items[i - 1].weight] + p.items[i - 1].value);
          } else {
            dp[i][w] = dp[i - 1][w];
          }
          allSteps.push({ grid: toGrid(i, w, new Set()), desc: `dp[${i}][${w}] = ${dp[i][w]}. ${p.items[i - 1].weight <= w ? 'Item fits, take max(skip, take).' : 'Item too heavy, skip.'}` });
        }
      }

      // Backtrack solution
      const sol = new Set<string>();
      let i = n, w = W;
      while (i > 0 && w > 0) {
        if (dp[i][w] !== dp[i - 1][w]) {
          sol.add(`${i}-${w}`);
          w -= p.items[i - 1].weight;
        }
        i--;
      }
      allSteps.push({ grid: toGrid(-1, -1, sol), desc: `Optimal value: ${dp[n][W]}. Highlighted cells show selected items.` });

    } else if (problem === 'lcs') {
      const p = LCS_PRESETS[preset] || LCS_PRESETS[0];
      const m = p.a.length, n = p.b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

      setRowHeaders(['', ...p.a.split('')]);
      setColHeaders(['', ...p.b.split('')]);

      const toGrid = (hi: number, hj: number, sol: Set<string>): CellState[][] =>
        dp.map((row, i) => row.map((v, j) => ({
          row: i, col: j, value: v,
          highlighted: i === hi && j === hj,
          inSolution: sol.has(`${i}-${j}`),
        })));

      allSteps.push({ grid: toGrid(-1, -1, new Set()), desc: `LCS of "${p.a}" and "${p.b}". Initialize table.` });

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (p.a[i - 1] === p.b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
          allSteps.push({ grid: toGrid(i, j, new Set()), desc: `dp[${i}][${j}] = ${dp[i][j]}. ${p.a[i - 1] === p.b[j - 1] ? `Match '${p.a[i - 1]}'! Diagonal + 1.` : 'No match, take max of left/top.'}` });
        }
      }

      // Backtrack
      const sol = new Set<string>();
      let i = m, j = n;
      while (i > 0 && j > 0) {
        if (p.a[i - 1] === p.b[j - 1]) { sol.add(`${i}-${j}`); i--; j--; }
        else if (dp[i - 1][j] > dp[i][j - 1]) i--;
        else j--;
      }
      allSteps.push({ grid: toGrid(-1, -1, sol), desc: `LCS length: ${dp[m][n]}. Green cells trace the subsequence.` });

    } else {
      const p = COIN_PRESETS[preset] || COIN_PRESETS[0];
      const dp: number[] = Array(p.amount + 1).fill(Infinity);
      dp[0] = 0;

      setRowHeaders(p.coins.map(c => `Coin ${c}`));
      setColHeaders(Array.from({ length: p.amount + 1 }, (_, i) => String(i)));

      const history: number[][] = []; // row per coin
      const allGridSteps: { grid: CellState[][]; desc: string }[] = [];

      allGridSteps.push({
        grid: [dp.map((v, j) => ({ row: 0, col: j, value: v, highlighted: false, inSolution: false }))],
        desc: `Coin Change: Make ${p.amount} with coins [${p.coins.join(', ')}]. dp[0]=0, rest=∞.`,
      });

      for (let ci = 0; ci < p.coins.length; ci++) {
        const c = p.coins[ci];
        for (let a = c; a <= p.amount; a++) {
          if (dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
          allGridSteps.push({
            grid: [dp.map((v, j) => ({ row: 0, col: j, value: v === Infinity ? -1 : v, highlighted: j === a, inSolution: false }))],
            desc: `Coin ${c}, amount ${a}: dp[${a}] = ${dp[a] === Infinity ? '∞' : dp[a]}`,
          });
        }
        history.push([...dp]);
      }

      allGridSteps.push({
        grid: [dp.map((v, j) => ({ row: 0, col: j, value: v === Infinity ? -1 : v, highlighted: false, inSolution: j === p.amount }))],
        desc: `Minimum coins for ${p.amount}: ${dp[p.amount] === Infinity ? 'impossible' : dp[p.amount]}`,
      });

      stepsRef.current = allGridSteps;
      setTotalSteps(allGridSteps.length);
      setStep(0);
      setGrid(allGridSteps[0].grid);
      setDescription(allGridSteps[0].desc);
      return;
    }

    stepsRef.current = allSteps;
    setTotalSteps(allSteps.length);
    setStep(0);
    setGrid(allSteps[0].grid);
    setDescription(allSteps[0].desc);
  }, [problem, preset]);

  useEffect(() => { generateSteps(); }, [generateSteps]);

  useEffect(() => {
    if (stepsRef.current[step]) {
      setGrid(stepsRef.current[step].grid);
      setDescription(stepsRef.current[step].desc);
    }
  }, [step]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    let s = step;
    while (s < totalSteps - 1 && isPlayingRef.current) {
      s++;
      setStep(s);
      await new Promise(r => setTimeout(r, speed));
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [step, totalSteps, speed]);

  const pause = () => { isPlayingRef.current = false; setIsPlaying(false); };

  const presetOptions = problem === 'knapsack' ? KNAPSACK_PRESETS : problem === 'lcs' ? LCS_PRESETS : COIN_PRESETS;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={problem} onChange={e => { setProblem(e.target.value as DPProblem); setPreset(0); }}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="knapsack">0/1 Knapsack</option>
          <option value="lcs">Longest Common Subsequence</option>
          <option value="coin-change">Coin Change</option>
        </select>

        <select value={preset} onChange={e => setPreset(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          {presetOptions.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={30} max={800} step={30} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-500 w-12">{speed}ms</span>
        </div>

        <div className="flex gap-1 ml-auto">
          {!isPlaying ? (
            <button onClick={play} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">▶ Play</button>
          ) : (
            <button onClick={pause} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">⏸ Pause</button>
          )}
          <button onClick={() => setStep(s => Math.min(s + 1, totalSteps - 1))} disabled={isPlaying}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Step →</button>
          <button onClick={() => { isPlayingRef.current = false; setIsPlaying(false); setStep(0); }}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">↺ Reset</button>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {description}
      </div>

      {/* DP Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="inline-block min-w-full">
          {/* Column headers */}
          <div className="flex">
            <div className="w-28 flex-shrink-0" />
            {colHeaders.map((h, j) => (
              <div key={j} className="w-10 h-8 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                {h}
              </div>
            ))}
          </div>
          {grid.map((row, i) => (
            <div key={i} className="flex items-center">
              <div className="w-28 flex-shrink-0 text-[10px] font-semibold text-gray-500 dark:text-gray-400 pr-1 text-right truncate">
                {rowHeaders[i] || ''}
              </div>
              {row.map((cell, j) => (
                <div
                  key={j}
                  className={`w-10 h-10 flex items-center justify-center text-[10px] font-mono border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-colors duration-150
                    ${cell.highlighted ? 'bg-amber-400 dark:bg-amber-500 text-black font-bold ring-2 ring-amber-500' : ''}
                    ${cell.inSolution && !cell.highlighted ? 'bg-green-400 dark:bg-green-600 text-white font-bold' : ''}
                    ${!cell.highlighted && !cell.inSolution ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
                  `}
                >
                  {cell.value === -1 ? '∞' : cell.value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Step {step + 1}/{totalSteps}
      </div>
    </div>
  );
};
