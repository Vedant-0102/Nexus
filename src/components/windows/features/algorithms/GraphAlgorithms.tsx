import React, { useState, useCallback, useRef, useEffect } from 'react';

interface GraphNode {
  id: string;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

type Algorithm = 'dijkstra' | 'bellman-ford' | 'floyd-warshall' | 'kruskal' | 'prim';

const PRESETS: { label: string; nodes: GraphNode[]; edges: GraphEdge[] }[] = [
  {
    label: '6-Node Graph',
    nodes: [
      { id: 'A', x: 100, y: 200 }, { id: 'B', x: 250, y: 80 }, { id: 'C', x: 400, y: 80 },
      { id: 'D', x: 250, y: 320 }, { id: 'E', x: 400, y: 320 }, { id: 'F', x: 550, y: 200 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 4 }, { from: 'A', to: 'D', weight: 2 },
      { from: 'B', to: 'C', weight: 3 }, { from: 'B', to: 'D', weight: 1 },
      { from: 'C', to: 'F', weight: 2 }, { from: 'D', to: 'E', weight: 7 },
      { from: 'E', to: 'F', weight: 1 }, { from: 'B', to: 'E', weight: 5 },
    ],
  },
  {
    label: '8-Node Dense',
    nodes: [
      { id: 'A', x: 80, y: 150 }, { id: 'B', x: 200, y: 50 }, { id: 'C', x: 350, y: 50 },
      { id: 'D', x: 500, y: 150 }, { id: 'E', x: 80, y: 300 }, { id: 'F', x: 200, y: 380 },
      { id: 'G', x: 350, y: 380 }, { id: 'H', x: 500, y: 300 },
    ],
    edges: [
      { from: 'A', to: 'B', weight: 3 }, { from: 'A', to: 'E', weight: 4 },
      { from: 'B', to: 'C', weight: 2 }, { from: 'B', to: 'F', weight: 6 },
      { from: 'C', to: 'D', weight: 5 }, { from: 'C', to: 'G', weight: 3 },
      { from: 'D', to: 'H', weight: 2 }, { from: 'E', to: 'F', weight: 1 },
      { from: 'F', to: 'G', weight: 4 }, { from: 'G', to: 'H', weight: 3 },
      { from: 'A', to: 'F', weight: 8 }, { from: 'B', to: 'D', weight: 7 },
    ],
  },
];

interface StepState {
  visitedNodes: Set<string>;
  highlightedEdges: Set<string>;
  mstEdges: Set<string>;
  distances: Map<string, number>;
  currentNode: string | null;
  description: string;
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join('-');
}

function dijkstra(nodes: GraphNode[], edges: GraphEdge[], source: string): StepState[] {
  const adj = new Map<string, { to: string; w: number }[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to, w: e.weight });
    adj.get(e.to)!.push({ to: e.from, w: e.weight });
  }

  const dist = new Map<string, number>();
  const visited = new Set<string>();
  const highlightedEdges = new Set<string>();
  const steps: StepState[] = [];
  for (const n of nodes) dist.set(n.id, Infinity);
  dist.set(source, 0);

  steps.push({ visitedNodes: new Set(), highlightedEdges: new Set(), mstEdges: new Set(), distances: new Map(dist), currentNode: source, description: `Start Dijkstra from ${source}. dist[${source}]=0, all others=∞` });

  for (let i = 0; i < nodes.length; i++) {
    let u: string | null = null;
    let minD = Infinity;
    for (const n of nodes) {
      if (!visited.has(n.id) && dist.get(n.id)! < minD) { minD = dist.get(n.id)!; u = n.id; }
    }
    if (!u) break;
    visited.add(u);

    for (const { to, w } of adj.get(u)!) {
      if (!visited.has(to)) {
        const nd = dist.get(u)! + w;
        if (nd < dist.get(to)!) {
          dist.set(to, nd);
          highlightedEdges.add(edgeKey(u, to));
        }
      }
    }

    steps.push({
      visitedNodes: new Set(visited),
      highlightedEdges: new Set(highlightedEdges),
      mstEdges: new Set(),
      distances: new Map(dist),
      currentNode: u,
      description: `Visit ${u} (dist=${minD}). Relax neighbors.`,
    });
  }
  return steps;
}

function bellmanFord(nodes: GraphNode[], edges: GraphEdge[], source: string): StepState[] {
  const dist = new Map<string, number>();
  const steps: StepState[] = [];
  const highlightedEdges = new Set<string>();
  for (const n of nodes) dist.set(n.id, Infinity);
  dist.set(source, 0);

  steps.push({ visitedNodes: new Set(), highlightedEdges: new Set(), mstEdges: new Set(), distances: new Map(dist), currentNode: source, description: `Bellman-Ford: Initialize dist[${source}]=0` });

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const e of edges) {
      for (const [u, v] of [[e.from, e.to], [e.to, e.from]]) {
        if (dist.get(u)! + e.weight < dist.get(v)!) {
          dist.set(v, dist.get(u)! + e.weight);
          highlightedEdges.add(edgeKey(u, v));
          updated = true;
        }
      }
    }
    steps.push({
      visitedNodes: new Set(nodes.filter(n => dist.get(n.id)! < Infinity).map(n => n.id)),
      highlightedEdges: new Set(highlightedEdges),
      mstEdges: new Set(),
      distances: new Map(dist),
      currentNode: null,
      description: `Iteration ${i + 1}: ${updated ? 'Edges relaxed' : 'No changes'}`,
    });
    if (!updated) break;
  }
  return steps;
}

