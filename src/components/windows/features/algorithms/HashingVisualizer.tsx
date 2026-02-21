import React, { useState, useCallback, useRef } from 'react';

type CollisionStrategy = 'chaining' | 'linear-probing' | 'quadratic-probing' | 'double-hashing';

interface Bucket {
  values: { key: number; label: string }[];
  highlighted: boolean;
  probed: boolean;
}

const TABLE_SIZE = 13;

function hashFn(key: number, size: number): number {
  return key % size;
}

function hash2(key: number, size: number): number {
  return 7 - (key % 7) || 1;
}

export const HashingVisualizer: React.FC = () => {
  const [strategy, setStrategy] = useState<CollisionStrategy>('chaining');
  const [tableSize] = useState(TABLE_SIZE);
  const [table, setTable] = useState<Bucket[]>(() =>
    Array.from({ length: TABLE_SIZE }, () => ({ values: [], highlighted: false, probed: false }))
  );
  const [inputValue, setInputValue] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [speed, setSpeed] = useState(300);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);

  const resetTable = useCallback(() => {
    setTable(Array.from({ length: tableSize }, () => ({ values: [], highlighted: false, probed: false })));
    setLog([]);
  }, [tableSize]);

  const clearHighlights = useCallback(() => {
    setTable(prev => prev.map(b => ({ ...b, highlighted: false, probed: false })));
  }, []);

  const insertKey = useCallback(async (key: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    clearHighlights();

    const h = hashFn(key, tableSize);

    if (strategy === 'chaining') {
      setTable(prev => {
        const next = prev.map(b => ({ ...b, highlighted: false, probed: false }));
        next[h] = { ...next[h], highlighted: true };
        return next;
      });
      setLog(l => [...l, `hash(${key}) = ${key} % ${tableSize} = ${h}`]);
      await new Promise(r => setTimeout(r, speed));

      setTable(prev => {
        const next = [...prev];
        next[h] = { values: [...next[h].values, { key, label: String(key) }], highlighted: true, probed: false };
        return next;
      });
      const collision = table[h].values.length > 0;
      setLog(l => [...l, collision 
        ? `Collision at index ${h}! Chained → bucket now has ${table[h].values.length + 1} elements.`
        : `Inserted ${key} at index ${h}.`]);

    } else {
      // Open addressing
      let idx = h;
      let probeCount = 0;
      let placed = false;

      setLog(l => [...l, `hash(${key}) = ${key} % ${tableSize} = ${h}`]);

      while (probeCount < tableSize) {
        setTable(prev => {
          const next = prev.map(b => ({ ...b, highlighted: false }));
          next[idx] = { ...next[idx], highlighted: true, probed: true };
          return next;
        });
        await new Promise(r => setTimeout(r, speed));

        if (table[idx].values.length === 0) {
          // Actually check current state
          setTable(prev => {
            if (prev[idx].values.length === 0) {
              const next = [...prev];
              next[idx] = { values: [{ key, label: String(key) }], highlighted: true, probed: false };
              placed = true;
              return next;
            }
            return prev;
          });
          if (!placed) {
            // re-check from current state
            const currentTable = await new Promise<Bucket[]>(resolve => {
              setTable(prev => { resolve(prev); return prev; });
            });
            if (currentTable[idx].values.length === 0) {
              setTable(prev => {
                const next = [...prev];
                next[idx] = { values: [{ key, label: String(key) }], highlighted: true, probed: false };
                return next;
              });
              placed = true;
            }
          }
          if (placed) {
            setLog(l => [...l, probeCount > 0
              ? `Collision resolved after ${probeCount} probes. Inserted at index ${idx}.`
              : `Inserted ${key} at index ${idx}.`]);
            break;
          }
        }

        probeCount++;
        if (strategy === 'linear-probing') {
          idx = (h + probeCount) % tableSize;
          setLog(l => [...l, `Probe ${probeCount}: index ${idx} (linear)`]);
        } else if (strategy === 'quadratic-probing') {
          idx = (h + probeCount * probeCount) % tableSize;
          setLog(l => [...l, `Probe ${probeCount}: index ${idx} (quadratic)`]);
        } else {
          const step2 = hash2(key, tableSize);
          idx = (h + probeCount * step2) % tableSize;
          setLog(l => [...l, `Probe ${probeCount}: index ${idx} (double hash, h2=${step2})`]);
        }
      }

      if (!placed) {
        setLog(l => [...l, `Table full! Cannot insert ${key}.`]);
      }
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, [strategy, tableSize, speed, table, clearHighlights]);

  const handleInsert = () => {
    const val = parseInt(inputValue);
    if (!isNaN(val)) {
      insertKey(val);
      setInputValue('');
    }
  };

  const insertRandom = async () => {
    const vals = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
    for (const v of vals) {
      await insertKey(v);
      await new Promise(r => setTimeout(r, speed));
    }
  };

  const loadFactor = table.reduce((acc, b) => acc + b.values.length, 0) / tableSize;

  const descriptions: Record<CollisionStrategy, string> = {
    'chaining': 'Separate Chaining: Each slot holds a linked list. Collisions append to the list. Load factor can exceed 1.',
    'linear-probing': 'Linear Probing: On collision, check next slot sequentially. Prone to primary clustering.',
    'quadratic-probing': 'Quadratic Probing: On collision, probe at h+1², h+2², h+3²... Reduces primary clustering.',
    'double-hashing': 'Double Hashing: On collision, use second hash h₂(k) as step. Best distribution.',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={strategy} onChange={e => { setStrategy(e.target.value as CollisionStrategy); resetTable(); }}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="chaining">Separate Chaining</option>
          <option value="linear-probing">Linear Probing</option>
          <option value="quadratic-probing">Quadratic Probing</option>
          <option value="double-hashing">Double Hashing</option>
        </select>

        <input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)}
          placeholder="Key (integer)" onKeyDown={e => e.key === 'Enter' && handleInsert()}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-32" />

        <button onClick={handleInsert} disabled={isAnimating}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Insert</button>
        <button onClick={insertRandom} disabled={isAnimating}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">+ 5 Random</button>
        <button onClick={resetTable}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={50} max={1000} step={50} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-20" />
        </div>

        <span className="text-xs text-gray-500 ml-auto">Load Factor: {loadFactor.toFixed(2)} | h(k) = k mod {tableSize}</span>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {descriptions[strategy]}
      </div>

      {/* Hash Table Visualization */}
      <div className="flex-1 min-h-0 flex gap-3 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-1">
            {table.map((bucket, i) => (
              <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all duration-200
                ${bucket.highlighted ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-400' : 
                  bucket.probed ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 
                  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 w-6 text-right">{i}</span>
                <div className="flex-1 flex items-center gap-1 min-h-[28px] flex-wrap">
                  {bucket.values.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">empty</span>
                  ) : (
                    bucket.values.map((v, vi) => (
                      <React.Fragment key={vi}>
                        {vi > 0 && strategy === 'chaining' && <span className="text-gray-400 text-xs">→</span>}
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-mono font-bold
                          ${bucket.highlighted ? 'bg-amber-400 text-black' : 'bg-blue-500 text-white'}`}>
                          {v.label}
                        </span>
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="w-64 overflow-auto bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Operation Log</div>
          <div className="space-y-0.5">
            {log.slice(-20).map((l, i) => (
              <div key={i} className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
