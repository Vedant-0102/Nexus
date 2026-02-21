import React, { useState, useCallback, useRef, useEffect } from 'react';

type DataStructure = 'trie' | 'segment-tree';

// ==================== Trie ====================
interface TrieNode {
  children: Map<string, TrieNode>;
  isEnd: boolean;
  x: number;
  y: number;
  char: string;
  highlighted: boolean;
  path: boolean;
}

function createTrieNode(char: string): TrieNode {
  return { children: new Map(), isEnd: false, x: 0, y: 0, char, highlighted: false, path: false };
}

function insertTrie(root: TrieNode, word: string) {
  let node = root;
  for (const ch of word) {
    if (!node.children.has(ch)) node.children.set(ch, createTrieNode(ch));
    node = node.children.get(ch)!;
  }
  node.isEnd = true;
}

function searchTrie(root: TrieNode, word: string): { found: boolean; path: TrieNode[] } {
  const path: TrieNode[] = [root];
  let node = root;
  for (const ch of word) {
    if (!node.children.has(ch)) return { found: false, path };
    node = node.children.get(ch)!;
    path.push(node);
  }
  return { found: node.isEnd, path };
}

function layoutTrie(node: TrieNode, x: number, y: number, spread: number, level: number) {
  node.x = x;
  node.y = y;
  const children = Array.from(node.children.values());
  if (children.length === 0) return;
  const totalW = (children.length - 1) * spread;
  children.forEach((child, i) => {
    const cx = x - totalW / 2 + i * spread;
    layoutTrie(child, cx, y + 55, spread * 0.6, level + 1);
  });
}

function resetTrieHighlights(node: TrieNode) {
  node.highlighted = false;
  node.path = false;
  for (const child of node.children.values()) resetTrieHighlights(child);
}

// ==================== Segment Tree ====================
interface SegNode {
  value: number;
  start: number;
  end: number;
  left: SegNode | null;
  right: SegNode | null;
  x: number;
  y: number;
  highlighted: boolean;
  queried: boolean;
}

function buildSegTree(arr: number[], start: number, end: number): SegNode {
  if (start === end) return { value: arr[start], start, end, left: null, right: null, x: 0, y: 0, highlighted: false, queried: false };
  const mid = Math.floor((start + end) / 2);
  const left = buildSegTree(arr, start, mid);
  const right = buildSegTree(arr, mid + 1, end);
  return { value: left.value + right.value, start, end, left, right, x: 0, y: 0, highlighted: false, queried: false };
}

function layoutSegTree(node: SegNode | null, x: number, y: number, spread: number) {
  if (!node) return;
  node.x = x;
  node.y = y;
  layoutSegTree(node.left, x - spread, y + 60, spread * 0.5);
  layoutSegTree(node.right, x + spread, y + 60, spread * 0.5);
}

function resetSegHighlights(node: SegNode | null) {
  if (!node) return;
  node.highlighted = false;
  node.queried = false;
  resetSegHighlights(node.left);
  resetSegHighlights(node.right);
}

function querySegTree(node: SegNode | null, l: number, r: number, steps: SegNode[]): number {
  if (!node) return 0;
  steps.push(node);
  if (node.start >= l && node.end <= r) {
    node.queried = true;
    return node.value;
  }
  if (node.end < l || node.start > r) return 0;
  node.highlighted = true;
  return querySegTree(node.left, l, r, steps) + querySegTree(node.right, l, r, steps);
}