function floydWarshall(nodes: GraphNode[], edges: GraphEdge[]): StepState[] {
  const n = nodes.length;
  const ids = nodes.map(x => x.id);
  const dist: number[][] = Array.from({ length: n }, () => Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) dist[i][i] = 0;
  for (const e of edges) {
    const i = ids.indexOf(e.from), j = ids.indexOf(e.to);
    dist[i][j] = e.weight;
    dist[j][i] = e.weight;
  }

  const steps: StepState[] = [];
  const distMap = () => {
    const m = new Map<string, number>();
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      m.set(`${ids[i]}->${ids[j]}`, dist[i][j]);
    }
    return m;
  };

  steps.push({ visitedNodes: new Set(), highlightedEdges: new Set(), mstEdges: new Set(), distances: distMap(), currentNode: null, description: 'Floyd-Warshall: Initialize distance matrix' });

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
    steps.push({
      visitedNodes: new Set([ids[k]]),
      highlightedEdges: new Set(),
      mstEdges: new Set(),
      distances: distMap(),
      currentNode: ids[k],
      description: `Intermediate vertex: ${ids[k]}. Update all pairs through ${ids[k]}.`,
    });
  }
  return steps;
}

function kruskal(nodes: GraphNode[], edges: GraphEdge[]): StepState[] {
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();
  for (const n of nodes) { parent.set(n.id, n.id); rank.set(n.id, 0); }

  const find = (x: string): string => { if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!)); return parent.get(x)!; };
  const union = (a: string, b: string): boolean => {
    const ra = find(a), rb = find(b);
    if (ra === rb) return false;
    if (rank.get(ra)! < rank.get(rb)!) parent.set(ra, rb);
    else if (rank.get(ra)! > rank.get(rb)!) parent.set(rb, ra);
    else { parent.set(rb, ra); rank.set(ra, rank.get(ra)! + 1); }
    return true;
  };

  const steps: StepState[] = [];
  const mstEdges = new Set<string>();
  const visited = new Set<string>();

  steps.push({ visitedNodes: new Set(), highlightedEdges: new Set(), mstEdges: new Set(), distances: new Map(), currentNode: null, description: 'Kruskal: Sort edges by weight, initialize Union-Find' });

  for (const e of sorted) {
    const ek = edgeKey(e.from, e.to);
    if (union(e.from, e.to)) {
      mstEdges.add(ek);
      visited.add(e.from);
      visited.add(e.to);
      steps.push({
        visitedNodes: new Set(visited),
        highlightedEdges: new Set([ek]),
        mstEdges: new Set(mstEdges),
        distances: new Map(),
        currentNode: null,
        description: `Add edge ${e.from}↔${e.to} (w=${e.weight}) — no cycle formed`,
      });
    } else {
      steps.push({
        visitedNodes: new Set(visited),
        highlightedEdges: new Set([ek]),
        mstEdges: new Set(mstEdges),
        distances: new Map(),
        currentNode: null,
        description: `Skip edge ${e.from}↔${e.to} (w=${e.weight}) — would form cycle`,
      });
    }
  }
  return steps;
}

function prim(nodes: GraphNode[], edges: GraphEdge[], source: string): StepState[] {
  const adj = new Map<string, { to: string; w: number }[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to, w: e.weight });
    adj.get(e.to)!.push({ to: e.from, w: e.weight });
  }

  const inMST = new Set<string>();
  const mstEdges = new Set<string>();
  const steps: StepState[] = [];
  inMST.add(source);

  steps.push({ visitedNodes: new Set(inMST), highlightedEdges: new Set(), mstEdges: new Set(), distances: new Map(), currentNode: source, description: `Prim: Start from ${source}` });

  while (inMST.size < nodes.length) {
    let bestEdge: { from: string; to: string; w: number } | null = null;
    for (const u of inMST) {
      for (const { to, w } of adj.get(u)!) {
        if (!inMST.has(to)) {
          if (!bestEdge || w < bestEdge.w) bestEdge = { from: u, to, w };
        }
      }
    }
    if (!bestEdge) break;
    inMST.add(bestEdge.to);
    mstEdges.add(edgeKey(bestEdge.from, bestEdge.to));

    steps.push({
      visitedNodes: new Set(inMST),
      highlightedEdges: new Set([edgeKey(bestEdge.from, bestEdge.to)]),
      mstEdges: new Set(mstEdges),
      distances: new Map(),
      currentNode: bestEdge.to,
      description: `Add ${bestEdge.from}↔${bestEdge.to} (w=${bestEdge.w}). MST grows to ${inMST.size} nodes.`,
    });
  }
  return steps;
}

