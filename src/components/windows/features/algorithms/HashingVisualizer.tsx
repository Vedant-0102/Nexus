import React, { useState, useCallback, useRef } from 'react';

type CollisionStrategy = 'chaining' | 'linear-probing' | 'quadratic-probing' | 'double-hashing';

interface Bucket {
  values: { key: number; label: string }[];
  highlighted: boolean;
  probed: boolean;
  deleted: boolean;
}

const DEFAULT_TABLE_SIZE = 13;
const TABLE_SIZE_OPTIONS = [7, 11, 13, 17, 19, 23, 29, 31];

function hashFn(key: number, size: number): number {
  return ((key % size) + size) % size;
}

function hash2(key: number, size: number): number {
  return 7 - (key % 7) || 1;
}

function createEmptyTable(size: number): Bucket[] {
  return Array.from({ length: size }, () => ({ values: [], highlighted: false, probed: false, deleted: false }));
}

export const HashingVisualizer: React.FC = () => {
  const [strategy, setStrategy] = useState<CollisionStrategy>('chaining');
  const [tableSize, setTableSize] = useState(DEFAULT_TABLE_SIZE);
  const [table, setTable] = useState<Bucket[]>(() => createEmptyTable(DEFAULT_TABLE_SIZE));
  const [inputValue, setInputValue] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [speed, setSpeed] = useState(300);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const isAnimatingRef = useRef(false);

  const resetTable = useCallback((size?: number) => {
    const s = size ?? tableSize;
    setTable(createEmptyTable(s));
    setLog([]);
    setSearchResult(null);
  }, [tableSize]);

  const changeTableSize = useCallback((newSize: number) => {
    setTableSize(newSize);
    resetTable(newSize);
  }, [resetTable]);

  const clearHighlights = useCallback(() => {
    setTable(prev => prev.map(b => ({ ...b, highlighted: false, probed: false })));
    setSearchResult(null);
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
        const next = prev.map(b => ({ ...b }));
        const collision = next[h].values.length > 0;
        next[h] = { values: [...next[h].values, { key, label: String(key) }], highlighted: true, probed: false, deleted: false };
        return next;
      });
      setLog(l => {
        // Check from current table state
        return [...l, `Inserted ${key} at index ${h}.`];
      });

    } else {
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

        // Check current state properly
        const currentTable = await new Promise<Bucket[]>(resolve => {
          setTable(prev => { resolve(prev); return prev; });
        });

        if (currentTable[idx].values.length === 0 || currentTable[idx].deleted) {
          setTable(prev => {
            const next = prev.map(b => ({ ...b }));
            next[idx] = { values: [{ key, label: String(key) }], highlighted: true, probed: false, deleted: false };
            return next;
          });
          placed = true;
          setLog(l => [...l, probeCount > 0
            ? `Collision resolved after ${probeCount} probes. Inserted at index ${idx}.`
            : `Inserted ${key} at index ${idx}.`]);
          break;
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
  }, [strategy, tableSize, speed, clearHighlights]);

  const searchKey = useCallback(async (key: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    clearHighlights();

    const h = hashFn(key, tableSize);
    setLog(l => [...l, `Search: hash(${key}) = ${key} % ${tableSize} = ${h}`]);

    if (strategy === 'chaining') {
      setTable(prev => {
        const next = prev.map(b => ({ ...b, highlighted: false, probed: false }));
        next[h] = { ...next[h], highlighted: true };
        return next;
      });
      await new Promise(r => setTimeout(r, speed));

      const currentTable = await new Promise<Bucket[]>(resolve => {
        setTable(prev => { resolve(prev); return prev; });
      });
      const found = currentTable[h].values.some(v => v.key === key);
      setSearchResult(found ? `Found ${key} at index ${h}` : `${key} not found`);
      setLog(l => [...l, found ? `Found ${key} in chain at index ${h}.` : `${key} not found in chain at index ${h}.`]);

    } else {
      let idx = h;
      let probeCount = 0;
      let found = false;

      while (probeCount < tableSize) {
        setTable(prev => {
          const next = prev.map(b => ({ ...b, highlighted: false }));
          next[idx] = { ...next[idx], highlighted: true, probed: true };
          return next;
        });
        await new Promise(r => setTimeout(r, speed));

        const currentTable = await new Promise<Bucket[]>(resolve => {
          setTable(prev => { resolve(prev); return prev; });
        });

        if (currentTable[idx].values.length === 0 && !currentTable[idx].deleted) {
          break; // Empty slot, key not in table
        }

        if (currentTable[idx].values.length > 0 && currentTable[idx].values[0].key === key) {
          found = true;
          setSearchResult(`Found ${key} at index ${idx}`);
          setLog(l => [...l, `Found ${key} at index ${idx} after ${probeCount} probes.`]);
          break;
        }

        probeCount++;
        if (strategy === 'linear-probing') {
          idx = (h + probeCount) % tableSize;
        } else if (strategy === 'quadratic-probing') {
          idx = (h + probeCount * probeCount) % tableSize;
        } else {
          const step2 = hash2(key, tableSize);
          idx = (h + probeCount * step2) % tableSize;
        }
      }

      if (!found) {
        setSearchResult(`${key} not found`);
        setLog(l => [...l, `${key} not found after ${probeCount} probes.`]);
      }
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, [strategy, tableSize, speed, clearHighlights]);

  const deleteKey = useCallback(async (key: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    clearHighlights();

    const h = hashFn(key, tableSize);
    setLog(l => [...l, `Delete: hash(${key}) = ${key} % ${tableSize} = ${h}`]);

    if (strategy === 'chaining') {
      setTable(prev => {
        const next = prev.map(b => ({ ...b, highlighted: false, probed: false }));
        next[h] = { ...next[h], highlighted: true };
        return next;
      });
      await new Promise(r => setTimeout(r, speed));

      let deleted = false;
      setTable(prev => {
        const next = prev.map(b => ({ ...b }));
        const idx = next[h].values.findIndex(v => v.key === key);
        if (idx !== -1) {
          next[h] = { ...next[h], values: next[h].values.filter((_, i) => i !== idx), highlighted: true };
          deleted = true;
        }
        return next;
      });
      setLog(l => [...l, deleted ? `Deleted ${key} from chain at index ${h}.` : `${key} not found, cannot delete.`]);

    } else {
      let idx = h;
      let probeCount = 0;
      let deleted = false;

      while (probeCount < tableSize) {
        setTable(prev => {
          const next = prev.map(b => ({ ...b, highlighted: false }));
          next[idx] = { ...next[idx], highlighted: true, probed: true };
          return next;
        });
        await new Promise(r => setTimeout(r, speed));

        const currentTable = await new Promise<Bucket[]>(resolve => {
          setTable(prev => { resolve(prev); return prev; });
        });

        if (currentTable[idx].values.length === 0 && !currentTable[idx].deleted) {
          break;
        }

        if (currentTable[idx].values.length > 0 && currentTable[idx].values[0].key === key) {
          setTable(prev => {
            const next = prev.map(b => ({ ...b }));
            next[idx] = { values: [], highlighted: true, probed: false, deleted: true };
            return next;
          });
          deleted = true;
          setLog(l => [...l, `Deleted ${key} at index ${idx}. Marked as tombstone.`]);
          break;
        }

        probeCount++;
        if (strategy === 'linear-probing') {
          idx = (h + probeCount) % tableSize;
        } else if (strategy === 'quadratic-probing') {
          idx = (h + probeCount * probeCount) % tableSize;
        } else {
          const step2 = hash2(key, tableSize);
          idx = (h + probeCount * step2) % tableSize;
        }
      }

      if (!deleted) {
        setLog(l => [...l, `${key} not found, cannot delete.`]);
      }
    }

    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, [strategy, tableSize, speed, clearHighlights]);

  const handleOp = (op: 'insert' | 'search' | 'delete') => {
    const val = parseInt(inputValue);
    if (isNaN(val)) return;
    if (op === 'insert') insertKey(val);
    else if (op === 'search') searchKey(val);
    else deleteKey(val);
    setInputValue('');
  };

  const insertRandom = async () => {
    const vals = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));
    for (const v of vals) {
      await insertKey(v);
      await new Promise(r => setTimeout(r, speed));
    }
  };

  const totalElements = table.reduce((acc, b) => acc + b.values.length, 0);
  const loadFactor = totalElements / tableSize;

  const descriptions: Record<CollisionStrategy, string> = {
    'chaining': 'Separate Chaining: Each slot holds a linked list. Collisions append to the list. Load factor can exceed 1.',
    'linear-probing': 'Linear Probing: On collision, check next slot sequentially. Prone to primary clustering.',
    'quadratic-probing': 'Quadratic Probing: On collision, probe at h+1\u00b2, h+2\u00b2, h+3\u00b2... Reduces primary clustering.',
    'double-hashing': 'Double Hashing: On collision, use second hash h\u2082(k) as step. Best distribution.',
  };

  const selectClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';
  const inputClass = 'px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-orange-50 dark:from-gray-950 dark:to-orange-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        <select value={strategy} onChange={e => { setStrategy(e.target.value as CollisionStrategy); resetTable(); }}
          className={selectClass}>
          <option value="chaining">Separate Chaining</option>
          <option value="linear-probing">Linear Probing</option>
          <option value="quadratic-probing">Quadratic Probing</option>
          <option value="double-hashing">Double Hashing</option>
        </select>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Size:</span>
          <select value={tableSize} onChange={e => changeTableSize(Number(e.target.value))}
            className={selectClass}>
            {TABLE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          <input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)}
            placeholder="Key" onKeyDown={e => e.key === 'Enter' && handleOp('insert')}
            className="w-20 px-2 py-1 text-sm rounded-l-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
          <button onClick={() => handleOp('insert')} disabled={isAnimating}
            className="px-2.5 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Insert</button>
          <button onClick={() => handleOp('search')} disabled={isAnimating}
            className="px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Find</button>
          <button onClick={() => handleOp('delete')} disabled={isAnimating}
            className="px-2.5 py-1 text-xs font-medium bg-orange-600 text-white rounded-r-md hover:bg-orange-700 disabled:opacity-50">Del</button>
        </div>

        <button onClick={insertRandom} disabled={isAnimating}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">+5 Random</button>
        <button onClick={() => resetTable()}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Clear</button>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={50} max={1000} step={50} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-20" />
        </div>

        {searchResult && (
          <span className={`text-xs px-2 py-1 rounded font-medium ${searchResult.includes('Found') ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
            {searchResult}
          </span>
        )}

        <span className="text-xs text-gray-500 ml-auto">{totalElements} items | Load: {loadFactor.toFixed(2)} | h(k) = k % {tableSize}</span>
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
                  bucket.deleted ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50' :
                  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 w-6 text-right">{i}</span>
                <div className="flex-1 flex items-center gap-1 min-h-[28px] flex-wrap">
                  {bucket.values.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">{bucket.deleted ? 'deleted' : 'empty'}</span>
                  ) : (
                    bucket.values.map((v, vi) => (
                      <React.Fragment key={vi}>
                        {vi > 0 && strategy === 'chaining' && <span className="text-gray-400 text-xs">{'\u2192'}</span>}
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
            {log.slice(-30).map((l, i) => (
              <div key={i} className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