export const TrieSegmentTree: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ds, setDs] = useState<DataStructure>('trie');

  // Trie state
  const [trieRoot, setTrieRoot] = useState<TrieNode>(() => {
    const root = createTrieNode('');
    for (const w of ['apple', 'app', 'apt', 'bat', 'bad', 'ball', 'cat', 'car']) insertTrie(root, w);
    layoutTrie(root, 400, 30, 120, 0);
    return root;
  });
  const [trieInput, setTrieInput] = useState('');
  const [trieSearchInput, setTrieSearchInput] = useState('');
  const [trieSearchResult, setTrieSearchResult] = useState<string | null>(null);
  const [trieWords] = useState<string[]>(['apple', 'app', 'apt', 'bat', 'bad', 'ball', 'cat', 'car']);

  // Segment Tree state
  const [segArr, setSegArr] = useState([2, 5, 1, 4, 9, 3, 7, 6]);
  const [segRoot, setSegRoot] = useState<SegNode | null>(null);
  const [queryL, setQueryL] = useState(1);
  const [queryR, setQueryR] = useState(5);
  const [queryResult, setQueryResult] = useState<number | null>(null);

  useEffect(() => {
    if (ds === 'segment-tree') {
      const root = buildSegTree(segArr, 0, segArr.length - 1);
      layoutSegTree(root, 400, 30, 160);
      setSegRoot(root);
      setQueryResult(null);
    }
  }, [ds, segArr]);

  // Draw Trie on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    const offsetX = w / 2 - 400;
    const offsetY = 10;

    if (ds === 'trie') {
      const drawTrieNode = (node: TrieNode) => {
        for (const child of node.children.values()) {
          ctx.beginPath();
          ctx.moveTo(node.x + offsetX, node.y + offsetY);
          ctx.lineTo(child.x + offsetX, child.y + offsetY);
          ctx.strokeStyle = child.path ? '#22c55e' : '#64748b';
          ctx.lineWidth = child.path ? 2.5 : 1.5;
          ctx.stroke();
          drawTrieNode(child);
        }
        ctx.beginPath();
        ctx.arc(node.x + offsetX, node.y + offsetY, 16, 0, Math.PI * 2);
        if (node.highlighted) { ctx.fillStyle = '#f59e0b'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 10; }
        else if (node.path) { ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 6; }
        else if (node.isEnd) { ctx.fillStyle = '#ef4444'; ctx.shadowBlur = 0; }
        else { ctx.fillStyle = '#3b82f6'; ctx.shadowBlur = 0; }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDark ? '#64748b' : '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.char || 'ε', node.x + offsetX, node.y + offsetY);
      };
      drawTrieNode(trieRoot);
    } else if (segRoot) {
      const drawSegNode = (node: SegNode | null) => {
        if (!node) return;
        if (node.left) {
          ctx.beginPath();
          ctx.moveTo(node.x + offsetX, node.y + offsetY);
          ctx.lineTo(node.left.x + offsetX, node.left.y + offsetY);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          drawSegNode(node.left);
        }
        if (node.right) {
          ctx.beginPath();
          ctx.moveTo(node.x + offsetX, node.y + offsetY);
          ctx.lineTo(node.right.x + offsetX, node.right.y + offsetY);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          drawSegNode(node.right);
        }
        ctx.beginPath();
        const r = 20;
        ctx.arc(node.x + offsetX, node.y + offsetY, r, 0, Math.PI * 2);
        if (node.queried) { ctx.fillStyle = '#22c55e'; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 8; }
        else if (node.highlighted) { ctx.fillStyle = '#f59e0b'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 6; }
        else { ctx.fillStyle = '#3b82f6'; ctx.shadowBlur = 0; }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isDark ? '#64748b' : '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.value), node.x + offsetX, node.y + offsetY - 5);
        ctx.font = '8px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`[${node.start},${node.end}]`, node.x + offsetX, node.y + offsetY + 8);
      };
      drawSegNode(segRoot);
    }
    };
    render();
    const obs = new ResizeObserver(render);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [ds, trieRoot, segRoot, trieSearchResult, queryResult]);

  const handleTrieInsert = useCallback(() => {
    if (!trieInput.trim()) return;
    const word = trieInput.trim().toLowerCase();
    insertTrie(trieRoot, word);
    layoutTrie(trieRoot, 400, 30, 120, 0);
    setTrieRoot({ ...trieRoot });
    setTrieInput('');
    trieWords.push(word);
  }, [trieInput, trieRoot, trieWords]);

  const handleTrieSearch = useCallback(() => {
    if (!trieSearchInput.trim()) return;
    resetTrieHighlights(trieRoot);
    const { found, path } = searchTrie(trieRoot, trieSearchInput.trim().toLowerCase());
    for (const n of path) { n.path = true; }
    if (path.length > 0) path[path.length - 1].highlighted = true;
    setTrieSearchResult(found ? `"${trieSearchInput}" found!` : `"${trieSearchInput}" not found.`);
    setTrieRoot({ ...trieRoot });
  }, [trieSearchInput, trieRoot]);

  const handleSegQuery = useCallback(() => {
    if (!segRoot) return;
    resetSegHighlights(segRoot);
    const steps: SegNode[] = [];
    const result = querySegTree(segRoot, queryL, queryR, steps);
    setQueryResult(result);
    setSegRoot({ ...segRoot });
  }, [segRoot, queryL, queryR]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-teal-50 dark:from-gray-950 dark:to-teal-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={ds} onChange={e => setDs(e.target.value as DataStructure)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="trie">Trie (Prefix Tree)</option>
          <option value="segment-tree">Segment Tree</option>
        </select>

        {ds === 'trie' && (
          <>
            <input type="text" value={trieInput} onChange={e => setTrieInput(e.target.value)}
              placeholder="Insert word" onKeyDown={e => e.key === 'Enter' && handleTrieInsert()}
              className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-32" />
            <button onClick={handleTrieInsert} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Insert</button>
            <input type="text" value={trieSearchInput} onChange={e => setTrieSearchInput(e.target.value)}
              placeholder="Search word" onKeyDown={e => e.key === 'Enter' && handleTrieSearch()}
              className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-32" />
            <button onClick={handleTrieSearch} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Search</button>
            {trieSearchResult && (
              <span className={`text-xs font-bold ${trieSearchResult.includes('found!') ? 'text-green-600' : 'text-red-500'}`}>
                {trieSearchResult}
              </span>
            )}
          </>
        )}

        {ds === 'segment-tree' && (
          <>
            <span className="text-xs text-gray-500">Array: [{segArr.join(', ')}]</span>
            <span className="text-xs text-gray-500 ml-2">Query range:</span>
            <input type="number" value={queryL} onChange={e => setQueryL(Number(e.target.value))} min={0} max={segArr.length - 1}
              className="px-2 py-1 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-16" />
            <span className="text-xs text-gray-500">to</span>
            <input type="number" value={queryR} onChange={e => setQueryR(Number(e.target.value))} min={0} max={segArr.length - 1}
              className="px-2 py-1 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 w-16" />
            <button onClick={handleSegQuery} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Query Sum</button>
            {queryResult !== null && (
              <span className="text-xs font-bold text-green-600">Sum[{queryL}..{queryR}] = {queryResult}</span>
            )}
          </>
        )}
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {ds === 'trie'
          ? 'Trie: Prefix tree for efficient string operations. Insert/Search in O(m) where m=word length. Red nodes mark word endings. Green path shows search result.'
          : 'Segment Tree: Binary tree for range queries (sum, min, max) in O(log n) and point updates in O(log n). Green = queried nodes. Yellow = visited nodes.'
        }
      </div>

      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef}
          className="w-full h-full rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700" />
      </div>

      {ds === 'trie' && (
        <div className="mt-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Words in trie: </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">{trieWords.join(', ')}</span>
        </div>
      )}

      {ds === 'segment-tree' && (
        <div className="mt-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 flex gap-2">
          {segArr.map((v, i) => (
            <div key={i} className={`flex flex-col items-center px-2 py-1 rounded text-xs font-mono
              ${i >= queryL && i <= queryR && queryResult !== null ? 'bg-green-200 dark:bg-green-800 font-bold' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <span className="text-gray-400 text-[10px]">[{i}]</span>
              <span className="text-gray-700 dark:text-gray-300">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
