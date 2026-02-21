import React, { useState, useCallback, useRef, useEffect } from 'react';

interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  x: number;
  y: number;
  highlighted: boolean;
  visited: boolean;
}

type TraversalType = 'bfs' | 'dfs' | 'inorder' | 'preorder' | 'postorder';

const PRESETS = [
  { label: 'Balanced BST', values: [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43] },
  { label: 'Left Skewed', values: [50, 40, 30, 20, 10] },
  { label: 'Right Skewed', values: [10, 20, 30, 40, 50] },
  { label: 'Complete Binary', values: [1, 2, 3, 4, 5, 6, 7] },
  { label: 'Large Tree', values: [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43, 56, 68, 81, 93] },
];

function buildBST(values: number[]): TreeNode | null {
  let root: TreeNode | null = null;
  for (const v of values) {
    root = insertBST(root, v);
  }
  return root;
}

function insertBST(node: TreeNode | null, value: number): TreeNode {
  if (!node) return { value, left: null, right: null, x: 0, y: 0, highlighted: false, visited: false };
  if (value < node.value) node.left = insertBST(node.left, value);
  else if (value > node.value) node.right = insertBST(node.right, value);
  return node;
}

function layoutTree(node: TreeNode | null, x: number, y: number, spread: number): void {
  if (!node) return;
  node.x = x;
  node.y = y;
  layoutTree(node.left, x - spread, y + 70, spread * 0.55);
  layoutTree(node.right, x + spread, y + 70, spread * 0.55);
}

function resetVisited(node: TreeNode | null): void {
  if (!node) return;
  node.highlighted = false;
  node.visited = false;
  resetVisited(node.left);
  resetVisited(node.right);
}