export const GraphAlgorithms: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>('dijkstra');
  const [presetIdx, setPresetIdx] = useState(0);
  const [speed, setSpeed] = useState(700);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [source, setSource] = useState('A');
  const isPlayingRef = useRef(false);

  const preset = PRESETS[presetIdx];

  const runAlgorithm = useCallback(() => {
    let result: StepState[];
    if (algorithm === 'dijkstra') result = dijkstra(preset.nodes, preset.edges, source);
    else if (algorithm === 'bellman-ford') result = bellmanFord(preset.nodes, preset.edges, source);
    else if (algorithm === 'floyd-warshall') result = floydWarshall(preset.nodes, preset.edges);
    else if (algorithm === 'kruskal') result = kruskal(preset.nodes, preset.edges);
    else result = prim(preset.nodes, preset.edges, source);
    setSteps(result);
    setCurrentStep(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [algorithm, preset, source]);

  useEffect(() => { runAlgorithm(); }, [runAlgorithm]);

  // Drawing
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

    const step = steps[currentStep];
    if (!step) return;

    const offsetX = (canvas.offsetWidth - 600) / 2;
    const offsetY = 10;

    // Draw edges
    for (const e of preset.edges) {
      const from = preset.nodes.find(n => n.id === e.from)!;
      const to = preset.nodes.find(n => n.id === e.to)!;
      const ek = edgeKey(e.from, e.to);

      ctx.beginPath();
      ctx.moveTo(from.x + offsetX, from.y + offsetY);
      ctx.lineTo(to.x + offsetX, to.y + offsetY);

      if (step.mstEdges.has(ek)) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
      } else if (step.highlightedEdges.has(ek)) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();

      // Weight label
      const mx = (from.x + to.x) / 2 + offsetX;
      const my = (from.y + to.y) / 2 + offsetY;
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mx, my, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(String(e.weight), mx, my);
    }

    // Draw nodes
    for (const n of preset.nodes) {
      ctx.beginPath();
      ctx.arc(n.x + offsetX, n.y + offsetY, 22, 0, Math.PI * 2);
      if (step.currentNode === n.id) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12;
      } else if (step.visitedNodes.has(n.id)) {
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#3b82f6';
        ctx.shadowBlur = 0;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isDark ? '#64748b' : '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.id, n.x + offsetX, n.y + offsetY);

      // Distance label
      const d = step.distances.get(n.id);
      if (d !== undefined) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(d === Infinity ? '∞' : String(d), n.x + offsetX, n.y + offsetY + 32);
      }
    }
    };
    render();
    const obs = new ResizeObserver(render);
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [currentStep, steps, preset]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    let s = currentStep;
    while (s < steps.length - 1 && isPlayingRef.current) {
      s++;
      setCurrentStep(s);
      await new Promise(r => setTimeout(r, speed));
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [currentStep, steps, speed]);

  const pause = () => { isPlayingRef.current = false; setIsPlaying(false); };

  const isSPAlgo = algorithm === 'dijkstra' || algorithm === 'bellman-ford' || algorithm === 'prim';

  const descriptions: Record<Algorithm, string> = {
    'dijkstra': 'Dijkstra\'s: Greedy shortest-path. O((V+E)log V) with min-heap. No negative weights.',
    'bellman-ford': 'Bellman-Ford: Relaxes all edges V-1 times. O(V·E). Handles negative weights.',
    'floyd-warshall': 'Floyd-Warshall: All-pairs shortest paths via DP. O(V³). Intermediate vertex approach.',
    'kruskal': 'Kruskal\'s MST: Sort edges, add cheapest non-cycle edge. O(E log E). Uses Union-Find.',
    'prim': 'Prim\'s MST: Grow MST from source, always add cheapest crossing edge. O(E log V).',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-emerald-950 p-3 overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          <option value="dijkstra">Dijkstra</option>
          <option value="bellman-ford">Bellman-Ford</option>
          <option value="floyd-warshall">Floyd-Warshall</option>
          <option value="kruskal">Kruskal (MST)</option>
          <option value="prim">Prim (MST)</option>
        </select>

        <select value={presetIdx} onChange={e => setPresetIdx(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
          {PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>

        {isSPAlgo && (
          <select value={source} onChange={e => setSource(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
            {preset.nodes.map(n => <option key={n.id} value={n.id}>Source: {n.id}</option>)}
          </select>
        )}

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input type="range" min={100} max={2000} step={100} value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-24" />
          <span className="text-xs text-gray-500 w-12">{speed}ms</span>
        </div>

        <div className="flex gap-1 ml-auto">
          {!isPlaying ? (
            <button onClick={play} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">▶ Play</button>
          ) : (
            <button onClick={pause} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">⏸ Pause</button>
          )}
          <button onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length - 1))} disabled={isPlaying}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Step →</button>
          <button onClick={runAlgorithm} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">↺ Reset</button>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {descriptions[algorithm]}
      </div>

      <div className="flex-1 min-h-0 relative">
        <canvas ref={canvasRef} className="w-full h-full rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700" />
      </div>

      <div className="mt-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Step {currentStep + 1}/{steps.length}: </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{steps[currentStep]?.description || '—'}</span>
      </div>
    </div>
  );
};
