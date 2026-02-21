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

  // Sandbox state
  const [useCustom, setUseCustom] = useState(false);
  const [customKnapsackItems, setCustomKnapsackItems] = useState<KnapsackItem[]>([{ weight: 1, value: 1 }, { weight: 3, value: 4 }, { weight: 4, value: 5 }, { weight: 5, value: 7 }]);
  const [customKnapsackCap, setCustomKnapsackCap] = useState(7);
  const [customLcsA, setCustomLcsA] = useState('ABCBDAB');
  const [customLcsB, setCustomLcsB] = useState('BDCAB');
  const [customCoins, setCustomCoins] = useState('1,5,6,9');
  const [customAmount, setCustomAmount] = useState(11);

  const generateSteps = useCallback(() => {
    const allSteps: { grid: CellState[][]; desc: string }[] = [];

    if (problem === 'knapsack') {
      let items: KnapsackItem[];
      let capacity: number;
      if (useCustom) {
        items = customKnapsackItems.filter(it => it.weight > 0);
        capacity = Math.max(1, customKnapsackCap);
      } else {
        const p = KNAPSACK_PRESETS[preset] || KNAPSACK_PRESETS[0];
        items = p.items;
        capacity = p.capacity;
      }
      if (items.length === 0) items = [{ weight: 1, value: 1 }];
      const n = items.length;
      const W = Math.min(capacity, 50);
      const dp: number[][] = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

      setRowHeaders(['0', ...items.map((it, i) => `Item${i + 1}(w=${it.weight},v=${it.value})`)]);
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
          if (items[i - 1].weight <= w) {
            dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - items[i - 1].weight] + items[i - 1].value);
          } else {
            dp[i][w] = dp[i - 1][w];
          }
          allSteps.push({ grid: toGrid(i, w, new Set()), desc: `dp[${i}][${w}] = ${dp[i][w]}. ${items[i - 1].weight <= w ? 'Item fits, take max(skip, take).' : 'Item too heavy, skip.'}` });
        }
      }

      // Backtrack solution
      const sol = new Set<string>();
      let i = n, w = W;
      while (i > 0 && w > 0) {
        if (dp[i][w] !== dp[i - 1][w]) {
          sol.add(`${i}-${w}`);
          w -= items[i - 1].weight;
        }
        i--;
      }
      allSteps.push({ grid: toGrid(-1, -1, sol), desc: `Optimal value: ${dp[n][W]}. Highlighted cells show selected items.` });

    } else if (problem === 'lcs') {
      let strA: string, strB: string;
      if (useCustom) {
        strA = customLcsA || 'AB';
        strB = customLcsB || 'AB';
      } else {
        const p = LCS_PRESETS[preset] || LCS_PRESETS[0];
        strA = p.a;
        strB = p.b;
      }
      // Limit length to prevent huge grids
      strA = strA.slice(0, 20);
      strB = strB.slice(0, 20);
      const m = strA.length, n = strB.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

      setRowHeaders(['', ...strA.split('')]);
      setColHeaders(['', ...strB.split('')]);

      const toGrid = (hi: number, hj: number, sol: Set<string>): CellState[][] =>
        dp.map((row, i) => row.map((v, j) => ({
          row: i, col: j, value: v,
          highlighted: i === hi && j === hj,
          inSolution: sol.has(`${i}-${j}`),
        })));

      allSteps.push({ grid: toGrid(-1, -1, new Set()), desc: `LCS of "${strA}" and "${strB}". Initialize table.` });

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (strA[i - 1] === strB[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
          allSteps.push({ grid: toGrid(i, j, new Set()), desc: `dp[${i}][${j}] = ${dp[i][j]}. ${strA[i - 1] === strB[j - 1] ? `Match '${strA[i - 1]}'! Diagonal + 1.` : 'No match, take max of left/top.'}` });
        }
      }

      // Backtrack
      const sol = new Set<string>();
      let i = m, j = n;
      while (i > 0 && j > 0) {
        if (strA[i - 1] === strB[j - 1]) { sol.add(`${i}-${j}`); i--; j--; }
        else if (dp[i - 1][j] > dp[i][j - 1]) i--;
        else j--;
      }
      allSteps.push({ grid: toGrid(-1, -1, sol), desc: `LCS length: ${dp[m][n]}. Green cells trace the subsequence.` });

    } else {
      let coins: number[];
      let amount: number;
      if (useCustom) {
        coins = customCoins.split(',').map(Number).filter(v => v > 0);
        amount = Math.max(1, Math.min(customAmount, 100));
      } else {
        const p = COIN_PRESETS[preset] || COIN_PRESETS[0];
        coins = p.coins;
        amount = p.amount;
      }
      if (coins.length === 0) coins = [1];
      const dp: number[] = Array(amount + 1).fill(Infinity);
      dp[0] = 0;

      setRowHeaders(coins.map(c => `Coin ${c}`));
      setColHeaders(Array.from({ length: amount + 1 }, (_, i) => String(i)));

      const allGridSteps: { grid: CellState[][]; desc: string }[] = [];

      allGridSteps.push({
        grid: [dp.map((v, j) => ({ row: 0, col: j, value: v, highlighted: false, inSolution: false }))],
        desc: `Coin Change: Make ${amount} with coins [${coins.join(', ')}]. dp[0]=0, rest=inf.`,
      });

      for (let ci = 0; ci < coins.length; ci++) {
        const c = coins[ci];
        for (let a = c; a <= amount; a++) {
          if (dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
          allGridSteps.push({
            grid: [dp.map((v, j) => ({ row: 0, col: j, value: v === Infinity ? -1 : v, highlighted: j === a, inSolution: false }))],
            desc: `Coin ${c}, amount ${a}: dp[${a}] = ${dp[a] === Infinity ? '\u221e' : dp[a]}`,
          });
        }
      }

      allGridSteps.push({
        grid: [dp.map((v, j) => ({ row: 0, col: j, value: v === Infinity ? -1 : v, highlighted: false, inSolution: j === amount }))],
        desc: `Minimum coins for ${amount}: ${dp[amount] === Infinity ? 'impossible' : dp[amount]}`,
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
  }, [problem, preset, useCustom, customKnapsackItems, customKnapsackCap, customLcsA, customLcsB, customCoins, customAmount]);

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

  const toggleSandbox = () => {
    if (!useCustom) {
      // Entering sandbox: populate custom fields from current preset
      if (problem === 'knapsack') {
        const p = KNAPSACK_PRESETS[preset] || KNAPSACK_PRESETS[0];
        setCustomKnapsackItems(p.items.map(it => ({ ...it })));
        setCustomKnapsackCap(p.capacity);
      } else if (problem === 'lcs') {
        const p = LCS_PRESETS[preset] || LCS_PRESETS[0];
        setCustomLcsA(p.a);
        setCustomLcsB(p.b);
      } else {
        const p = COIN_PRESETS[preset] || COIN_PRESETS[0];
        setCustomCoins(p.coins.join(','));
        setCustomAmount(p.amount);
      }
    }
    setUseCustom(!useCustom);
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const inputClass = 'px-2 py-1 text-sm rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <button
          onClick={toggleSandbox}
          className={`px-3 py-1.5 text-sm rounded-lg font-semibold ${useCustom ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
        >
          {useCustom ? 'Use Presets' : 'Custom Input'}
        </button>

        <select value={problem} onChange={e => { setProblem(e.target.value as DPProblem); setPreset(0); setUseCustom(false); }}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="knapsack">0/1 Knapsack</option>
          <option value="lcs">Longest Common Subsequence</option>
          <option value="coin-change">Coin Change</option>
        </select>

        {!useCustom && (
          <select value={preset} onChange={e => setPreset(Number(e.target.value))}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            {presetOptions.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        )}

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={30} max={800} step={30} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-500 w-12">{speed}ms</span>
        </div>

        <div className="flex gap-1 ml-auto">
          {!isPlaying ? (
            <button onClick={play} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Play</button>
          ) : (
            <button onClick={pause} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Pause</button>
          )}
          <button onClick={() => setStep(s => Math.min(s + 1, totalSteps - 1))} disabled={isPlaying}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Step</button>
          <button onClick={() => { isPlayingRef.current = false; setIsPlaying(false); setStep(0); }}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Reset</button>
        </div>
      </div>

      {/* Sandbox Controls */}
      {useCustom && (
        <div className="flex flex-wrap gap-2 mb-2 items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-2">
          {problem === 'knapsack' && (
            <div className="w-full">
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Capacity:</label>
                <input
                  type="number" min={1} max={50}
                  value={customKnapsackCap}
                  onChange={e => setCustomKnapsackCap(Math.max(1, Number(e.target.value)))}
                  className={`${inputClass} w-16`}
                />
                <button onClick={() => { if (customKnapsackItems.length < 8) setCustomKnapsackItems(prev => [...prev, { weight: 1, value: 1 }]); }}
                  className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" disabled={customKnapsackItems.length >= 8}>
                  + Add Item
                </button>
                <span className="text-[10px] text-gray-500">{customKnapsackItems.length}/8 items</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {customKnapsackItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
                    <span className="text-[10px] text-gray-500 font-medium">#{idx + 1}</span>
                    <span className="text-[10px] text-gray-400">w:</span>
                    <input type="number" min={1} max={50} value={item.weight}
                      onChange={e => setCustomKnapsackItems(prev => prev.map((it, i) => i === idx ? { ...it, weight: Math.max(1, Number(e.target.value)) } : it))}
                      className="w-10 px-1 py-0 text-xs rounded bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-center" />
                    <span className="text-[10px] text-gray-400">v:</span>
                    <input type="number" min={1} max={99} value={item.value}
                      onChange={e => setCustomKnapsackItems(prev => prev.map((it, i) => i === idx ? { ...it, value: Math.max(1, Number(e.target.value)) } : it))}
                      className="w-10 px-1 py-0 text-xs rounded bg-transparent border-b border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-center" />
                    {customKnapsackItems.length > 1 && (
                      <button onClick={() => setCustomKnapsackItems(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 text-xs font-bold px-0.5">x</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {problem === 'lcs' && (
            <>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">String A:</label>
                <input
                  value={customLcsA}
                  onChange={e => setCustomLcsA(e.target.value.toUpperCase())}
                  className={`${inputClass} w-32`}
                  placeholder="ABCBDAB"
                  maxLength={20}
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-400">String B:</label>
                <input
                  value={customLcsB}
                  onChange={e => setCustomLcsB(e.target.value.toUpperCase())}
                  className={`${inputClass} w-32`}
                  placeholder="BDCAB"
                  maxLength={20}
                />
              </div>
              <span className="text-[10px] text-gray-500">Max 20 characters per string</span>
            </>
          )}
          {problem === 'coin-change' && (
            <div className="w-full flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Target:</label>
                <input
                  type="number" min={1} max={100}
                  value={customAmount}
                  onChange={e => setCustomAmount(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className={`${inputClass} w-16`}
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">Coins:</label>
                {customCoins.split(',').filter(Boolean).map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-mono font-bold">
                    {c.trim()}
                    <button onClick={() => { const arr = customCoins.split(',').filter(Boolean); arr.splice(i, 1); setCustomCoins(arr.join(',')); }}
                      className="text-blue-400 hover:text-red-500 ml-0.5 font-bold">x</button>
                  </span>
                ))}
                <input type="number" min={1} max={99} placeholder="+"
                  className="w-10 px-1 py-0.5 text-xs rounded bg-white dark:bg-gray-800 border border-dashed border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100 text-center"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = Number((e.target as HTMLInputElement).value);
                      if (val > 0) { setCustomCoins(prev => prev ? prev + ',' + val : String(val)); (e.target as HTMLInputElement).value = ''; }
                    }
                  }}
                />
                <span className="text-[10px] text-gray-500">Type a number + Enter to add</span>
              </div>
            </div>
          )}
        </div>
      )}

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
                  {cell.value === -1 ? '\u221e' : cell.value}
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