function getTraversalOrder(root: TreeNode | null, type: TraversalType): TreeNode[] {
  const result: TreeNode[] = [];
  if (!root) return result;

  if (type === 'bfs') {
    const queue: TreeNode[] = [root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  } else if (type === 'dfs' || type === 'preorder') {
    const stack: TreeNode[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      result.push(node);
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
  } else if (type === 'inorder') {
    const inorder = (n: TreeNode | null) => {
      if (!n) return;
      inorder(n.left);
      result.push(n);
      inorder(n.right);
    };
    inorder(root);
  } else if (type === 'postorder') {
    const postorder = (n: TreeNode | null) => {
      if (!n) return;
      postorder(n.left);
      postorder(n.right);
      result.push(n);
    };
    postorder(root);
  }
  return result;
}

export const TreeTraversals: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [traversalType, setTraversalType] = useState<TraversalType>('bfs');
  const [preset, setPreset] = useState(0);
  const [speed, setSpeed] = useState(500);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [visitedOrder, setVisitedOrder] = useState<number[]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [traversalSteps, setTraversalSteps] = useState<TreeNode[]>([]);
  const isPlayingRef = useRef(false);
  const animFrameRef = useRef<number>(0);

  const rebuildTree = useCallback((idx: number) => {
    const root = buildBST(PRESETS[idx].values);
    if (root) layoutTree(root, 400, 40, 160);
    setTree(root);
    setCurrentStep(-1);
    setVisitedOrder([]);
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  useEffect(() => { rebuildTree(preset); }, [preset, rebuildTree]);

  useEffect(() => {
    if (tree) {
      resetVisited(tree);
      const steps = getTraversalOrder(tree, traversalType);
      setTraversalSteps(steps);
      setCurrentStep(-1);
      setVisitedOrder([]);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [traversalType, tree]);

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tree) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
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
      const cw = w;
      const ch = h;
      const offsetX = cw / 2 - 400;
      const offsetY = 20;

      const drawEdges = (node: TreeNode | null) => {
        if (!node) return;
        if (node.left) {
          ctx.beginPath();
          ctx.moveTo(node.x + offsetX, node.y + offsetY);
          ctx.lineTo(node.left.x + offsetX, node.left.y + offsetY);
          ctx.strokeStyle = node.left.visited ? '#22c55e' : '#64748b';
          ctx.lineWidth = node.left.visited ? 2.5 : 1.5;
          ctx.stroke();
        }
        if (node.right) {
          ctx.beginPath();
          ctx.moveTo(node.x + offsetX, node.y + offsetY);
          ctx.lineTo(node.right.x + offsetX, node.right.y + offsetY);
          ctx.strokeStyle = node.right.visited ? '#22c55e' : '#64748b';
          ctx.lineWidth = node.right.visited ? 2.5 : 1.5;
          ctx.stroke();
        }
        drawEdges(node.left);
        drawEdges(node.right);
      };

      const drawNodes = (node: TreeNode | null) => {
        if (!node) return;
        drawNodes(node.left);
        drawNodes(node.right);
        ctx.beginPath();
        ctx.arc(node.x + offsetX, node.y + offsetY, 20, 0, Math.PI * 2);
        if (node.highlighted) {
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
        } else if (node.visited) {
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
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.value), node.x + offsetX, node.y + offsetY);
      };

      drawEdges(tree);
      drawNodes(tree);
    };

    draw();
    animFrameRef.current = requestAnimationFrame(draw);
    const obs = new ResizeObserver(draw);
    obs.observe(canvas);
    return () => { cancelAnimationFrame(animFrameRef.current); obs.disconnect(); };
  }, [tree, currentStep]);

  const stepForward = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= traversalSteps.length) return prev;
      if (prev >= 0) {
        traversalSteps[prev].highlighted = false;
        traversalSteps[prev].visited = true;
      }
      traversalSteps[next].highlighted = true;
      setVisitedOrder(vo => [...vo, traversalSteps[next].value]);
      return next;
    });
  }, [traversalSteps]);

  const play = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setIsPlaying(true);

    let step = currentStep;
    while (step < traversalSteps.length - 1 && isPlayingRef.current) {
      step++;
      if (step > 0) {
        traversalSteps[step - 1].highlighted = false;
        traversalSteps[step - 1].visited = true;
      }
      traversalSteps[step].highlighted = true;
      setCurrentStep(step);
      setVisitedOrder(vo => [...vo, traversalSteps[step].value]);
      await new Promise(r => setTimeout(r, speed));
    }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [currentStep, traversalSteps, speed]);

  const pause = () => { isPlayingRef.current = false; setIsPlaying(false); };

  const reset = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (tree) resetVisited(tree);
    setCurrentStep(-1);
    setVisitedOrder([]);
    setTree(t => ({ ...t! }));
  }, [tree]);

  const descriptions: Record<TraversalType, string> = {
    bfs: 'Breadth-First Search: Visit all nodes level by level using a queue. O(n) time, O(w) space where w = max width.',
    dfs: 'Depth-First Search (stack-based): Explore as deep as possible before backtracking. O(n) time, O(h) space.',
    inorder: 'Inorder (Left → Root → Right): Visits BST nodes in sorted ascending order. O(n) time.',
    preorder: 'Preorder (Root → Left → Right): Root is visited first. Used for tree copying/serialization. O(n) time.',
    postorder: 'Postorder (Left → Right → Root): Children processed before parent. Used for deletion. O(n) time.',
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-950 dark:to-indigo-950 p-3 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <select
          value={traversalType}
          onChange={e => setTraversalType(e.target.value as TraversalType)}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        >
          <option value="bfs">BFS (Level Order)</option>
          <option value="dfs">DFS (Stack)</option>
          <option value="inorder">Inorder</option>
          <option value="preorder">Preorder</option>
          <option value="postorder">Postorder</option>
        </select>

        <select
          value={preset}
          onChange={e => setPreset(Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        >
          {PRESETS.map((p, i) => (
            <option key={i} value={i}>{p.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <input
            type="range" min={50} max={1500} step={50} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-xs text-gray-500 w-12">{speed}ms</span>
        </div>

        <div className="flex gap-1 ml-auto">
          {!isPlaying ? (
            <button onClick={play} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">▶ Play</button>
          ) : (
            <button onClick={pause} className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">⏸ Pause</button>
          )}
          <button onClick={stepForward} disabled={isPlaying} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Step →</button>
          <button onClick={reset} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">↺ Reset</button>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 mb-2">
        {descriptions[traversalType]}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700"
        />
      </div>

      {/* Visited Order */}
      <div className="mt-2 bg-white/60 dark:bg-gray-800/60 rounded-lg p-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Visit Order: </span>
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {visitedOrder.length > 0 ? visitedOrder.join(' → ') : '—'}
        </span>
        <span className="text-xs text-gray-400 ml-3">
          ({currentStep + 1}/{traversalSteps.length} nodes)
        </span>
      </div>
    </div>
  );
};
